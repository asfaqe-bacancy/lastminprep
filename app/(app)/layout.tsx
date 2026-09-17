import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/data/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <AppShell signedIn={Boolean(user)}>{children}</AppShell>;
}
