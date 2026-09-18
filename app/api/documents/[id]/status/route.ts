import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/data/auth";
import { getDocument } from "@/lib/data/documents";
import { handleRouteError, jsonError } from "@/lib/api";
import { isDemoMode } from "@/lib/env";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/documents/[id]/status">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    const document = await getDocument(id);
    if (!document) return jsonError("That document no longer exists.", 404);
    if (!isDemoMode() && document.userId !== user.id) {
      return jsonError("That document isn't yours.", 403);
    }

    return Response.json({
      id: document.id,
      filename: document.filename,
      status: document.status,
      pageCount: document.pageCount,
      chunkCount: document.chunkCount,
      errorMessage: document.errorMessage,
    });
  } catch (cause) {
    return handleRouteError(cause, "GET /api/documents/[id]/status");
  }
}
