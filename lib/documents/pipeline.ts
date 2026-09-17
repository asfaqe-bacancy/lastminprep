import "server-only";

import type { DocumentStatus } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { downloadDocumentFile } from "@/lib/supabase/storage";
import { embedDocumentChunks } from "@/lib/ai/embeddings";
import { DocumentParseError, extractPdf } from "./parser";
import { chunkPages } from "./chunker";

/**
 * The document pipeline:
 *
 *   stored PDF → extract text → clean → chunk → embed → insert chunks → ready
 *
 * Runs with the service-role client because it writes chunk rows on the user's
 * behalf; the caller has already established that the document belongs to
 * them. Every chunk row still carries user_id, so RLS protects it afterwards.
 *
 * Status is advanced as each step begins, which is what the processing screen
 * polls. A failure records the reason on the document rather than throwing it
 * away, so the user is told what went wrong with their file.
 */
export async function processDocument(documentId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const setStatus = async (
    status: DocumentStatus,
    extra: Record<string, unknown> = {},
  ) => {
    await supabase
      .from("documents")
      .update({ status, ...extra })
      .eq("id", documentId);
  };

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, user_id, preparation_id, filename, file_url")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !document) {
    throw new Error(`Document ${documentId} not found.`);
  }
  if (!document.file_url) {
    await setStatus("failed", { error_message: "The file was never stored." });
    return;
  }

  try {
    await setStatus("extracting");
    const file = await downloadDocumentFile(document.file_url);
    const parsed = await extractPdf(file);

    await setStatus("chunking", { page_count: parsed.pageCount });
    const chunks = chunkPages(parsed.pages);

    if (chunks.length === 0) {
      await setStatus("failed", {
        error_message: "No usable text was found in this document.",
      });
      return;
    }

    await setStatus("embedding");
    const vectors = await embedDocumentChunks(
      chunks.map((chunk) => chunk.content),
    );

    await setStatus("indexing");

    // Replace rather than append, so reprocessing never duplicates chunks.
    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    const rows = chunks.map((chunk, index) => ({
      document_id: documentId,
      preparation_id: document.preparation_id,
      user_id: document.user_id,
      chunk_index: chunk.index,
      content: chunk.content,
      page_number: chunk.pageNumber,
      embedding: vectors[index],
      metadata: { filename: document.filename },
    }));

    // Inserted in batches: a few hundred 768-dimension vectors in one
    // statement is a large payload.
    for (let start = 0; start < rows.length; start += 100) {
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(rows.slice(start, start + 100));

      if (insertError) {
        throw new Error(`Could not store sections: ${insertError.message}`);
      }
    }

    await setStatus("ready", {
      chunk_count: chunks.length,
      error_message: null,
    });
  } catch (cause) {
    const message =
      cause instanceof DocumentParseError
        ? cause.message
        : cause instanceof Error
          ? cause.message
          : "Processing failed.";

    console.error(`[pipeline ${documentId}]`, cause);
    await setStatus("failed", { error_message: message });
  }
}
