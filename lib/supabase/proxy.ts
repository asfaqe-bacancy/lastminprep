import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Refreshes the Supabase session on every request.
 *
 * Access tokens are short-lived, so without this a user is signed out as soon
 * as one expires. The refreshed cookies have to be written onto the response
 * that is actually returned, which is why the response object is rebuilt here
 * rather than created by the caller.
 */
export async function refreshSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, userId: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() revalidates the token with Supabase; getSession() would trust
  // whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
