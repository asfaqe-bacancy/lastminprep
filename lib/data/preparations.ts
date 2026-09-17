import "server-only";

import type {
  CrashPrepBoard,
  FinalRevision,
  Preparation,
  PreparationGoal,
  PreparationPlan,
  PreparationStatus,
  PreparationType,
  Topic,
  TopicPriority,
} from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoCreatePreparation,
  demoGetPreparation,
  demoListPreparations,
  demoListTopics,
  demoSetTopics,
  demoUpdatePreparation,
} from "@/lib/demo/store";

interface PreparationRow {
  id: string;
  user_id: string;
  title: string;
  type: PreparationType;
  goal: PreparationGoal;
  available_minutes: number;
  status: PreparationStatus;
  plan: PreparationPlan | null;
  revision: FinalRevision | null;
  crash_board: CrashPrepBoard | null;
  progress_percent: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface TopicRow {
  id: string;
  preparation_id: string;
  name: string;
  priority: TopicPriority;
  estimated_minutes: number | null;
  summary: string | null;
  position: number | null;
}

const PREPARATION_COLUMNS =
  "id, user_id, title, type, goal, available_minutes, status, plan, revision, crash_board, progress_percent, created_at, started_at, completed_at";

function toPreparation(row: PreparationRow): Preparation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type,
    goal: row.goal,
    availableMinutes: row.available_minutes,
    status: row.status,
    plan: row.plan,
    revision: row.revision,
    crashBoard: row.crash_board,
    progressPercent: row.progress_percent ?? 0,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    preparationId: row.preparation_id,
    name: row.name,
    priority: row.priority,
    estimatedMinutes: row.estimated_minutes,
    summary: row.summary,
    position: row.position ?? 0,
  };
}

export async function listPreparations(): Promise<Preparation[]> {
  if (isDemoMode()) return demoListPreparations();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("preparations")
    .select(PREPARATION_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load preparations: ${error.message}`);
  return (data as PreparationRow[]).map(toPreparation);
}

export async function getPreparation(id: string): Promise<Preparation | null> {
  if (isDemoMode()) return demoGetPreparation(id);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("preparations")
    .select(PREPARATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load preparation: ${error.message}`);
  return data ? toPreparation(data as PreparationRow) : null;
}

export async function createPreparation(input: {
  userId: string;
  title: string;
  type: PreparationType;
  goal: PreparationGoal;
  availableMinutes: number;
}): Promise<Preparation> {
  if (isDemoMode()) {
    return demoCreatePreparation({
      title: input.title,
      type: input.type,
      goal: input.goal,
      availableMinutes: input.availableMinutes,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("preparations")
    .insert({
      user_id: input.userId,
      title: input.title,
      type: input.type,
      goal: input.goal,
      available_minutes: input.availableMinutes,
      status: "draft",
    })
    .select(PREPARATION_COLUMNS)
    .single();

  if (error) throw new Error(`Could not create preparation: ${error.message}`);
  return toPreparation(data as PreparationRow);
}

export async function updatePreparation(
  id: string,
  patch: {
    status?: PreparationStatus;
    plan?: PreparationPlan | null;
    revision?: FinalRevision | null;
    crashBoard?: CrashPrepBoard | null;
    progressPercent?: number;
    startedAt?: string | null;
    completedAt?: string | null;
    title?: string;
  },
): Promise<Preparation | null> {
  if (isDemoMode()) return demoUpdatePreparation(id, patch);

  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.plan !== undefined) row.plan = patch.plan;
  if (patch.revision !== undefined) row.revision = patch.revision;
  if (patch.crashBoard !== undefined) row.crash_board = patch.crashBoard;
  if (patch.progressPercent !== undefined)
    row.progress_percent = patch.progressPercent;
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
  if (patch.title !== undefined) row.title = patch.title;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("preparations")
    .update(row)
    .eq("id", id)
    .select(PREPARATION_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Could not update preparation: ${error.message}`);
  return data ? toPreparation(data as PreparationRow) : null;
}

export async function listTopics(preparationId: string): Promise<Topic[]> {
  if (isDemoMode()) return demoListTopics(preparationId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("preparation_topics")
    .select(
      "id, preparation_id, name, priority, estimated_minutes, summary, position",
    )
    .eq("preparation_id", preparationId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return (data as TopicRow[]).map(toTopic);
}

/** Replaces the topic list for a preparation — plans are regenerated whole. */
export async function replaceTopics(
  preparationId: string,
  topics: {
    name: string;
    priority: TopicPriority;
    estimatedMinutes: number | null;
    summary: string | null;
  }[],
): Promise<Topic[]> {
  if (isDemoMode()) {
    return demoSetTopics(
      preparationId,
      topics.map((topic, index) => ({
        id: `topic-${preparationId}-${index}`,
        preparationId,
        position: index,
        ...topic,
      })),
    );
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("preparation_topics")
    .delete()
    .eq("preparation_id", preparationId);

  if (topics.length === 0) return [];

  const { data, error } = await supabase
    .from("preparation_topics")
    .insert(
      topics.map((topic, index) => ({
        preparation_id: preparationId,
        name: topic.name,
        priority: topic.priority,
        estimated_minutes: topic.estimatedMinutes,
        summary: topic.summary,
        position: index,
      })),
    )
    .select(
      "id, preparation_id, name, priority, estimated_minutes, summary, position",
    );

  if (error) throw new Error(`Could not save topics: ${error.message}`);
  return (data as TopicRow[]).map(toTopic);
}
