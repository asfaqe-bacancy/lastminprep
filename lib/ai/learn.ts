import "server-only";

import type { SourceCitation } from "@/types";
import { RETRIEVAL_TOP_K_WIDE } from "@/lib/constants";
import { buildGroundedContext, toCitations } from "./rag";
import { LEARN_SYSTEM, buildLearnPrompt } from "./prompts";
import { LEARN_SCHEMA } from "./schemas";
import { generateJson } from "./gemini";

export interface TopicExplanation {
  explanation: string;
  keyIdea: string;
  remember: string;
  /** False when the material doesn't really cover the topic. */
  covered: boolean;
  sources: SourceCitation[];
}

/**
 * Teaches one topic from the user's own material.
 *
 * Retrieval runs a little wider than for a direct question: an explanation
 * needs the surrounding material, not just the single closest passage.
 */
export async function explainTopic(options: {
  preparationId: string;
  topic: string;
  minutes: number;
  mode?: "normal" | "simpler" | "example";
}): Promise<TopicExplanation> {
  const { chunks, context, grounded } = await buildGroundedContext({
    preparationId: options.preparationId,
    // The topic name alone is a thin query, so it is expanded a little.
    query: `${options.topic}. Key concepts, definitions and explanations of ${options.topic}.`,
    topK: RETRIEVAL_TOP_K_WIDE,
  });

  if (!grounded) {
    return {
      explanation:
        "Your uploaded material doesn't cover this topic in enough detail to teach it. Add a document that does, and this will fill in.",
      keyIdea: "",
      remember: "",
      covered: false,
      sources: [],
    };
  }

  const response = await generateJson<{
    explanation: string;
    keyIdea: string;
    remember: string;
    covered: boolean;
  }>({
    system: LEARN_SYSTEM,
    prompt: buildLearnPrompt(
      options.topic,
      context,
      options.minutes,
      options.mode ?? "normal",
    ),
    schema: LEARN_SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 2048,
  });

  return {
    explanation: response.explanation.trim(),
    keyIdea: response.keyIdea.trim(),
    remember: response.remember.trim(),
    covered: response.covered,
    sources: toCitations(chunks),
  };
}
