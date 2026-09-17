import "server-only";

import { createSupabaseAdminClient } from "./admin";

export const DOCUMENTS_BUCKET = "documents";

/**
 * Uploads a PDF to the private `documents` bucket.
 *
 * The path is prefixed with the owner's id so the storage policy in
 * `supabase/migrations` can restrict access with a simple prefix check.
 */
export async function uploadDocumentFile(
  userId: string,
  preparationId: string,
  file: File,
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const path = `${userId}/${preparationId}/${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export async function downloadDocumentFile(path: string): Promise<Uint8Array> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(path);

  if (error || !data) {
    throw new Error(`Could not read the stored file: ${error?.message ?? "missing"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}

/** Short-lived link, used when the user opens a source document. */
export async function signDocumentUrl(
  path: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function removeDocumentFile(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
}
