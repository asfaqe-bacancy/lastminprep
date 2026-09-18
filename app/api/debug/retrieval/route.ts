import { requireApiUser } from "@/lib/data/auth";
import { retrieveChunks } from "@/lib/ai/rag";
import { handleRouteError, jsonError } from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Retrieval inspector (RAG doc, section 17). Shows what came back and how
 * similar it was, which is the fastest way to tell whether a bad answer is a
 * retrieval problem or a prompting one.
 *
 * Development only — returns 404 in production.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not found", 404);
  }

  try {
    await requireApiUser();
    const body = asRecord(await request.json());

    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });
    const query = requireString(body.query, "query", { max: 2000 });
    const topK = Number(body.topK) || undefined;

    const started = Date.now();
    const chunks = await retrieveChunks({
      preparationId,
      query,
      topK,
      // No floor here: seeing the near-misses is the point of this view.
      minSimilarity: 0,
    });

    return Response.json({
      query,
      tookMs: Date.now() - started,
      count: chunks.length,
      chunks: chunks.map((chunk, index) => ({
        rank: index + 1,
        similarity: Number(chunk.similarity.toFixed(4)),
        filename: chunk.filename,
        pageNumber: chunk.pageNumber,
        chars: chunk.content.length,
        content: chunk.content,
      })),
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/debug/retrieval");
  }
}
