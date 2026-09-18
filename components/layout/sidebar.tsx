"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, isActive } from "./nav-items";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="border-hairline bg-sidebar sticky top-0 hidden h-dvh flex-col border-r px-4 py-5 lg:flex">
      <Wordmark className="mb-7 px-2" />

      <Link
        href="/preparations/new"
        className="press bg-brand text-brand-foreground rounded-tight mb-6 flex h-10 items-center justify-center gap-1.5 text-sm font-medium shadow-soft"
      >
        <Plus className="size-4" aria-hidden />
        New preparation
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col">
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-tight flex h-9 items-center gap-2.5 px-2.5 text-sm transition-colors duration-150 ease-[var(--ease-ios)]",
                    active
                      ? "bg-sidebar-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-4", active && "text-brand-text")}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto space-y-0.5 pt-6">
          <div className="bg-sidebar-border mx-2.5 mb-3 h-px" />
          {SECONDARY_NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-tight flex h-9 items-center gap-2.5 px-2.5 text-sm transition-colors duration-150 ease-[var(--ease-ios)]",
                  active
                    ? "bg-sidebar-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
          {signedIn && (
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground flex h-9 w-full items-center gap-2.5 rounded-tight px-2.5 text-sm transition-colors duration-150"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </form>
          )}
          <div className="px-2.5 pt-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </aside>
  );
}
