import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/data/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  // Demo mode has a stand-in user but no session to sign out of.
  const signedIn = Boolean(user) && isSupabaseConfigured();
  return <AppShell signedIn={signedIn}>{children}</AppShell>;
}
