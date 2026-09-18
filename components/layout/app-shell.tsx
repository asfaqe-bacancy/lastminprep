import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { MobileTopBar } from "./mobile-top-bar";
import { cn } from "@/lib/utils";

/**
 * Desktop: minimal sidebar + wide content.
 * Mobile: single column, bottom navigation, sticky primary actions.
 * Not a shrunken desktop layout (PRD section 3).
 */
export function AppShell({
  children,
  signedIn = false,
  wide = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <Sidebar signedIn={signedIn} />
      <div className="flex min-h-dvh flex-col">
        <MobileTopBar />
        <main
          className={cn(
            "mx-auto w-full flex-1 px-5 pt-5 pb-28 sm:px-7 lg:px-10 lg:pt-9 lg:pb-16",
            wide ? "max-w-6xl" : "max-w-5xl",
          )}
        >
          {children}
        </main>
      </div>
      <MobileNav signedIn={signedIn} />
    </div>
  );
}
