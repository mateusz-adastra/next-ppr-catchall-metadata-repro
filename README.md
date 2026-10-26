# PPR resume replay fails for optional catch-all routes on `cacheLife` regeneration (16.3.1)

Reduced from a production app. This looks like a sibling of the closed
[#96289](https://github.com/vercel/next.js/issues/96289), which was fixed in
`16.2.1-canary.17` via #91902 and shipped in `16.3.0`.

Differences from that issue:

- It reproduces on **`next@16.3.1`**, i.e. with that fix present.
- **Nothing calls `revalidateTag`.** The regeneration that breaks the route is
  driven by `cacheLife`'s own revalidate window on a cached value in the shell.

## Structure

| File | Role |
| --- | --- |
| `app/(shell)/[[...slug]]/page.tsx` | optional catch-all; `generateMetadata()` reads `cookies()`, so the `<title>` is postponed and must resume |
| `app/(shell)/layout.tsx` | awaits the cached value — a cached dependency of the always-rendered shell |
| `app/shell-data.ts` | `"use cache"` + `cacheLife("seconds")` (revalidate 1s, expire 60s) |
| `app/(shell)/plain/[slug]/page.tsx` | control: identical metadata on a non-optional dynamic segment |

`cacheComponents: true` is set in `next.config.ts`. `instant = false` on the
shell layout mirrors the original app, where the shell blocks on request data.

## Reproduce

Deploy to Vercel. The degraded output does **not** appear with
`next build && next start` locally — verified here over 8 requests spanning
several revalidate windows, all healthy — so it needs Vercel's serving path.

```bash
# 1. populate the path while it is healthy
curl -s https://<deployment>/a | grep -o '<title>[^<]*</title>'
#    <title>Optional catch-all title</title>

# 2. keep requesting past the revalidate window, so a regeneration of the
#    already-cached path runs
for i in $(seq 1 10); do
  curl -s https://<deployment>/a \
    | grep -Eo '<title>[^<]*</title>|\$RX\("[^"]*","[0-9]*"\)'
  sleep 30
done
```

**Expected:** every response carries `<title>`, as the first one did.

**Actual:** after a regeneration, responses have **no `<title>`** and carry a
client-render-fallback instruction such as `$RX("B:0","<digest>")`. The degraded
copy is then served from the CDN (`x-vercel-cache: STALE`/`HIT`, `age` climbing),
so every client — including no-JS crawlers and social scrapers — gets an untitled
page until the entry is evicted. Server function logs show, per affected request:

```
Error: Couldn't find all resumable slots by key/index during replaying.
The tree doesn't match so React will fallback to client rendering.
```

Note the timing: a freshly deployed URL answers correctly for its first requests
and only degrades once a regeneration of an already-cached path has run. An early
clean response proves nothing.

## Controls that stay healthy on the same deployment

- `/` — same optional catch-all route, empty slug.
- `/plain/a` — non-optional `[slug]`, identical metadata and shell.

In the original app, replacing the optional catch-all with a static index route
plus a non-optional `[slug]` route resolved it, with no other change.

## Possibly related: a build-time cache miss

`next build` logs this even though the build succeeds:

```
Error: Unexpected cache miss after cache warming phase during prerendering. This is
likely caused by non-deterministic arguments that differ between the cache warming
phase and the final prerender phase (e.g. unstable array order).
    at async ShellLayout (app/(shell)/layout.tsx)
```

`getShellData()` takes no arguments and returns a constant, so there is nothing
non-deterministic to point at. It is tied to the optional catch-all: with
`app/(shell)/[[...slug]]` present the build logs it once, and with that directory
removed (leaving only `plain/[slug]`) it logs zero. That may be the same
prerender/replay key mismatch showing up at build time.

## Environment

- `next@16.3.1` (Turbopack build), `react@19.2.7`, `react-dom@19.2.7`
- Node.js v22.19.0
- Deployed on Vercel; also run locally with `next build && next start` (healthy)
- also run locally
