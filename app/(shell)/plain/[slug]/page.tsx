import type { Metadata } from "next";
import { cookies } from "next/headers";

// Control: identical metadata pattern on a non-optional dynamic segment.
export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  return { title: store.get("title")?.value ?? "Plain dynamic title" };
}

export default function Page() {
  return <main>plain dynamic body</main>;
}
