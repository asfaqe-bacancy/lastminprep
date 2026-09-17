import "server-only";

import type { DocumentRole, DocumentStatus, PreparedDocument } from "@/types";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  demoAddDocument,
  demoListDocuments,
  demoUpdateDocument,
} from "@/lib/demo/store";

interface DocumentRow {
  id: string;
  preparation_id: string;
  user_id: string;
  filename: string;
  file_url: string | null;
  file_type: string;
  file_size: number | null;
  role: DocumentRole;
  status: DocumentStatus;
  page_count: number | null;
  chunk_count: number | null;
  error_message: string | null;
  created_at: string;
}

const DOCUMENT_COLUMNS =
  "id, preparation_id, user_id, filename, file_url, file_type, file_size, role, status, page_count, chunk_count, error_message, created_at";

function toDocument(row: DocumentRow): PreparedDocument {
  return {
    id: row.id,
    preparationId: row.preparation_id,
    userId: row.user_id,
    filename: row.filename,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    role: row.role,
    status: row.status,
    pageCount: row.page_count,
    chunkCount: row.chunk_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function listDocuments(
  preparationId?: string,
): Promise<PreparedDocument[]> {
  if (isDemoMode()) return demoListDocuments(preparationId);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (preparationId) query = query.eq("preparation_id", preparationId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load documents: ${error.message}`);
  return (data as DocumentRow[]).map(toDocument);
}

export async function getDocument(
  id: string,
): Promise<PreparedDocument | null> {
  if (isDemoMode()) {
    return demoListDocuments().find((doc) => doc.id === id) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load document: ${error.message}`);
  return data ? toDocument(data as DocumentRow) : null;
}

export async function createDocument(input: {
  preparationId: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  fileUrl: string | null;
  role: DocumentRole;
}): Promise<PreparedDocument> {
  if (isDemoMode()) {
    return demoAddDocument({
      preparationId: input.preparationId,
      filename: input.filename,
      fileType: input.fileType,
      fileSize: input.fileSize,
      role: input.role,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      preparation_id: input.preparationId,
      user_id: input.userId,
      filename: input.filename,
      file_type: input.fileType,
      file_size: input.fileSize,
      file_url: input.fileUrl,
      role: input.role,
      status: "uploading",
    })
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) throw new Error(`Could not save document: ${error.message}`);
  return toDocument(data as DocumentRow);
}

export async function updateDocument(
  id: string,
  patch: {
    status?: DocumentStatus;
    pageCount?: number | null;
    chunkCount?: number | null;
    errorMessage?: string | null;
    fileUrl?: string | null;
  },
): Promise<PreparedDocument | null> {
  if (isDemoMode()) return demoUpdateDocument(id, patch);

  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.pageCount !== undefined) row.page_count = patch.pageCount;
  if (patch.chunkCount !== undefined) row.chunk_count = patch.chunkCount;
  if (patch.errorMessage !== undefined) row.error_message = patch.errorMessage;
  if (patch.fileUrl !== undefined) row.file_url = patch.fileUrl;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .update(row)
    .eq("id", id)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Could not update document: ${error.message}`);
  return data ? toDocument(data as DocumentRow) : null;
}

export async function deleteDocument(id: string): Promise<void> {
  if (isDemoMode()) {
    demoUpdateDocument(id, { status: "failed", errorMessage: "Removed" });
    return;
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(`Could not remove document: ${error.message}`);
}
