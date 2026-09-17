import "server-only";

import type { CrashPrepBoard, CrashPrepTier, TopicPriority } from "@/types";
import { PRIORITY_META } from "@/lib/constants";
import { goalLabel, typeLabel } from "@/lib/format";
import { sampleChunks } from "@/lib/data/chunks";
import { buildContextBlock } from "./prompts";
import { CRASH_SYSTEM, buildCrashPrompt } from "./prompts";
import { CRASH_SCHEMA } from "./schemas";
import { generateJson } from "./gemini";

/**
 * Last-minute triage — the feature the product exists for.
 *
 *   available time + material + goal + retrieval + past performance
 *     → must know / important / optional
 *
 * The minutes are trimmed to fit the time available, because a board that
 * promises 70 minutes of work to someone with 45 is worse than useless.
 */
export async function generateCrashBoard(options: {
  preparationId: string;
  type: "exam" | "interview";
  goal: Parameters<typeof goalLabel>[0];
  minutes: number;
  weakTopics: string[];
}): Promise<CrashPrepBoard> {
  const chunks = await sampleChunks(options.preparationId, 20);

  if (chunks.length === 0) {
    throw new Error("There's no processed material to triage yet.");
  }

  const response = await generateJson<{
    headline: string;
    tiers: {
      priority: string;
      topics: { name: string; why: string; minutes: number }[];
    }[];
  }>({
    system: CRASH_SYSTEM,
    prompt: buildCrashPrompt({
      type: typeLabel(options.type),
      goal: goalLabel(options.goal),
      minutes: options.minutes,
      context: buildContextBlock(chunks),
      weakTopics: options.weakTopics,
    }),
    schema: CRASH_SCHEMA,
    temperature: 0.5,
    thinkingBudget: 1024,
    maxOutputTokens: 3072,
  });

  const order: TopicPriority[] = ["must_know", "important", "optional"];

  const tiers: CrashPrepTier[] = order.map((priority) => {
    const match = response.tiers.find((tier) => tier.priority === priority);
    return {
      priority,
      label: PRIORITY_META[priority].label,
      stars: PRIORITY_META[priority].stars,
      topics: (match?.topics ?? [])
        .filter((topic) => topic.name?.trim())
        .slice(0, 5)
        .map((topic) => ({
          name: topic.name.trim(),
          why: topic.why?.trim() ?? "",
          minutes: Math.max(1, Math.round(topic.minutes || 5)),
        })),
    };
  });

  return {
    totalMinutes: options.minutes,
    headline: response.headline.trim(),
    tiers: fitToTime(tiers, options.minutes),
  };
}

/**
 * Scales the tier minutes down to the time available, protecting must-know
 * topics and dropping optional ones first.
 */
function fitToTime(
  tiers: CrashPrepTier[],
  totalMinutes: number,
): CrashPrepTier[] {
  const total = tiers.reduce(
    (sum, tier) =>
      sum + tier.topics.reduce((tierSum, topic) => tierSum + topic.minutes, 0),
    0,
  );

  if (total <= totalMinutes || total === 0) return tiers;

  const ratio = totalMinutes / total;

  return tiers.map((tier) => ({
    ...tier,
    topics: tier.topics
      .map((topic) => ({
        ...topic,
        minutes: Math.max(
          tier.priority === "must_know" ? 3 : 1,
          Math.round(topic.minutes * ratio),
        ),
      }))
      // If it still doesn't fit, optional topics are the first to go.
      .filter((topic) => tier.priority !== "optional" || ratio > 0.6),
  }));
}
