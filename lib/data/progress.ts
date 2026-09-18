import "server-only";

import type {
  PlanSegmentKind,
  ProgressSnapshot,
  TopicPerformance,
  Verdict,
} from "@/types";
import { INTERVIEW_LENGTH, QUIZ_LENGTH } from "@/lib/constants";
import { clampPercent } from "@/lib/format";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoCountStudiedTopics,
  demoMarkTopicStudied,
  demoProgress,
  demoTopicPerformance,
  noteForScore,
} from "@/lib/demo/store";
import {
  getPreparation,
  listTopics,
  updatePreparation,
} from "./preparations";
import { listResults } from "./quiz";
import { getSession, listMessages } from "./interview";

interface AnswerAggregateRow {
  score: number | null;
  verdict: Verdict;
  created_at: string;
  quiz_questions: { topic: string | null; topic_id: string | null } | null;
}

/** Cross-preparation numbers for the Progress screen. */
export async function getProgressSnapshot(): Promise<ProgressSnapshot> {
  if (isDemoMode()) return demoProgress();

  const supabase = await createSupabaseServerClient();

  const [{ count: completed }, { data: answers }, { data: preparations }] =
    await Promise.all([
      supabase
        .from("preparations")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("quiz_answers")
        .select(
          "score, verdict, created_at, quiz_questions!inner(topic, topic_id)",
        )
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("preparations").select("available_minutes, status"),
    ]);

  const rows = (answers ?? []) as unknown as AnswerAggregateRow[];
  const scores = rows.map((row) => row.score ?? 0);
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const studyMinutes = (preparations ?? [])
    .filter((prep) => prep.status === "completed" || prep.status === "active")
    .reduce((sum, prep) => sum + (prep.available_minutes ?? 0), 0);

  return {
    preparationsCompleted: completed ?? 0,
    questionsAnswered: rows.length,
    averageScore,
    studyMinutes,
    weakTopics: aggregateTopics(rows).filter((topic) => topic.score < 70),
    recentScores: rows
      .slice(0, 7)
      .reverse()
      .map((row, index) => ({
        label: `#${index + 1}`,
        score: Math.round(row.score ?? 0),
      })),
  };
}

/** Per-topic performance inside one preparation, used for weak areas. */
export async function getTopicPerformance(
  preparationId: string,
): Promise<TopicPerformance[]> {
  if (isDemoMode()) return demoTopicPerformance(preparationId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("score, verdict, created_at, quiz_questions!inner(topic, topic_id)")
    .eq("quiz_questions.preparation_id", preparationId);

  if (error) throw new Error(`Could not load performance: ${error.message}`);
  return aggregateTopics((data ?? []) as unknown as AnswerAggregateRow[]);
}

function aggregateTopics(rows: AnswerAggregateRow[]): TopicPerformance[] {
  const byTopic = new Map<string, TopicPerformance & { total: number }>();

  for (const row of rows) {
    const name = row.quiz_questions?.topic ?? "General";
    const entry = byTopic.get(name) ?? {
      topicId: row.quiz_questions?.topic_id ?? null,
      name,
      questionsAnswered: 0,
      questionsCorrect: 0,
      score: 0,
      note: "",
      total: 0,
    };
    entry.questionsAnswered += 1;
    entry.total += row.score ?? 0;
    if (row.verdict === "correct") entry.questionsCorrect += 1;
    byTopic.set(name, entry);
  }

  return [...byTopic.values()]
    .map(({ total, ...entry }) => {
      const score = Math.round(total / Math.max(1, entry.questionsAnswered));
      return { ...entry, score, note: noteForScore(score) };
    })
    .sort((a, b) => a.score - b.score);
}

/* ------------------------------------------------- per-preparation progress */

/**
 * Records that a topic was actually studied.
 *
 * This is the only honest signal we have for the learn segment, so it is
 * written when an explanation is generated rather than inferred later.
 */
export async function markTopicStudied(input: {
  userId: string;
  preparationId: string;
  topicId: string | null;
  topicName: string;
  seconds?: number;
}): Promise<void> {
  if (isDemoMode()) {
    demoMarkTopicStudied(input.preparationId, input.topicName);
    return;
  }
  if (!input.topicId) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("user_progress").upsert(
    {
      user_id: input.userId,
      preparation_id: input.preparationId,
      topic_id: input.topicId,
      time_spent_seconds: input.seconds ?? 60,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "preparation_id,topic_id" },
  );
}

async function countStudiedTopics(preparationId: string): Promise<number> {
  if (isDemoMode()) return demoCountStudiedTopics(preparationId);

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("user_progress")
    .select("id", { count: "exact", head: true })
    .eq("preparation_id", preparationId)
    .not("topic_id", "is", null);

  return count ?? 0;
}

/**
 * Recomputes how prepared someone is, from signals we can actually observe,
 * and stores it on the preparation.
 *
 * Each plan segment contributes in proportion to the minutes it was given, so
 * a plan that is mostly mock interview moves mostly when the interview
 * progresses. Segments with no measurable signal are left out of the weighting
 * rather than counted as complete.
 */
export async function recalculateProgress(
  preparationId: string,
): Promise<number> {
  const preparation = await getPreparation(preparationId);
  if (!preparation) return 0;

  const [results, session, topics, studied] = await Promise.all([
    listResults(preparationId),
    getSession(preparationId),
    listTopics(preparationId),
    countStudiedTopics(preparationId),
  ]);

  const interviewAnswers = session
    ? (await listMessages(session.id)).filter(
        (message) => message.role === "user",
      ).length
    : 0;

  const answered = results.length;
  const fractions: Partial<Record<PlanSegmentKind, number>> = {
    learn: topics.length > 0 ? studied / topics.length : undefined,
    quiz: Math.min(1, answered / QUIZ_LENGTH),
    interview: session
      ? session.status === "completed"
        ? 1
        : Math.min(1, interviewAnswers / INTERVIEW_LENGTH)
      : 0,
    weak_areas: Math.min(1, Math.max(0, answered - QUIZ_LENGTH) / 3),
    revision: preparation.revision ? 1 : 0,
  };

  const segments = preparation.plan?.segments ?? [];
  let weighted = 0;
  let weight = 0;

  for (const segment of segments) {
    const fraction = fractions[segment.kind];
    if (fraction === undefined) continue;
    weighted += fraction * segment.minutes;
    weight += segment.minutes;
  }

  const percent =
    weight > 0
      ? clampPercent((weighted / weight) * 100)
      : clampPercent(Math.min(1, answered / QUIZ_LENGTH) * 100);

  await updatePreparation(preparationId, {
    progressPercent: percent,
    status: percent >= 100 ? "completed" : "active",
    completedAt: percent >= 100 ? new Date().toISOString() : null,
    startedAt: preparation.startedAt ?? new Date().toISOString(),
  });

  return percent;
}
