import type { Metadata } from "next";
import { cookies } from "next/headers";

// Request-time metadata: the resulting <title> is postponed and has to resume.
export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  return { title: store.get("title")?.value ?? "Optional catch-all title" };
}

export default function Page() {
  return <main>optional catch-all body</main>;
}
