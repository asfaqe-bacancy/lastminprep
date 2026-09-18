import { explainTopic } from "@/lib/ai/learn";
import { listTopics } from "@/lib/data/preparations";
import { markTopicStudied, recalculateProgress } from "@/lib/data/progress";
import {
  handleRouteError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";
import { asRecord, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Teaches one topic from the user's own material. */
export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const preparationId = requireString(body.preparationId, "preparationId", {
      max: 64,
    });
    const topicName = requireString(body.topic, "topic", { max: 200 });
    const rawMode = body.mode;
    const mode =
      rawMode === "simpler" || rawMode === "example" ? rawMode : "normal";

    const { user, preparation } = await loadOwnedPreparation(preparationId);
    requireGemini();

    const explanation = await explainTopic({
      preparationId,
      topic: topicName,
      minutes: preparation.availableMinutes,
      mode,
    });

    if (explanation.covered) {
      const topics = await listTopics(preparationId);
      const matched = topics.find(
        (topic) => topic.name.toLowerCase() === topicName.toLowerCase(),
      );

      await markTopicStudied({
        userId: user.id,
        preparationId,
        topicId: matched?.id ?? null,
        topicName,
      });
      await recalculateProgress(preparationId);
    }

    return Response.json(explanation);
  } catch (cause) {
    return handleRouteError(cause, "POST /api/learn");
  }
}
