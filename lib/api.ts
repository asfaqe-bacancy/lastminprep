import { ValidationError } from "@/lib/validation";

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
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

  console.error(`[${context}]`, cause);

  const message =
    cause instanceof Error && /GEMINI_API_KEY|SUPABASE/.test(cause.message)
      ? cause.message
      : "Something went wrong on our side. Try again in a moment.";

  return jsonError(message, 500);
}
