import { cacheLife } from "next/cache";

// The always-rendered shell depends on this cached value. Unlike the closed
// issue #96289, nothing calls revalidateTag: the short revalidate window makes
// the regeneration happen on its own, which is what the app this was reduced
// from does (a 5 minute cacheLife on a feature-flag read in its root layout).
export async function getShellData() {
  "use cache";
  cacheLife("seconds");

  return { label: "cached shell value" };
}
