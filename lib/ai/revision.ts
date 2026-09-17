import "server-only";

import type { FinalRevision, SourceCitation } from "@/types";
import { sampleChunks } from "@/lib/data/chunks";
import { buildGroundedContext, toCitations } from "./rag";
import { buildContextBlock } from "./prompts";
import { REVISION_SYSTEM, buildRevisionPrompt } from "./prompts";
import { REVISION_SCHEMA } from "./schemas";
import { generateJson } from "./gemini";
import { typeLabel } from "@/lib/format";

/**
 * The final revision page: the last thing read before walking in.
 *
 * Context is the union of an even sample of the material and a focused
 * retrieval on the weak topics, so the page covers the essentials *and*
 * whatever the user actually struggled with.
 *
 * The model returns a source number per point, which is mapped back to a real
 * citation here — the model never gets to name a document or page itself.
 */
export async function generateFinalRevision(options: {
  preparationId: string;
  type: "exam" | "interview";
  minutes: number;
  weakTopics: string[];
}): Promise<FinalRevision> {
  const base = await sampleChunks(options.preparationId, 16);

  let extra: SourceCitation[] = [];
  let chunks = base;

  if (options.weakTopics.length > 0) {
    const retrieved = await buildGroundedContext({
      preparationId: options.preparationId,
      query: options.weakTopics.join(". "),
      topK: 6,
    });
    if (retrieved.grounded) {
      const seen = new Set(base.map((chunk) => chunk.chunkId));
      chunks = [
        ...base,
        ...retrieved.chunks.filter((chunk) => !seen.has(chunk.chunkId)),
      ];
      extra = toCitations(retrieved.chunks);
    }
  }

  if (chunks.length === 0) {
    throw new Error(
      "There's no processed material to revise from yet.",
    );
  }

  const citations = toCitations(chunks);
  void extra;

  const response = await generateJson<{
    headline: string;
    mustRemember: { text: string; sourceNumber: number }[];
    concepts: { title: string; body: string }[];
    commonQuestions: { question: string; answer: string }[];
    weakAreas: string[];
  }>({
    system: REVISION_SYSTEM,
    prompt: buildRevisionPrompt({
      context: buildContextBlock(chunks),
      type: typeLabel(options.type),
      weakTopics: options.weakTopics,
      minutes: options.minutes,
    }),
    schema: REVISION_SCHEMA,
    temperature: 0.4,
    thinkingBudget: 1024,
    maxOutputTokens: 3072,
  });

  return {
    headline: response.headline.trim() || "Before you go in",
    mustRemember: response.mustRemember
      .filter((point) => point.text?.trim())
      .slice(0, 6)
      .map((point) => ({
        text: point.text.trim(),
        // SOURCE blocks are 1-indexed in the prompt; 0 means "no source".
        source: citations[point.sourceNumber - 1] ?? null,
      })),
    concepts: response.concepts
      .filter((concept) => concept.title?.trim())
      .slice(0, 5)
      .map((concept) => ({
        title: concept.title.trim(),
        body: concept.body?.trim() ?? "",
      })),
    commonQuestions: response.commonQuestions
      .filter((entry) => entry.question?.trim())
      .slice(0, 5)
      .map((entry) => ({
        question: entry.question.trim(),
        answer: entry.answer?.trim() ?? "",
      })),
    weakAreas:
      response.weakAreas?.map((area) => area.trim()).filter(Boolean) ??
      options.weakTopics,
  };
}
