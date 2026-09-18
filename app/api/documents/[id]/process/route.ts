import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/data/auth";
import { getDocument } from "@/lib/data/documents";
import { processDocument } from "@/lib/documents/pipeline";
import { simulateProcessing } from "@/lib/demo/simulate";
import { isDemoMode } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/api";

export const runtime = "nodejs";
/** Extraction and embedding of a large PDF can take a while. */
export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/documents/[id]/process">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    const document = await getDocument(id);
    if (!document) return jsonError("That document no longer exists.", 404);

    if (isDemoMode()) {
      simulateProcessing(document.id);
      return Response.json({ status: "processing" });
    }

    if (document.userId !== user.id) {
      return jsonError("That document isn't yours.", 403);
    }

    await processDocument(document.id);

    const updated = await getDocument(id);
    return Response.json({
      status: updated?.status ?? "failed",
      chunkCount: updated?.chunkCount ?? null,
      pageCount: updated?.pageCount ?? null,
      errorMessage: updated?.errorMessage ?? null,
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/documents/[id]/process");
  }
}
