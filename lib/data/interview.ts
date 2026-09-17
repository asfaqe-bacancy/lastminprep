import "server-only";

import type {
  InterviewMessage,
  InterviewReport,
  InterviewSession,
} from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoAddMessage,
  demoCompleteSession,
  demoGetSession,
  demoListMessages,
  demoStartSession,
} from "@/lib/demo/store";

interface SessionRow {
  id: string;
  preparation_id: string;
  user_id: string;
  status: "active" | "completed";
  started_at: string;
  completed_at: string | null;
  summary: InterviewReport | null;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: "interviewer" | "user";
  content: string;
  question_number: number | null;
  created_at: string;
}

const SESSION_COLUMNS =
  "id, preparation_id, user_id, status, started_at, completed_at, summary";

function toSession(row: SessionRow): InterviewSession {
  return {
    id: row.id,
    preparationId: row.preparation_id,
    userId: row.user_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    report: row.summary,
  };
}

function toMessage(row: MessageRow): InterviewMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    questionNumber: row.question_number,
    createdAt: row.created_at,
  };
}

/** The most recent session for a preparation, finished or not. */
export async function getSession(
  preparationId: string,
): Promise<InterviewSession | null> {
  if (isDemoMode()) return demoGetSession(preparationId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(SESSION_COLUMNS)
    .eq("preparation_id", preparationId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not load the interview: ${error.message}`);
  return data ? toSession(data as SessionRow) : null;
}

/** Reuses an active session so a refresh doesn't restart the interview. */
export async function startSession(
  preparationId: string,
  userId: string,
): Promise<InterviewSession> {
  if (isDemoMode()) return demoStartSession(preparationId);

  const existing = await getSession(preparationId);
  if (existing && existing.status === "active") return existing;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({ preparation_id: preparationId, user_id: userId })
    .select(SESSION_COLUMNS)
    .single();

  if (error) throw new Error(`Could not start the interview: ${error.message}`);
  return toSession(data as SessionRow);
}

export async function listMessages(
  sessionId: string,
): Promise<InterviewMessage[]> {
  if (isDemoMode()) return demoListMessages(sessionId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("id, session_id, role, content, question_number, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Could not load the transcript: ${error.message}`);
  return ((data ?? []) as MessageRow[]).map(toMessage);
}

export async function addMessage(input: {
  sessionId: string;
  role: "interviewer" | "user";
  content: string;
  questionNumber: number | null;
  topic?: string;
}): Promise<InterviewMessage> {
  if (isDemoMode()) {
    return demoAddMessage({
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      questionNumber: input.questionNumber,
      createdAt: new Date().toISOString(),
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .insert({
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
      question_number: input.questionNumber,
      metadata: input.topic ? { topic: input.topic } : {},
    })
    .select("id, session_id, role, content, question_number, created_at")
    .single();

  if (error) throw new Error(`Could not save that message: ${error.message}`);
  return toMessage(data as MessageRow);
}

export async function completeSession(
  sessionId: string,
  report: InterviewReport,
): Promise<void> {
  if (isDemoMode()) {
    demoCompleteSession(sessionId, report);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      summary: report,
    })
    .eq("id", sessionId);

  if (error) throw new Error(`Could not save the report: ${error.message}`);
}
