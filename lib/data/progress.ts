import "server-only";

import type { ProgressSnapshot, TopicPerformance, Verdict } from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoProgress,
  demoTopicPerformance,
  noteForScore,
} from "@/lib/demo/store";

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
