import "server-only";

import type { Difficulty, SourceCitation, Verdict } from "@/types";
import { RETRIEVAL_TOP_K, RETRIEVAL_TOP_K_WIDE } from "@/lib/constants";
import { typeLabel } from "@/lib/format";
import { sampleChunks, getChunksByIds } from "@/lib/data/chunks";
import { buildGroundedContext, toCitations } from "./rag";
import { buildContextBlock } from "./prompts";
import {
  EVALUATION_SYSTEM,
  QUIZ_SYSTEM,
  buildEvaluationPrompt,
  buildQuizPrompt,
} from "./prompts";
import { EVALUATION_SCHEMA, QUESTIONS_SCHEMA } from "./schemas";
import { generateJson } from "./gemini";

export interface GeneratedQuestion {
  topic: string;
  question: string;
  expectedAnswer: string;
  difficulty: Difficulty;
  sourceChunkIds: string[];
  sources: SourceCitation[];
}

/**
 * Writes questions from the user's material.
 *
 * When topics are given, each one is retrieved separately so a question about
 * a topic is grounded in the passages about that topic — which also gives the
 * question honest source citations. Without topics, an even sample of the
 * document is used instead.
 */
export async function generateQuestions(options: {
  preparationId: string;
  type: "exam" | "interview";
  topics: string[];
  count: number;
  alreadyAsked?: string[];
}): Promise<GeneratedQuestion[]> {
  const topics = options.topics.slice(0, 4);

  if (topics.length === 0) {
    const chunks = await sampleChunks(options.preparationId, 12);
    if (chunks.length === 0) return [];
    return askFor({
      context: buildContextBlock(chunks),
      sources: toCitations(chunks),
      count: options.count,
      topics: [],
      alreadyAsked: options.alreadyAsked ?? [],
      type: options.type,
    });
  }

  // Spread the requested count across the topics, front-loading the first.
  const perTopic = distribute(options.count, topics.length);
  const asked = [...(options.alreadyAsked ?? [])];
  const questions: GeneratedQuestion[] = [];

  for (const [index, topic] of topics.entries()) {
    const wanted = perTopic[index];
    if (wanted === 0) continue;

    const { chunks, context, grounded } = await buildGroundedContext({
      preparationId: options.preparationId,
      query: `${topic}. Important points and details about ${topic}.`,
      topK: RETRIEVAL_TOP_K_WIDE,
    });
    if (!grounded) continue;

    const batch = await askFor({
      context,
      sources: toCitations(chunks),
      count: wanted,
      topics: [topic],
      alreadyAsked: asked,
      type: options.type,
    });

    questions.push(...batch);
    asked.push(...batch.map((question) => question.question));
  }

  return questions;
}

async function askFor(input: {
  context: string;
  sources: SourceCitation[];
  count: number;
  topics: string[];
  alreadyAsked: string[];
  type: "exam" | "interview";
}): Promise<GeneratedQuestion[]> {
  const response = await generateJson<{
    questions: {
      topic: string;
      question: string;
      expectedAnswer: string;
      difficulty: string;
    }[];
  }>({
    system: QUIZ_SYSTEM,
    prompt: buildQuizPrompt({
      context: input.context,
      count: input.count,
      topics: input.topics,
      alreadyAsked: input.alreadyAsked,
      type: typeLabel(input.type),
    }),
    schema: QUESTIONS_SCHEMA,
    temperature: 0.8,
    maxOutputTokens: 4096,
  });

  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  return response.questions
    .filter((question) => question.question.trim().length > 0)
    .slice(0, input.count)
    .map((question) => ({
      topic: question.topic.trim() || input.topics[0] || "General",
      question: question.question.trim(),
      expectedAnswer: question.expectedAnswer.trim(),
      difficulty: (difficulties.includes(question.difficulty as Difficulty)
        ? question.difficulty
        : "medium") as Difficulty,
      sourceChunkIds: input.sources.map((source) => source.chunkId),
      sources: input.sources,
    }));
}

/** Splits `total` across `buckets`, giving the remainder to the earlier ones. */
function distribute(total: number, buckets: number): number[] {
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from(
    { length: buckets },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export interface Evaluation {
  verdict: Verdict;
  score: number;
  feedback: string;
  missing: string[];
  sources: SourceCitation[];
}

/**
 * Marks an answer against the material.
 *
 * The chunks the question was written from are re-read for marking, so the
 * feedback and the question agree about what the material says.
 */
export async function evaluateAnswer(options: {
  preparationId: string;
  question: string;
  expectedAnswer: string | null;
  userAnswer: string;
  sourceChunkIds: string[];
}): Promise<Evaluation> {
  let chunks = await getChunksByIds(options.sourceChunkIds.slice(0, 6));

  // If the question's own sources have gone, fall back to searching for it.
  if (chunks.length === 0) {
    const retrieved = await buildGroundedContext({
      preparationId: options.preparationId,
      query: options.question,
      topK: RETRIEVAL_TOP_K,
    });
    chunks = retrieved.chunks;
  }

  const sources = toCitations(chunks);

  const response = await generateJson<{
    verdict: string;
    score: number;
    feedback: string;
    missing: string[];
  }>({
    system: EVALUATION_SYSTEM,
    prompt: buildEvaluationPrompt({
      context: buildContextBlock(chunks),
      question: options.question,
      expectedAnswer: options.expectedAnswer,
      userAnswer: options.userAnswer,
    }),
    schema: EVALUATION_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1024,
  });

  const verdicts: Verdict[] = ["correct", "partial", "incorrect"];
  const verdict = (
    verdicts.includes(response.verdict as Verdict) ? response.verdict : "partial"
  ) as Verdict;

  return {
    verdict,
    // Keep the number and the verdict consistent even if the model drifts.
    score: reconcileScore(response.score, verdict),
    feedback: response.feedback.trim(),
    missing: (response.missing ?? [])
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 4),
    sources,
  };
}

function reconcileScore(raw: number, verdict: Verdict): number {
  const score = Number.isFinite(raw) ? Math.round(raw) : 0;
  const clamped = Math.min(100, Math.max(0, score));

  if (verdict === "correct") return Math.max(clamped, 80);
  if (verdict === "incorrect") return Math.min(clamped, 35);
  return Math.min(Math.max(clamped, 40), 79);
}
