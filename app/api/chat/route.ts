import { requireApiUser } from "@/lib/data/auth";
import { getPreparation } from "@/lib/data/preparations";
import { streamAnswer } from "@/lib/ai/rag";
import { isDemoMode, isGeminiConfigured } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/api";
import {
  asRecord,
  requireString,
  requireStringArray,
} from "@/lib/validation";
import { RETRIEVAL_TOP_K } from "@/lib/constants";

export const runtime = "nodejs";

const NEEDS_GEMINI =
  "Add GEMINI_API_KEY to .env.local and restart the dev server, and I'll answer from your material. The sources below are what I would have used.";

/**
 * Grounded question answering, streamed.
 *
 * The response is newline-delimited JSON. Sources arrive first so the UI can
 * show where an answer is coming from while the text is still being written.
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = asRecord(await request.json());

    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });
    const question = requireString(body.question, "question", { max: 2000 });
    const documentIds =
      body.documentIds === undefined
        ? undefined
        : requireStringArray(body.documentIds, "documentIds", { max: 10 });

    const history = parseHistory(body.history);

    const preparation = await getPreparation(preparationId);
    if (!preparation) return jsonError("That preparation no longer exists.", 404);
    if (!isDemoMode() && preparation.userId !== user.id) {
      return jsonError("That preparation isn't yours.", 403);
    }

    const encoder = new TextEncoder();
    const line = (value: unknown) =>
      encoder.encode(`${JSON.stringify(value)}\n`);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!isGeminiConfigured()) {
            // Retrieval still works, so show the sources and say plainly why
            // there is no answer rather than inventing one.
            const { retrieveChunks, toCitations } = await import("@/lib/ai/rag");
            const chunks = await retrieveChunks({
              preparationId,
              query: question,
              topK: RETRIEVAL_TOP_K,
              documentIds,
            });
            controller.enqueue(
              line({
                type: "sources",
                sources: toCitations(chunks),
                grounded: false,
              }),
            );
            controller.enqueue(line({ type: "text", text: NEEDS_GEMINI }));
            controller.close();
            return;
          }

          for await (const event of streamAnswer({
            preparationId,
            question,
            history,
            documentIds,
          })) {
            controller.enqueue(line(event));
          }
          controller.close();
        } catch (cause) {
          console.error("[POST /api/chat]", cause);
          controller.enqueue(
            line({
              type: "error",
              message:
                cause instanceof Error
                  ? cause.message
                  : "That answer didn't come through.",
            }),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/chat");
  }
}

function parseHistory(
  value: unknown,
): { role: "user" | "coach"; content: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-6)
    .map((entry) => {
      const record = asRecord(entry);
      const role = record.role === "coach" ? "coach" : "user";
      const content = requireString(record.content, "history.content", {
        max: 4000,
      });
      return { role, content } as const;
    })
    .filter((entry) => entry.content.length > 0);
}
