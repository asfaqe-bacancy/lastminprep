import "server-only";

import type {
  PlanSegment,
  PlanSegmentKind,
  Preparation,
  PreparationPlan,
  TopicPriority,
} from "@/types";
import { SEGMENT_META } from "@/lib/constants";
import { goalLabel, typeLabel } from "@/lib/format";
import { sampleChunks } from "@/lib/data/chunks";
import { buildContextBlock } from "./prompts";
import { PLAN_SYSTEM, buildPlanPrompt } from "./prompts";
import { PLAN_SCHEMA } from "./schemas";
import { generateJson } from "./gemini";

interface PlanResponse {
  headline: string;
  segments: { kind: string; minutes: number; description: string }[];
  topics: {
    name: string;
    priority: string;
    estimatedMinutes: number;
    summary: string;
  }[];
}

export interface GeneratedPlan {
  plan: PreparationPlan;
  topics: {
    name: string;
    priority: TopicPriority;
    estimatedMinutes: number | null;
    summary: string | null;
  }[];
}

/**
 * Reads a sample of the user's material and writes a time-aware plan.
 *
 * The model is asked to triage rather than to cover everything, then the
 * result is normalised here: segment minutes are forced to add up to the time
 * available, segments that make no sense for the preparation type are dropped,
 * and priorities are clamped. Trusting the model's arithmetic would show the
 * user a "45 minute plan" that adds up to 50.
 */
export async function generatePreparationPlan(
  preparation: Preparation,
  filenames: string[],
): Promise<GeneratedPlan> {
  const chunks = await sampleChunks(preparation.id, 24);

  if (chunks.length === 0) {
    throw new Error(
      "There's nothing to plan from yet — no material has been processed.",
    );
  }

  const response = await generateJson<PlanResponse>({
    system: PLAN_SYSTEM,
    prompt: buildPlanPrompt({
      type: typeLabel(preparation.type),
      goal: goalLabel(preparation.goal),
      minutes: preparation.availableMinutes,
      context: buildContextBlock(chunks),
      filenames,
    }),
    schema: PLAN_SCHEMA,
    temperature: 0.5,
    // Triage benefits from a little deliberation.
    thinkingBudget: 1024,
    maxOutputTokens: 4096,
  });

  const segments = normaliseSegments(
    response.segments,
    preparation.availableMinutes,
    preparation.type,
  );

  return {
    plan: {
      totalMinutes: preparation.availableMinutes,
      headline: response.headline.trim(),
      segments,
    },
    topics: normaliseTopics(response.topics),
  };
}

const VALID_KINDS: PlanSegmentKind[] = [
  "learn",
  "quiz",
  "interview",
  "weak_areas",
  "revision",
];

function normaliseSegments(
  raw: PlanResponse["segments"],
  totalMinutes: number,
  type: Preparation["type"],
): PlanSegment[] {
  const cleaned = raw
    .filter((segment): segment is PlanResponse["segments"][number] =>
      VALID_KINDS.includes(segment.kind as PlanSegmentKind),
    )
    // A mock interview inside an exam preparation would just be wrong.
    .filter((segment) => type === "interview" || segment.kind !== "interview")
    .map((segment) => ({
      kind: segment.kind as PlanSegmentKind,
      label: SEGMENT_META[segment.kind as PlanSegmentKind].label,
      minutes: Math.max(1, Math.round(segment.minutes)),
      description: segment.description.trim(),
    }));

  if (cleaned.length === 0) {
    return fallbackSegments(totalMinutes, type);
  }

  return balanceMinutes(cleaned, totalMinutes);
}

/**
 * Scales the segment minutes so they sum to exactly the time available,
 * putting any remainder on the largest segment.
 */
function balanceMinutes(
  segments: PlanSegment[],
  totalMinutes: number,
): PlanSegment[] {
  const sum = segments.reduce((total, segment) => total + segment.minutes, 0);
  if (sum === totalMinutes) return segments;

  const scaled = segments.map((segment) => ({
    ...segment,
    minutes: Math.max(1, Math.round((segment.minutes / sum) * totalMinutes)),
  }));

  let drift =
    totalMinutes - scaled.reduce((total, segment) => total + segment.minutes, 0);

  // Adjust one minute at a time, always on the segment that can best absorb it.
  while (drift !== 0) {
    const order = [...scaled].sort((a, b) => b.minutes - a.minutes);
    const target = drift > 0 ? order[0] : order.find((s) => s.minutes > 1);
    if (!target) break;
    target.minutes += drift > 0 ? 1 : -1;
    drift += drift > 0 ? -1 : 1;
  }

  return scaled;
}

/** Used only if the model returns nothing usable. */
function fallbackSegments(
  totalMinutes: number,
  type: Preparation["type"],
): PlanSegment[] {
  const shape: { kind: PlanSegmentKind; share: number; description: string }[] =
    type === "interview"
      ? [
          { kind: "learn", share: 0.25, description: "The topics most likely to come up." },
          { kind: "quiz", share: 0.3, description: "Questions drawn from your material." },
          { kind: "interview", share: 0.33, description: "A mock interview, then a report." },
          { kind: "revision", share: 0.12, description: "What to walk in remembering." },
        ]
      : [
          { kind: "learn", share: 0.3, description: "Core concepts from your notes." },
          { kind: "quiz", share: 0.35, description: "Questions drawn from your material." },
          { kind: "weak_areas", share: 0.22, description: "Targeted practice where you slipped." },
          { kind: "revision", share: 0.13, description: "One page to read before you go in." },
        ];

  return balanceMinutes(
    shape.map((entry) => ({
      kind: entry.kind,
      label: SEGMENT_META[entry.kind].label,
      minutes: Math.max(1, Math.round(totalMinutes * entry.share)),
      description: entry.description,
    })),
    totalMinutes,
  );
}

function normaliseTopics(raw: PlanResponse["topics"]): GeneratedPlan["topics"] {
  const priorities: TopicPriority[] = ["must_know", "important", "optional"];
  const order = new Map(priorities.map((priority, index) => [priority, index]));

  return raw
    .map((topic) => ({
      name: topic.name.trim().slice(0, 120),
      priority: (priorities.includes(topic.priority as TopicPriority)
        ? topic.priority
        : "important") as TopicPriority,
      estimatedMinutes:
        Number.isFinite(topic.estimatedMinutes) && topic.estimatedMinutes > 0
          ? Math.round(topic.estimatedMinutes)
          : null,
      summary: topic.summary?.trim() || null,
    }))
    .filter((topic) => topic.name.length > 0)
    .sort(
      (a, b) => (order.get(a.priority) ?? 9) - (order.get(b.priority) ?? 9),
    )
    .slice(0, 12);
}
