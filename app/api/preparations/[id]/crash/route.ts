import type { NextRequest } from "next/server";
import { generateCrashBoard } from "@/lib/ai/crash-prep";
import { updatePreparation } from "@/lib/data/preparations";
import { getTopicPerformance } from "@/lib/data/progress";
import {
  handleRouteError,
  loadOwnedPreparation,
  requireGemini,
} from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Last-minute triage: sorts the material into must know / important /
 * optional for the time actually available (PRD section 18).
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/preparations/[id]/crash">,
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

    const board = await generateCrashBoard({
      preparationId: id,
      type: preparation.type,
      goal: preparation.goal,
      minutes: preparation.availableMinutes,
      weakTopics,
    });

    await updatePreparation(id, { crashBoard: board });

    return Response.json({ board });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/preparations/[id]/crash");
  }
}
