import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Renamed from `middleware.ts` in Next.js 16. Runs on the Node runtime.
 *
 * Two jobs: keep the Supabase session fresh, and bounce signed-out visitors
 * away from the app before a page starts rendering. This is an optimistic
 * check only — every page and route still proves ownership for itself.
 *
 * With no Supabase project configured the app runs on preview data, so this
 * gets out of the way entirely.
 */
const PROTECTED = [
  "/dashboard",
  "/preparations",
  "/documents",
  "/progress",
  "/settings",
];

const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  const { response, userId } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (needsAuth && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // So sign-in can send them back where they were heading.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
