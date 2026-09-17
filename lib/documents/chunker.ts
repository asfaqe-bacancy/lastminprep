import { CHUNK_OVERLAP_CHARS, CHUNK_TARGET_CHARS } from "@/lib/constants";
import type { ParsedPage } from "./parser";

export interface Chunk {
  content: string;
  pageNumber: number;
  /** Position within the document, so chunks can be shown in reading order. */
  index: number;
}

/**
 * Splits a document into overlapping chunks.
 *
 * Why chunk at all: the whole document can't be sent to the model for every
 * question, and smaller passages retrieve far more precisely.
 *
 * The split is recursive — paragraphs first, then sentences, then words — so a
 * chunk breaks at the largest natural boundary that still fits. The overlap
 * carries a little context across the seam, which stops an answer from being
 * cut in half.
 *
 * Sizes are in characters rather than tokens deliberately: it needs no
 * tokeniser, and roughly 4 characters per token makes ~3200 characters land
 * near the 800-token target from the RAG doc.
 */
export function chunkPages(
  pages: ParsedPage[],
  {
    targetChars = CHUNK_TARGET_CHARS,
    overlapChars = CHUNK_OVERLAP_CHARS,
  }: { targetChars?: number; overlapChars?: number } = {},
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    for (const piece of splitRecursively(page.text, targetChars)) {
      chunks.push({ content: piece, pageNumber: page.pageNumber, index: 0 });
    }
  }

  const withOverlap = addOverlap(chunks, overlapChars);

  return withOverlap
    .filter((chunk) => chunk.content.trim().length > 40)
    .map((chunk, index) => ({ ...chunk, index }));
}

const SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "];

function splitRecursively(
  text: string,
  limit: number,
  depth = 0,
): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.length <= limit) return [trimmed];

  const separator = SEPARATORS[depth];

  // Out of separators: cut on length, which only happens for pathological
  // input such as a single unbroken block of characters.
  if (separator === undefined) {
    const pieces: string[] = [];
    for (let start = 0; start < trimmed.length; start += limit) {
      pieces.push(trimmed.slice(start, start + limit));
    }
    return pieces;
  }

  const parts = trimmed.split(separator);
  const merged: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? `${current}${separator}${part}` : part;

    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }

    if (current) merged.push(current);

    // A single part that still doesn't fit goes back through with a finer
    // separator.
    if (part.length > limit) {
      merged.push(...splitRecursively(part, limit, depth + 1));
      current = "";
    } else {
      current = part;
    }
  }

  if (current) merged.push(current);
  return merged.map((piece) => piece.trim()).filter(Boolean);
}

/**
 * Prefixes each chunk with the tail of the previous one, but only within the
 * same page — bleeding text across a page boundary would make the citation
 * wrong.
 */
function addOverlap(chunks: Chunk[], overlapChars: number): Chunk[] {
  if (overlapChars <= 0) return chunks;

  return chunks.map((chunk, index) => {
    const previous = chunks[index - 1];
    if (!previous || previous.pageNumber !== chunk.pageNumber) return chunk;

    const tail = previous.content.slice(-overlapChars);
    const boundary = tail.search(/[.!?]\s|\n/);
    const carried = boundary === -1 ? tail : tail.slice(boundary + 1);

    return {
      ...chunk,
      content: `${carried.trim()} ${chunk.content}`.trim(),
    };
  });
}

/** Rough token count for logging and sanity checks. ~4 chars per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
