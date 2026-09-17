import Link from "next/link";
import type { PreparedDocument } from "@/types";
import { DocumentStatusPill } from "./document-status-pill";
import { DOCUMENT_ROLES } from "@/lib/constants";
import { formatBytes, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

function roleLabel(role: PreparedDocument["role"]): string {
  return DOCUMENT_ROLES.find((entry) => entry.value === role)?.label ?? "Material";
}

export function DocumentList({
  documents,
  className,
}: {
  documents: PreparedDocument[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y", className)}>
      {documents.map((document) => (
        <li key={document.id}>
          <Link
            href={`/preparations/${document.preparationId}`}
            className="hover:bg-surface-2 -mx-3 flex items-center gap-4 rounded-tight px-3 py-3.5 transition-colors duration-150"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-medium">
                {document.filename}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-[0.8125rem]">
                {roleLabel(document.role)}
                {document.pageCount !== null && ` · ${document.pageCount} pages`}
                {document.chunkCount !== null &&
                  ` · ${document.chunkCount} sections`}
                {document.fileSize !== null &&
                  ` · ${formatBytes(document.fileSize)}`}
                {` · ${formatRelative(document.createdAt)}`}
              </p>
              {document.errorMessage && (
                <p className="text-destructive mt-1 text-[0.8125rem]">
                  {document.errorMessage}
                </p>
              )}
            </div>
            <DocumentStatusPill status={document.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
