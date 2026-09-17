import "server-only";

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  GeminiError,
  gemini,
} from "./gemini";

/**
 * Turns text into vectors.
 *
 * An embedding is a list of numbers that stands for the *meaning* of a piece
 * of text. Two passages about the same idea end up close together in that
 * space even when they share no words, which is what lets search find
 * "semantic search finds meaning" when the user asks "how does it know what I
 * mean?".
 *
 * Two details matter for retrieval quality:
 *
 *  1. Task type. Gemini embeds documents and queries slightly differently.
 *     Using RETRIEVAL_DOCUMENT when storing and RETRIEVAL_QUERY when
 *     searching measurably improves the match.
 *  2. Normalisation. Gemini's vectors are unit length at the model's full
 *     3072 dimensions. Asking for 768 truncates them, which breaks that, so we
 *     re-normalise. Cosine distance in pgvector assumes it.
 */

/** Gemini accepts batches; this keeps requests comfortably inside its limits. */
const BATCH_SIZE = 32;

function normalise(vector: number[]): number[] {
  let sumOfSquares = 0;
  for (const value of vector) sumOfSquares += value * value;

  const magnitude = Math.sqrt(sumOfSquares);
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

async function embed(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await gemini().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new GeminiError(
      `Expected ${texts.length} embeddings but received ${embeddings.length}.`,
      true,
    );
  }

  return embeddings.map((embedding, index) => {
    const values = embedding.values;
    if (!values || values.length !== EMBEDDING_DIMENSIONS) {
      throw new GeminiError(
        `Embedding ${index} came back with ${values?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSIONS}.`,
        true,
      );
    }
    return normalise(values);
  });
}

/**
 * Embeds chunks for storage, in batches.
 * `onProgress` reports completed count so the UI can move while this runs.
 */
export async function embedDocumentChunks(
  texts: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    vectors.push(...(await embed(batch, "RETRIEVAL_DOCUMENT")));
    onProgress?.(vectors.length, texts.length);
  }

  return vectors;
}

/** Embeds a single question, ready for similarity search. */
export async function embedQuery(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new GeminiError("Nothing to search for.", false);
  }
  const [vector] = await embed([trimmed], "RETRIEVAL_QUERY");
  return vector;
}
