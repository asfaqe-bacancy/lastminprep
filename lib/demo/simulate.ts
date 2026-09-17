import { PROCESSING_STAGES } from "@/lib/constants";
import { demoUpdateDocument } from "./store";

/**
 * Walks a demo document through the processing stages on a timer so the
 * upload screen can be seen working without a backend. Real processing in
 * `lib/documents/pipeline.ts` drives the same statuses.
 */
export function simulateProcessing(documentId: string): void {
  const stages = PROCESSING_STAGES.map((stage) => stage.status);
  let index = 0;

  const advance = () => {
    index += 1;
    if (index < stages.length) {
      demoUpdateDocument(documentId, { status: stages[index] });
      setTimeout(advance, 700 + Math.random() * 500);
      return;
    }
    demoUpdateDocument(documentId, {
      status: "ready",
      pageCount: 12 + Math.floor(Math.random() * 20),
      chunkCount: 30 + Math.floor(Math.random() * 40),
    });
  };

  setTimeout(advance, 600);
}
