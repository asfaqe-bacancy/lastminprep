import { askFollowUpQuestion } from "@/lib/ai/interview";
import { listTopics } from "@/lib/data/preparations";
import { addMessage, getSession, listMessages } from "@/lib/data/interview";
import { interviewDocumentIds } from "@/lib/data/interview-context";
import { recalculateProgress } from "@/lib/data/progress";
import { INTERVIEW_LENGTH } from "@/lib/constants";
import {
  handleRouteError,
  jsonError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Records an answer and asks the follow-up.
 *
 * No marking happens here. The candidate finds out how they did in the report,
 * which is what makes the practice feel like a real interview
 * (PRD section 16).
 */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });
    const answer = requireString(body.answer, "answer", { max: 5000 });

    await loadOwnedPreparation(preparationId);
    requireGemini();

    const session = await getSession(preparationId);
    if (!session) return jsonError("That interview hasn't started.", 404);
    if (session.status === "completed") {
      return jsonError("That interview is already finished.", 409);
    }

    await addMessage({
      sessionId: session.id,
      role: "user",
      content: answer,
      questionNumber: null,
    });

    const messages = await listMessages(session.id);
    const asked = messages.filter(
      (message) => message.role === "interviewer",
    ).length;

    await recalculateProgress(preparationId);

    // Out of questions: the client asks for the report next.
    if (asked >= INTERVIEW_LENGTH) {
      return Response.json({
        done: true,
        messages,
        total: INTERVIEW_LENGTH,
      });
    }

    const topics = (await listTopics(preparationId)).map((topic) => topic.name);
    const documentIds = await interviewDocumentIds(preparationId);

    const followUp = await askFollowUpQuestion({
      preparationId,
      topics,
      messages,
      documentIds,
      total: INTERVIEW_LENGTH,
    });

    const question = await addMessage({
      sessionId: session.id,
      role: "interviewer",
      content: followUp.question,
      questionNumber: asked + 1,
      topic: followUp.topic,
    });

    return Response.json({
      done: false,
      messages: [...messages, question],
      total: INTERVIEW_LENGTH,
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/interview/answer");
  }
}
