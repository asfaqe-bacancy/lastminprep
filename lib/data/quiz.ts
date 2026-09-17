import "server-only";

import type {
  Difficulty,
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  SourceCitation,
  Verdict,
} from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoAddAnswer,
  demoAddQuestion,
  demoListQuestions,
  demoListResults,
} from "@/lib/demo/store";
import { getChunksByIds } from "./chunks";
import { toCitations } from "@/lib/ai/rag";

interface QuestionRow {
  id: string;
  preparation_id: string;
  topic_id: string | null;
  topic: string;
  question: string;
  difficulty: Difficulty;
  expected_answer: string | null;
  source_chunk_ids: string[] | null;
  position: number;
}

interface AnswerRow {
  id: string;
  question_id: string;
  user_answer: string;
  evaluation: string | null;
  verdict: Verdict | null;
  missing: string[] | null;
  score: number | null;
  created_at: string;
}

const QUESTION_COLUMNS =
  "id, preparation_id, topic_id, topic, question, difficulty, expected_answer, source_chunk_ids, position";

function toQuestion(row: QuestionRow, sources: SourceCitation[]): QuizQuestion {
  return {
    id: row.id,
    preparationId: row.preparation_id,
    topicId: row.topic_id,
    topicName: row.topic,
    question: row.question,
    difficulty: row.difficulty,
    expectedAnswer: row.expected_answer,
    sourceChunkIds: row.source_chunk_ids ?? [],
    sources,
    position: row.position,
  };
}

function toAnswer(row: AnswerRow): QuizAnswer {
  return {
    id: row.id,
    questionId: row.question_id,
    userAnswer: row.user_answer,
    verdict: row.verdict ?? "partial",
    feedback: row.evaluation ?? "",
    missing: row.missing ?? [],
    score: Number(row.score ?? 0),
    createdAt: row.created_at,
  };
}

/** Resolves the chunk ids on a set of questions into citations, in one pass. */
async function hydrateSources(
  rows: QuestionRow[],
): Promise<Map<string, SourceCitation[]>> {
  const ids = [
    ...new Set(rows.flatMap((row) => row.source_chunk_ids ?? [])),
  ].slice(0, 60);

  const chunks = await getChunksByIds(ids);
  const byId = new Map(
    toCitations(chunks).map((citation) => [citation.chunkId, citation]),
  );

  return new Map(
    rows.map((row) => [
      row.id,
      (row.source_chunk_ids ?? [])
        .map((chunkId) => byId.get(chunkId))
        .filter((citation): citation is SourceCitation => Boolean(citation)),
    ]),
  );
}

export async function listQuestions(
  preparationId: string,
): Promise<QuizQuestion[]> {
  if (isDemoMode()) return demoListQuestions(preparationId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(QUESTION_COLUMNS)
    .eq("preparation_id", preparationId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Could not load questions: ${error.message}`);

  const rows = (data ?? []) as QuestionRow[];
  const sources = await hydrateSources(rows);
  return rows.map((row) => toQuestion(row, sources.get(row.id) ?? []));
}

export async function saveQuestions(
  preparationId: string,
  questions: {
    topic: string;
    topicId?: string | null;
    question: string;
    expectedAnswer: string;
    difficulty: Difficulty;
    sourceChunkIds: string[];
    sources: SourceCitation[];
  }[],
  startPosition: number,
): Promise<QuizQuestion[]> {
  if (questions.length === 0) return [];

  if (isDemoMode()) {
    return questions.map((question, index) =>
      demoAddQuestion({
        id: `q-${Date.now()}-${index}`,
        preparationId,
        topicId: question.topicId ?? null,
        topicName: question.topic,
        question: question.question,
        difficulty: question.difficulty,
        expectedAnswer: question.expectedAnswer,
        sourceChunkIds: question.sourceChunkIds,
        sources: question.sources,
        position: startPosition + index,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .insert(
      questions.map((question, index) => ({
        preparation_id: preparationId,
        topic_id: question.topicId ?? null,
        topic: question.topic,
        question: question.question,
        difficulty: question.difficulty,
        expected_answer: question.expectedAnswer,
        source_chunk_ids: question.sourceChunkIds,
        position: startPosition + index,
      })),
    )
    .select(QUESTION_COLUMNS);

  if (error) throw new Error(`Could not save questions: ${error.message}`);

  const rows = (data ?? []) as QuestionRow[];
  const byQuestion = new Map(
    questions.map((question) => [question.question, question.sources]),
  );

  return rows
    .map((row) => toQuestion(row, byQuestion.get(row.question) ?? []))
    .sort((a, b) => a.position - b.position);
}

export async function getQuestion(id: string): Promise<QuizQuestion | null> {
  if (isDemoMode()) {
    for (const preparation of ["prep-rn-interview", "prep-js-exam", "prep-dbms-exam"]) {
      const found = demoListQuestions(preparation).find(
        (question) => question.id === id,
      );
      if (found) return found;
    }
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(QUESTION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load the question: ${error.message}`);
  if (!data) return null;

  const row = data as QuestionRow;
  const sources = await hydrateSources([row]);
  return toQuestion(row, sources.get(row.id) ?? []);
}

export async function saveAnswer(input: {
  questionId: string;
  userId: string;
  userAnswer: string;
  verdict: Verdict;
  feedback: string;
  missing: string[];
  score: number;
}): Promise<QuizAnswer> {
  if (isDemoMode()) {
    return demoAddAnswer({
      id: `a-${Date.now()}`,
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      verdict: input.verdict,
      feedback: input.feedback,
      missing: input.missing,
      score: input.score,
      createdAt: new Date().toISOString(),
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_answers")
    .insert({
      question_id: input.questionId,
      user_id: input.userId,
      user_answer: input.userAnswer,
      evaluation: input.feedback,
      verdict: input.verdict,
      missing: input.missing,
      score: input.score,
      is_correct: input.verdict === "correct",
    })
    .select("id, question_id, user_answer, evaluation, verdict, missing, score, created_at")
    .single();

  if (error) throw new Error(`Could not save your answer: ${error.message}`);
  return toAnswer(data as AnswerRow);
}

export async function listResults(
  preparationId: string,
): Promise<QuizResult[]> {
  if (isDemoMode()) return demoListResults(preparationId);

  const questions = await listQuestions(preparationId);
  if (questions.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("id, question_id, user_answer, evaluation, verdict, missing, score, created_at")
    .in(
      "question_id",
      questions.map((question) => question.id),
    )
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Could not load your answers: ${error.message}`);

  const answers = (data ?? []) as AnswerRow[];

  return questions
    .map((question) => {
      const answer = answers.find((row) => row.question_id === question.id);
      return answer ? { question, answer: toAnswer(answer) } : null;
    })
    .filter((result): result is QuizResult => result !== null);
}
