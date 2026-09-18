import { askOpeningQuestion } from "@/lib/ai/interview";
import { listTopics } from "@/lib/data/preparations";
import { addMessage, listMessages, startSession } from "@/lib/data/interview";
import { interviewDocumentIds } from "@/lib/data/interview-context";
import { INTERVIEW_LENGTH } from "@/lib/constants";
import {
  handleRouteError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Opens an interview, or returns the one already in progress so a refresh
 * doesn't wipe the transcript.
 */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });

    const { user } = await loadOwnedPreparation(preparationId);
    requireGemini();

    const session = await startSession(preparationId, user.id);
    const existing = await listMessages(session.id);

    if (existing.length > 0) {
      return Response.json({
        sessionId: session.id,
        status: session.status,
        messages: existing,
        total: INTERVIEW_LENGTH,
        report: session.report,
      });
    }

    const topics = (await listTopics(preparationId)).map((topic) => topic.name);
    const documentIds = await interviewDocumentIds(preparationId);

    const opening = await askOpeningQuestion({
      preparationId,
      topics,
      documentIds,
    });

    const message = await addMessage({
      sessionId: session.id,
      role: "interviewer",
      content: opening.question,
      questionNumber: 1,
      topic: opening.topic,
    });

    return Response.json({
      sessionId: session.id,
      status: "active",
      messages: [message],
      total: INTERVIEW_LENGTH,
      report: null,
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/interview/start");
  }
}
