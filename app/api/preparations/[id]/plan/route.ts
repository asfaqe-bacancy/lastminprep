import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/data/auth";
import {
  getPreparation,
  replaceTopics,
  updatePreparation,
} from "@/lib/data/preparations";
import { listDocuments } from "@/lib/data/documents";
import { generatePreparationPlan } from "@/lib/ai/preparation-plan";
import { handleRouteError, jsonError } from "@/lib/api";
import { isDemoMode, isGeminiConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/preparations/[id]/plan">,
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;

    const preparation = await getPreparation(id);
    if (!preparation) return jsonError("That preparation no longer exists.", 404);
    if (!isDemoMode() && preparation.userId !== user.id) {
      return jsonError("That preparation isn't yours.", 403);
    }

    if (!isGeminiConfigured()) {
      return jsonError(
        "Add GEMINI_API_KEY to .env.local and restart the dev server to build a plan.",
        503,
      );
    }

    const documents = await listDocuments(id);
    const ready = documents.filter((document) => document.status === "ready");

    if (ready.length === 0) {
      return jsonError(
        "None of your documents finished processing, so there's nothing to plan from.",
        409,
      );
    }

    const { plan, topics } = await generatePreparationPlan(
      preparation,
      ready.map((document) => document.filename),
    );

    await replaceTopics(id, topics);
    await updatePreparation(id, {
      plan,
      status: "ready",
      progressPercent: 0,
    });

    return Response.json({ plan, topics });
  } catch (cause) {
    return handleRouteError(cause, "POST /api/preparations/[id]/plan");
  }
}
