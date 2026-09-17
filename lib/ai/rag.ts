import "server-only";

import type {
  GroundedAnswer,
  RetrievedChunk,
  SourceCitation,
} from "@/types";
import {
  RETRIEVAL_MIN_SIMILARITY,
  RETRIEVAL_TOP_K,
} from "@/lib/constants";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { snippet } from "@/lib/format";
import { DEMO_CORPUS } from "@/lib/demo/fixtures";
import { embedQuery } from "./embeddings";
import { generateText, streamText } from "./gemini";
import { COACH_SYSTEM, buildContextBlock, buildCoachPrompt } from "./prompts";

/**
 * Retrieval, kept in one module so it can be improved without touching
 * anything else (PRD section 9).
 *
 * The question flow is:
 *
 *   question → embedding → pgvector similarity search → top chunks
 *            → context block → Gemini → grounded answer + citations
 */

export interface RetrievalOptions {
  preparationId: string;
  query: string;
  topK?: number;
  /** Narrow to particular documents, e.g. resume and job description only. */
  documentIds?: string[];
  minSimilarity?: number;
}

interface MatchRow {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  page_number: number | null;
  similarity: number;
}

export async function retrieveChunks(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? RETRIEVAL_TOP_K;

  if (isDemoMode()) {
    return demoRetrieve(options.query, topK, options.documentIds);
  }

  const embedding = await embedQuery(options.query);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    p_preparation_id: options.preparationId,
    match_count: topK,
    p_document_ids: options.documentIds ?? null,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  const threshold = options.minSimilarity ?? RETRIEVAL_MIN_SIMILARITY;

  return (data as MatchRow[])
    .map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      filename: row.filename,
      content: row.content,
      pageNumber: row.page_number,
      similarity: row.similarity,
    }))
    .filter((chunk) => chunk.similarity >= threshold);
}

/**
 * Demo-mode stand-in for vector search: overlapping word counts, weighted so
 * rarer words matter more. Crude next to embeddings — it cannot match
 * "meaning" against different vocabulary — which is exactly why the real
 * implementation uses them.
 */
function demoRetrieve(
  query: string,
  topK: number,
  documentIds?: string[],
): RetrievedChunk[] {
  const terms = tokenise(query);
  if (terms.length === 0) return [];

  const pool = documentIds
    ? DEMO_CORPUS.filter((entry) => documentIds.includes(entry.documentId))
    : DEMO_CORPUS;

  const documentFrequency = new Map<string, number>();
  for (const entry of pool) {
    for (const term of new Set(tokenise(entry.content))) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return pool
    .map((entry) => {
      const words = tokenise(entry.content);
      const counts = new Map<string, number>();
      for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

      let score = 0;
      for (const term of terms) {
        const hits = counts.get(term);
        if (!hits) continue;
        const rarity = Math.log(
          (pool.length + 1) / ((documentFrequency.get(term) ?? 0) + 1),
        );
        score += Math.min(hits, 3) * Math.max(rarity, 0.2);
      }

      return {
        chunkId: entry.chunkId,
        documentId: entry.documentId,
        filename: entry.filename,
        content: entry.content,
        pageNumber: entry.pageNumber,
        // Squashed into a 0-1 range so it reads like a similarity score.
        similarity: Number((score / (score + 3)).toFixed(3)),
      };
    })
    .filter((chunk) => chunk.similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that",
  "these", "those", "as", "at", "by", "from", "what", "how", "why", "when",
  "which", "who", "does", "do", "did", "can", "could", "would", "should",
  "about", "into", "than", "then", "there", "their", "you", "your", "i", "me",
  "my", "we", "our", "if", "not", "no", "so", "such", "up", "out", "over",
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/s$/, ""))
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function toCitations(chunks: RetrievedChunk[]): SourceCitation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    filename: chunk.filename,
    pageNumber: chunk.pageNumber,
    snippet: snippet(chunk.content, 260),
  }));
}

export interface GroundedContext {
  chunks: RetrievedChunk[];
  context: string;
  /** False when nothing relevant was retrieved. Callers must not paper over it. */
  grounded: boolean;
}

/** Retrieves and formats context, ready to hand to a prompt. */
export async function buildGroundedContext(
  options: RetrievalOptions,
): Promise<GroundedContext> {
  const chunks = await retrieveChunks(options);
  return {
    chunks,
    context: buildContextBlock(chunks),
    grounded: chunks.length > 0,
  };
}

export const NOT_IN_MATERIAL =
  "I couldn't find that in the material you uploaded. If it matters for your preparation, add a document that covers it and ask again.";

/**
 * The full question → grounded answer path.
 *
 * When retrieval finds nothing we return a plain statement rather than letting
 * the model answer from general knowledge. The whole point of grounding is
 * that the user can trust an answer came from their own material.
 */
export async function answerQuestion(options: {
  preparationId: string;
  question: string;
  history?: { role: "user" | "coach"; content: string }[];
  documentIds?: string[];
  topK?: number;
}): Promise<GroundedAnswer> {
  const { chunks, context, grounded } = await buildGroundedContext({
    preparationId: options.preparationId,
    query: options.question,
    topK: options.topK,
    documentIds: options.documentIds,
  });

  if (!grounded) {
    return { answer: NOT_IN_MATERIAL, grounded: false, sources: [] };
  }

  const answer = await generateText({
    system: COACH_SYSTEM,
    history: toGeminiHistory(options.history ?? []),
    prompt: buildCoachPrompt(options.question, context),
    temperature: 0.3,
  });

  return { answer, grounded: true, sources: toCitations(chunks) };
}

/** Same path, streamed, for anything the user reads as it arrives. */
export async function* streamAnswer(options: {
  preparationId: string;
  question: string;
  history?: { role: "user" | "coach"; content: string }[];
  documentIds?: string[];
  topK?: number;
}): AsyncGenerator<
  | { type: "sources"; sources: SourceCitation[]; grounded: boolean }
  | { type: "text"; text: string }
> {
  const { chunks, context, grounded } = await buildGroundedContext({
    preparationId: options.preparationId,
    query: options.question,
    topK: options.topK,
    documentIds: options.documentIds,
  });

  yield { type: "sources", sources: toCitations(chunks), grounded };

  if (!grounded) {
    yield { type: "text", text: NOT_IN_MATERIAL };
    return;
  }

  for await (const text of streamText({
    system: COACH_SYSTEM,
    history: toGeminiHistory(options.history ?? []),
    prompt: buildCoachPrompt(options.question, context),
    temperature: 0.3,
  })) {
    yield { type: "text", text };
  }
}

function toGeminiHistory(
  messages: { role: "user" | "coach"; content: string }[],
) {
  // Short-term memory only: enough for follow-ups, not the whole session
  // (RAG doc, section 11).
  return messages.slice(-6).map((message) => ({
    role: message.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: message.content }],
  }));
}
