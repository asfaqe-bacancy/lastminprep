import { extractPdf } from "@/lib/documents/parser";
import { chunkPages, estimateTokens } from "@/lib/documents/chunker";
import { handleRouteError, jsonError } from "@/lib/api";
import { requirePdf } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Development-only inspector for the extract → clean → chunk steps
 * (RAG doc, section 17). Returns 404 in production so it can't be reached.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not found", 404);
  }

  try {
    const form = await request.formData();
    const file = requirePdf(form.get("file"));

    // Chunk sizes are meant to be tuned against real documents, so the
    // inspector lets them be overridden per request.
    const url = new URL(request.url);
    const targetChars = Number(url.searchParams.get("targetChars")) || undefined;
    const overlapChars =
      url.searchParams.get("overlapChars") !== null
        ? Number(url.searchParams.get("overlapChars"))
        : undefined;

    const parsed = await extractPdf(new Uint8Array(await file.arrayBuffer()));
    const chunks = chunkPages(parsed.pages, { targetChars, overlapChars });

    return Response.json({
      filename: file.name,
      pageCount: parsed.pageCount,
      pagesWithText: parsed.pages.length,
      totalCharacters: parsed.pages.reduce(
        (sum, page) => sum + page.text.length,
        0,
      ),
      chunkCount: chunks.length,
      chunkChars: {
        min: Math.min(...chunks.map((chunk) => chunk.content.length)),
        max: Math.max(...chunks.map((chunk) => chunk.content.length)),
        mean: Math.round(
          chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) /
            chunks.length,
        ),
      },
      estimatedTokens: chunks.map((chunk) => estimateTokens(chunk.content)),
      pages: parsed.pages.map((page) => ({
        pageNumber: page.pageNumber,
        preview: page.text.slice(0, 300),
      })),
      chunks: chunks.map((chunk) => ({
        index: chunk.index,
        pageNumber: chunk.pageNumber,
        chars: chunk.content.length,
        content: chunk.content,
      })),
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/debug/document");
  }
}
