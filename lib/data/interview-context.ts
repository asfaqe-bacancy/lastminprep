import "server-only";

import { listDocuments } from "./documents";

/**
 * The documents an interviewer should lean on.
 *
 * A resume and a job description are what make questions specific to the
 * candidate, so when either is present retrieval is narrowed to them plus the
 * technical material. With neither, everything is fair game.
 */
export async function interviewDocumentIds(
  preparationId: string,
): Promise<string[] | undefined> {
  const documents = await listDocuments(preparationId);
  const ready = documents.filter((document) => document.status === "ready");

  const targeted = ready.filter(
    (document) => document.role === "resume" || document.role === "job_description",
  );

  if (targeted.length === 0) return undefined;
  return ready.map((document) => document.id);
}
