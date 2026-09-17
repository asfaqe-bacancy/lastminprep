import "server-only";

import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
  type SchemaUnion,
} from "@google/genai";
import { requireGeminiKey } from "@/lib/env";

/** One place to change the models. */
export const GENERATION_MODEL = "gemini-2.5-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * 768 keeps the vectors small and, crucially, under pgvector's 2000-dimension
 * limit for ivfflat/hnsw indexes. It must match `vector(768)` in the
 * migrations — changing one without the other will break inserts.
 */
export const EMBEDDING_DIMENSIONS = 768;

let cached: GoogleGenAI | null = null;

/** Lazily constructed so importing this module never requires a key. */
export function gemini(): GoogleGenAI {
  cached ??= new GoogleGenAI({ apiKey: requireGeminiKey() });
  return cached;
}

/** A failure we can explain to the user without leaking internals. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

function describe(cause: unknown): GeminiError {
  const raw = cause instanceof Error ? cause.message : String(cause);

  if (/429|RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return new GeminiError(
      "The model is rate limited right now. Give it a few seconds and try again.",
      true,
    );
  }
  if (/50[0-9]|UNAVAILABLE|overloaded/i.test(raw)) {
    return new GeminiError(
      "The model is busy. Trying again usually works.",
      true,
    );
  }
  if (/API key|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(raw)) {
    return new GeminiError(
      "Gemini rejected the API key. Check GEMINI_API_KEY in .env.local.",
      false,
    );
  }
  if (/SAFETY|blocked/i.test(raw)) {
    return new GeminiError(
      "The model declined to answer that. Try rewording it.",
      false,
    );
  }
  return new GeminiError(
    "Gemini couldn't complete that request. Try again in a moment.",
    true,
  );
}

const MAX_ATTEMPTS = 3;

/** Retries only what is worth retrying, with a short backoff. */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: GeminiError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (cause) {
      lastError = describe(cause);
      if (!lastError.retryable || attempt === MAX_ATTEMPTS) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    }
  }

  throw lastError ?? new GeminiError("Unknown Gemini failure.", false);
}

export interface PromptRequest {
  system: string;
  /** Prior turns, oldest first. Kept short by the caller (RAG doc, §11). */
  history?: Content[];
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** 0 disables thinking — right for fast, mechanical steps. */
  thinkingBudget?: number;
  signal?: AbortSignal;
}

function buildContents(request: PromptRequest): Content[] {
  return [
    ...(request.history ?? []),
    { role: "user", parts: [{ text: request.prompt }] },
  ];
}

function buildConfig(
  request: PromptRequest,
  extra?: GenerateContentConfig,
): GenerateContentConfig {
  return {
    systemInstruction: request.system,
    temperature: request.temperature ?? 0.4,
    maxOutputTokens: request.maxOutputTokens ?? 2048,
    thinkingConfig: { thinkingBudget: request.thinkingBudget ?? 0 },
    abortSignal: request.signal,
    ...extra,
  };
}

/** Plain text generation. */
export async function generateText(request: PromptRequest): Promise<string> {
  return withRetry(async () => {
    const response = await gemini().models.generateContent({
      model: GENERATION_MODEL,
      contents: buildContents(request),
      config: buildConfig(request),
    });

    const text = response.text?.trim();
    if (!text) {
      throw new GeminiError("The model returned an empty response.", true);
    }
    return text;
  });
}

/**
 * Structured generation. Everything the product needs from the model — plans,
 * questions, evaluations, reports — comes back through here, so a malformed
 * response is a caught error rather than a broken screen.
 */
export async function generateJson<T>(
  request: PromptRequest & { schema: SchemaUnion },
): Promise<T> {
  const raw = await withRetry(async () => {
    const response = await gemini().models.generateContent({
      model: GENERATION_MODEL,
      contents: buildContents(request),
      config: buildConfig(request, {
        responseMimeType: "application/json",
        responseSchema: request.schema,
      }),
    });

    const text = response.text?.trim();
    if (!text) {
      throw new GeminiError("The model returned an empty response.", true);
    }
    return text;
  });

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GeminiError(
      "The model's reply wasn't valid JSON. Try again.",
      true,
    );
  }
}

/** Streams text chunks as they arrive, for anything the user reads live. */
export async function* streamText(
  request: PromptRequest,
): AsyncGenerator<string> {
  const stream = await withRetry(() =>
    gemini().models.generateContentStream({
      model: GENERATION_MODEL,
      contents: buildContents(request),
      config: buildConfig(request),
    }),
  );

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/** Turns our chat messages into the SDK's history shape. */
export function toHistory(
  messages: { role: "user" | "coach"; content: string }[],
  limit = 8,
): Content[] {
  return messages.slice(-limit).map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));
}
