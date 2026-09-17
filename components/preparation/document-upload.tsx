"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { DocumentRole } from "@/types";
import {
  DOCUMENT_ROLES,
  MAX_DOCUMENTS_PER_PREPARATION,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PendingUpload {
  file: File;
  role: DocumentRole;
}

/** Deliberately plain: a drop target and a list. Nothing else (design 8). */
export function DocumentUpload({
  files,
  onChange,
  allowRoles,
}: {
  files: PendingUpload[];
  onChange: (files: PendingUpload[]) => void;
  allowRoles: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  function add(incoming: FileList | null) {
    if (!incoming) return;
    const accepted: PendingUpload[] = [];
    let message: string | null = null;

    for (const file of Array.from(incoming)) {
      if (file.type !== "application/pdf") {
        message = `${file.name} isn't a PDF. Only PDFs are supported for now.`;
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        message = `${file.name} is larger than ${formatBytes(MAX_UPLOAD_BYTES)}.`;
        continue;
      }
      if (files.some((entry) => entry.file.name === file.name)) continue;
      accepted.push({ file, role: guessRole(file.name) });
    }

    const next = [...files, ...accepted].slice(0, MAX_DOCUMENTS_PER_PREPARATION);
    if (files.length + accepted.length > MAX_DOCUMENTS_PER_PREPARATION) {
      message = `Up to ${MAX_DOCUMENTS_PER_PREPARATION} documents at a time.`;
    }
    setProblem(message);
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-surface border border-dashed px-6 py-10 text-center transition-colors duration-200",
          dragging ? "border-brand bg-brand-soft/40" : "border-border",
        )}
      >
        <p className="text-[1.0625rem] font-medium">Drop your material here</p>
        <p className="text-muted-foreground mt-1.5 text-[0.8125rem]">
          PDFs, up to {formatBytes(MAX_UPLOAD_BYTES)} each
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="press border-hairline bg-surface rounded-tight mt-5 inline-flex h-10 items-center gap-1.5 border px-4 text-sm font-medium"
        >
          <Plus className="size-4" aria-hidden />
          Add PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(event) => {
            add(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {problem && (
        <p className="text-destructive mt-3 text-[0.8125rem]" role="alert">
          {problem}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-5 divide-y">
          {files.map((entry, index) => (
            <li
              key={entry.file.name}
              className="flex items-center gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem]">{entry.file.name}</p>
                <p className="text-muted-foreground text-[0.8125rem]">
                  {formatBytes(entry.file.size)}
                </p>
              </div>

              {allowRoles && (
                <label className="sr-only" htmlFor={`role-${index}`}>
                  What is {entry.file.name}?
                </label>
              )}
              {allowRoles && (
                <select
                  id={`role-${index}`}
                  value={entry.role}
                  onChange={(event) => {
                    const next = [...files];
                    next[index] = {
                      ...entry,
                      role: event.target.value as DocumentRole,
                    };
                    onChange(next);
                  }}
                  className="border-input bg-surface rounded-tight h-9 shrink-0 border px-2 text-[0.8125rem]"
                >
                  {DOCUMENT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() =>
                  onChange(files.filter((_, position) => position !== index))
                }
                aria-label={`Remove ${entry.file.name}`}
                className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A resume called "resume.pdf" shouldn't need a dropdown. */
function guessRole(filename: string): DocumentRole {
  const name = filename.toLowerCase();
  if (/(resume|cv)\b/.test(name)) return "resume";
  if (/(job.?description|\bjd\b|role|position)/.test(name))
    return "job_description";
  return "material";
}
