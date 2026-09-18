import type { NextRequest } from "next/server";
import { generateFinalRevision } from "@/lib/ai/revision";
import { updatePreparation } from "@/lib/data/preparations";
import { getTopicPerformance, recalculateProgress } from "@/lib/data/progress";
import {
  handleRouteError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Writes the final revision page from the material and whatever the user
 * struggled with, then stores it so it can be reopened without regenerating.
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/preparations/[id]/revision">,
) {
  try {
    const { id } = await context.params;
    const { preparation } = await loadOwnedPreparation(id);
    requireGemini();

    const performance = await getTopicPerformance(id);
    const weakTopics = performance
      .filter((entry) => entry.score < 70)
      .slice(0, 4)
      .map((entry) => entry.name);

    const revision = await generateFinalRevision({
      preparationId: id,
      type: preparation.type,
      minutes: preparation.availableMinutes,
      weakTopics,
    });

    await updatePreparation(id, { revision });
    await recalculateProgress(id);

    return Response.json({ revision });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/preparations/[id]/revision");
  }
}
