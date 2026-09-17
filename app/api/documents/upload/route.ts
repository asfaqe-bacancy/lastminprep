import { requireUser } from "@/lib/data/auth";
import { createDocument, updateDocument } from "@/lib/data/documents";
import { getPreparation } from "@/lib/data/preparations";
import { uploadDocumentFile } from "@/lib/supabase/storage";
import { simulateProcessing } from "@/lib/demo/simulate";
import { isDemoMode } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/api";
import {
  requireDocumentRole,
  requirePdf,
  requireString,
} from "@/lib/validation";

/** Extraction reads the whole PDF in memory, so stay on Node. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();

    const preparationId = requireString(
      form.get("preparationId"),
      "preparationId",
      { max: 64 },
    );
    const role = requireDocumentRole(form.get("role"));
    const file = requirePdf(form.get("file"));

    // Ownership is checked server-side; the client's word is never enough.
    const preparation = await getPreparation(preparationId);
    if (!preparation) return jsonError("That preparation no longer exists.", 404);
    if (!isDemoMode() && preparation.userId !== user.id) {
      return jsonError("That preparation isn't yours.", 403);
    }

    if (isDemoMode()) {
      const document = await createDocument({
        preparationId,
        userId: user.id,
        filename: file.name,
        fileType: "application/pdf",
        fileSize: file.size,
        fileUrl: null,
        role,
      });
      simulateProcessing(document.id);
      return Response.json({ id: document.id }, { status: 201 });
    }

    const path = await uploadDocumentFile(user.id, preparationId, file);

    const document = await createDocument({
      preparationId,
      userId: user.id,
      filename: file.name,
      fileType: "application/pdf",
      fileSize: file.size,
      fileUrl: path,
      role,
    });

    await updateDocument(document.id, { status: "extracting" });

    return Response.json({ id: document.id }, { status: 201 });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/documents/upload");
  }
}
