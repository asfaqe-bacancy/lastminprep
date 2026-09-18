import type { Preparation } from "@/types";
import { ValidationError } from "@/lib/validation";
import { HttpError } from "@/lib/errors";
import { getPreparation } from "@/lib/data/preparations";
import { requireApiUser, type CurrentUser } from "@/lib/data/auth";
import { isDemoMode, isGeminiConfigured } from "@/lib/env";

export { HttpError };

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Loads a preparation and proves the caller owns it.
 *
 * Every route that touches a preparation goes through this, so ownership is
 * checked in exactly one place and never inferred from the request body.
 */
export async function loadOwnedPreparation(
  preparationId: string,
): Promise<{ user: CurrentUser; preparation: Preparation }> {
  const user = await requireApiUser();
  const preparation = await getPreparation(preparationId);

  if (!preparation) {
    throw new HttpError("That preparation no longer exists.", 404);
  }
  if (!isDemoMode() && preparation.userId !== user.id) {
    throw new HttpError("That preparation isn't yours.", 403);
  }

  return { user, preparation };
}

/** Guards the routes that cannot do anything useful without a model. */
export function requireGemini(): void {
  if (!isGeminiConfigured()) {
    throw new HttpError(
      "Add GEMINI_API_KEY to .env.local and restart the dev server to use this.",
      503,
    );
  }
}

/**
 * One place to turn a thrown error into a response the UI can show.
 * Validation problems are the user's to fix; everything else is logged and
 * reported generically so internal detail never reaches the browser.
 */
export function handleRouteError(cause: unknown, context: string): Response {
  if (cause instanceof ValidationError) {
    return jsonError(cause.message, 400);
  }
  if (cause instanceof HttpError) {
    return jsonError(cause.message, cause.status);
  }

  console.error(`[${context}]`, cause);

  const message =
    cause instanceof Error && /GEMINI_API_KEY|SUPABASE/.test(cause.message)
      ? cause.message
      : "Something went wrong on our side. Try again in a moment.";

  return jsonError(message, 500);
}
