"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, FileText, LogOut, Plus, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

const MORE_LINKS = [
  { href: "/documents", label: "Documents", Icon: FileText },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function MobileNav({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_LINKS.some((link) => isActive(pathname, link.href));

  return (
    <>
      <nav
        aria-label="Main"
        className="liquid rounded-none border-x-0 border-b-0 fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5 items-end px-1 pt-1.5 pb-1">
          {MOBILE_NAV.slice(0, 2).map((item) => (
            <NavSlot key={item.href} {...item} pathname={pathname} />
          ))}

          <li className="flex justify-center">
            <Link
              href="/preparations/new"
              aria-label="New preparation"
              className="press bg-brand text-brand-foreground -mt-1 flex size-12 items-center justify-center rounded-full shadow-raised"
            >
              <Plus className="size-5" aria-hidden />
            </Link>
          </li>

          {MOBILE_NAV.slice(2).map((item) => (
            <NavSlot key={item.href} {...item} pathname={pathname} />
          ))}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              className={cn(
                "flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-tight text-[0.6875rem] transition-colors",
                moreActive ? "text-brand-text font-medium" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-surface gap-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-5 pb-2">
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">
              Additional navigation and preferences
            </SheetDescription>
          </SheetHeader>

          <ul className="px-3">
            {MORE_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-tight hover:bg-muted flex min-h-12 items-center gap-3 px-2.5 text-[0.9375rem]"
                >
                  <Icon className="text-muted-foreground size-4.5" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between border-t px-5 pt-4">
            <span className="text-muted-foreground text-sm">Appearance</span>
            <ThemeToggle />
          </div>

          {signedIn && (
            <form action="/auth/sign-out" method="post" className="px-3 pt-2">
              <button
                type="submit"
                className="rounded-tight hover:bg-muted text-muted-foreground flex min-h-12 w-full items-center gap-3 px-2.5 text-[0.9375rem]"
              >
                <LogOut className="size-4.5" aria-hidden />
                Sign out
              </button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NavSlot({
  href,
  label,
  Icon,
  pathname,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const active = isActive(pathname, href);
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "rounded-tight flex min-h-12 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors",
          active ? "text-brand-text font-medium" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
        {label}
      </Link>
    </li>
  );
}
