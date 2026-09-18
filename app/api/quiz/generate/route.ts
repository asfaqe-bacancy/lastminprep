import { generateQuestions } from "@/lib/ai/quiz";
import { listTopics } from "@/lib/data/preparations";
import { listQuestions, saveQuestions } from "@/lib/data/quiz";
import { getTopicPerformance } from "@/lib/data/progress";
import { QUIZ_LENGTH } from "@/lib/constants";
import {
  handleRouteError,
  jsonError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import {
  asRecord,
  requireString,
  requireStringArray,
} from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * Writes a round of questions.
 *
 * `focus: "weak"` targets the topics the user has actually scored badly on,
 * which is what the "practice weak areas" action uses (PRD section 15).
 */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });
    const focus = body.focus === "weak" ? "weak" : "plan";
    const requested = Number(body.count);
    const count = Number.isFinite(requested)
      ? Math.min(10, Math.max(1, Math.round(requested)))
      : QUIZ_LENGTH;

    const { preparation } = await loadOwnedPreparation(preparationId);
    requireGemini();

    const existing = await listQuestions(preparationId);

    // An explicit topic wins: the learn screen asks for a question about the
    // topic being read right now.
    const requestedTopics =
      body.topics === undefined
        ? null
        : requireStringArray(body.topics, "topics", { max: 4 });

    let topics: string[];
    if (requestedTopics && requestedTopics.length > 0) {
      topics = requestedTopics;
    } else if (focus === "weak") {
      const performance = await getTopicPerformance(preparationId);
      topics = performance
        .filter((entry) => entry.score < 70)
        .slice(0, 3)
        .map((entry) => entry.name);

      if (topics.length === 0) {
        return jsonError(
          "Nothing is lagging behind yet — answer a few questions first.",
          409,
        );
      }
    } else {
      const planned = await listTopics(preparationId);
      topics = planned
        .filter((topic) => topic.priority !== "optional")
        .map((topic) => topic.name);
    }

    const generated = await generateQuestions({
      preparationId,
      type: preparation.type,
      topics,
      count,
      alreadyAsked: existing.map((question) => question.question),
    });

    if (generated.length === 0) {
      return jsonError(
        "Your material didn't give enough to build questions from.",
        409,
      );
    }

    const saved = await saveQuestions(
      preparationId,
      generated,
      existing.length,
    );

    return Response.json({ questions: saved });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/quiz/generate");
  }
}
