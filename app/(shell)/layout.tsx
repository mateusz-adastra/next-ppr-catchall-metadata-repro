import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { getShellData } from "../shell-data";

// Matches the app this was reduced from: the shell blocks on request data, so
// the routes under it are allowed to block.
export const instant = false;

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Request-time read in the shell, alongside the cached value below. Without
  // it the route's CDN entry never expires, so the regeneration that triggers
  // the bug never runs.
  const store = await cookies();
  const shell = await getShellData();

  return (
    <>
      <header data-session={store.get("session")?.value ?? "none"}>
        {shell.label}
      </header>
      {children}
    </>
  );
}
