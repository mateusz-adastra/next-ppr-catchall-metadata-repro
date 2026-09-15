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
  const shell = await getShellData();

  return (
    <>
      <header>{shell.label}</header>
      {children}
    </>
  );
}
