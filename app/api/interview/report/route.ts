import { writeInterviewReport } from "@/lib/ai/interview";
import {
  completeSession,
  getSession,
  listMessages,
} from "@/lib/data/interview";
import { interviewDocumentIds } from "@/lib/data/interview-context";
import { recalculateProgress } from "@/lib/data/progress";
import {
  handleRouteError,
  jsonError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Closes the interview and writes the report. */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });

    const { preparation } = await loadOwnedPreparation(preparationId);
    requireGemini();

    const session = await getSession(preparationId);
    if (!session) return jsonError("That interview hasn't started.", 404);

    // Already written: return it rather than paying for it twice.
    if (session.status === "completed" && session.report) {
      return Response.json({ report: session.report });
    }

    const messages = await listMessages(session.id);
    const documentIds = await interviewDocumentIds(preparationId);

    const report = await writeInterviewReport({
      preparationId,
      type: preparation.type,
      messages,
      documentIds,
    });

    await completeSession(session.id, report);
    await recalculateProgress(preparationId);

    return Response.json({ report });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/interview/report");
  }
}
