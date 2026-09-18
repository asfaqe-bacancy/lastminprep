import { evaluateAnswer } from "@/lib/ai/quiz";
import { getQuestion, saveAnswer } from "@/lib/data/quiz";
import { recalculateProgress } from "@/lib/data/progress";
import {
  handleRouteError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Marks one answer, stores it, and moves the progress figure. */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const questionId = requireString(body.questionId, "questionId", {
      max: 64,
    });
    // A blank answer is a legitimate submission: it gets marked as incorrect
    // with the answer explained, rather than being rejected.
    const userAnswer =
      typeof body.answer === "string" ? body.answer.slice(0, 5000) : "";

    const question = await getQuestion(questionId);
    if (!question) {
      return Response.json({ error: "That question is gone." }, { status: 404 });
    }

    const { user } = await loadOwnedPreparation(question.preparationId);
    requireGemini();

    const evaluation = await evaluateAnswer({
      preparationId: question.preparationId,
      question: question.question,
      expectedAnswer: question.expectedAnswer,
      userAnswer,
      sourceChunkIds: question.sourceChunkIds,
    });

    const answer = await saveAnswer({
      questionId,
      userId: user.id,
      userAnswer,
      verdict: evaluation.verdict,
      feedback: evaluation.feedback,
      missing: evaluation.missing,
      score: evaluation.score,
    });

    const progress = await recalculateProgress(question.preparationId);

    return Response.json({
      answer,
      sources: evaluation.sources,
      progress,
    });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/quiz/evaluate");
  }
}
