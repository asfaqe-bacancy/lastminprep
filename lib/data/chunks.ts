import "server-only";

import type { RetrievedChunk } from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_CORPUS } from "@/lib/demo/fixtures";

interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  page_number: number | null;
  chunk_index: number;
  documents: { filename: string } | null;
}

/**
 * An even sample of chunks across a preparation's documents.
 *
 * Planning needs an overview of the material, not the passages closest to one
 * question, so this reads in document order and takes a regular stride rather
 * than running a similarity search.
 */
export async function sampleChunks(
  preparationId: string,
  limit = 24,
  documentIds?: string[],
): Promise<RetrievedChunk[]> {
  if (isDemoMode()) {
    const pool = documentIds
      ? DEMO_CORPUS.filter((entry) => documentIds.includes(entry.documentId))
      : DEMO_CORPUS;
    return stride(pool, limit).map((entry) => ({ ...entry, similarity: 1 }));
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("document_chunks")
    .select("id, document_id, content, page_number, chunk_index, documents(filename)")
    .eq("preparation_id", preparationId)
    .order("document_id", { ascending: true })
    .order("chunk_index", { ascending: true })
    // Read more than we need, then thin it out, so the sample spans the
    // whole document rather than only its opening pages.
    .limit(Math.max(limit * 6, 120));

  if (documentIds && documentIds.length > 0) {
    query = query.in("document_id", documentIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not read your material: ${error.message}`);

  const rows = (data ?? []) as unknown as ChunkRow[];

  return stride(rows, limit).map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    filename: row.documents?.filename ?? "Document",
    content: row.content,
    pageNumber: row.page_number,
    similarity: 1,
  }));
}

/** Keeps `limit` items spread evenly through the list, always including the first. */
function stride<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  const step = items.length / limit;
  const picked: T[] = [];
  for (let index = 0; index < limit; index += 1) {
    picked.push(items[Math.floor(index * step)]);
  }
  return picked;
}

export async function countChunks(preparationId: string): Promise<number> {
  if (isDemoMode()) return DEMO_CORPUS.length;

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("preparation_id", preparationId);

  if (error) throw new Error(`Could not count sections: ${error.message}`);

  // A HEAD request carries no response body, so a failure such as a missing
  // table arrives as error: null with no count rather than as an error.
  // Treating that as zero would silently report an empty preparation.
  if (count === null) {
    throw new Error(
      "Could not count sections: the database did not return a count. Check that the migrations in supabase/ have been applied.",
    );
  }

  return count;
}

/** Fetches specific chunks by id, for citing a question's sources later. */
export async function getChunksByIds(
  ids: string[],
): Promise<RetrievedChunk[]> {
  if (ids.length === 0) return [];

  if (isDemoMode()) {
    return DEMO_CORPUS.filter((entry) => ids.includes(entry.chunkId)).map(
      (entry) => ({ ...entry, similarity: 1 }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, page_number, chunk_index, documents(filename)")
    .in("id", ids);

  if (error) throw new Error(`Could not read sources: ${error.message}`);

  return ((data ?? []) as unknown as ChunkRow[]).map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    filename: row.documents?.filename ?? "Document",
    content: row.content,
    pageNumber: row.page_number,
    similarity: 1,
  }));
}
