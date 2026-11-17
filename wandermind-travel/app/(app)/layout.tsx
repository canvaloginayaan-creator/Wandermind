import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/shell/AppShell";

/**
 * Every page inside this layout reads the logged-in user from SQLite and from the
 * request cookie, so none of them may be prerendered at build time: on Vercel the
 * build machine has no database, and `next build` would fail with
 * "No usable SQLite driver" while exporting /trips/new.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}
