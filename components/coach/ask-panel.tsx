"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import type { ChatMessage, SourceCitation } from "@/types";
import { Prose } from "@/components/common/prose";
import { SourceReference } from "@/components/sources/source-reference";
import { readNdjson } from "@/lib/ndjson";
import { cn } from "@/lib/utils";

type StreamEvent =
  | { type: "sources"; sources: SourceCitation[]; grounded: boolean }
  | { type: "text"; text: string }
  | { type: "error"; message: string };

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

/**
 * Asking questions of your own material.
 *
 * Not a chat transcript: the question is a quiet label and the answer is set
 * as content, with its sources underneath (design-system section 10).
 */
export function AskPanel({
  preparationId,
  suggestions = [],
  documentIds,
  placeholder = "Ask anything about your material",
}: {
  preparationId: string;
  suggestions?: string[];
  documentIds?: string[];
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
    };
    const answerId = nextId();

    // Only completed turns are sent back as history.
    const history = messages
      .filter((message) => !message.pending && !message.error)
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages((current) => [
      ...current,
      userMessage,
      { id: answerId, role: "coach", content: "", pending: true },
    ]);
    setDraft("");
    setBusy(true);

    const update = (patch: Partial<ChatMessage>) =>
      setMessages((current) =>
        current.map((message) =>
          message.id === answerId ? { ...message, ...patch } : message,
        ),
      );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          question: trimmed,
          history,
          documentIds,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "That question didn't get through.");
      }

      let text = "";
      for await (const event of readNdjson<StreamEvent>(response)) {
        if (event.type === "sources") {
          update({ sources: event.sources, grounded: event.grounded });
        } else if (event.type === "text") {
          text += event.text;
          update({ content: text, pending: false });
        } else {
          throw new Error(event.message);
        }
      }

      update({ pending: false });
    } catch (cause) {
      update({
        pending: false,
        error:
          cause instanceof Error
            ? cause.message
            : "That question didn't get through.",
      });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div>
      {messages.length === 0 ? (
        <div className="mb-6">
          <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
            Answers come from the documents you uploaded, with the page they
            came from.
          </p>
          {suggestions.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="press border-hairline bg-surface hover:border-border rounded-full border px-3.5 py-2 text-left text-[0.8125rem]"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mb-8 divide-y">
          {chunkTurns(messages).map(([question, answer]) => (
            <article key={question.id} className="animate-fade py-6 first:pt-0">
              <p className="eyebrow mb-2">You asked</p>
              <h3 className="text-[1.0625rem] leading-snug font-medium">
                {question.content}
              </h3>

              <div className="mt-5">
                {answer?.pending && !answer.content ? (
                  <AnswerSkeleton />
                ) : answer?.error ? (
                  <p className="text-destructive text-[0.9375rem]">
                    {answer.error}
                  </p>
                ) : (
                  <>
                    <Prose text={answer?.content ?? ""} />
                    {answer?.grounded === false &&
                      answer.sources &&
                      answer.sources.length === 0 && (
                        <p className="text-muted-foreground mt-4 text-[0.8125rem]">
                          Nothing in your uploaded material matched this.
                        </p>
                      )}
                    {answer?.sources && (
                      <SourceReference sources={answer.sources} />
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
        className="border-hairline rounded-panel bg-surface focus-within:ring-ring/40 flex items-end gap-2 border p-2 transition-shadow focus-within:ring-2"
      >
        <label htmlFor="ask-input" className="sr-only">
          {placeholder}
        </label>
        <textarea
          id="ask-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(draft);
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[0.9375rem] outline-none"
        />
        <button
          type="submit"
          disabled={busy || draft.trim().length === 0}
          aria-label="Ask"
          className={cn(
            "press bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity",
            (busy || draft.trim().length === 0) && "opacity-40",
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="size-4" aria-hidden />
          )}
        </button>
      </form>
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div className="space-y-3" aria-label="Writing an answer" role="status">
      {[100, 92, 96, 64].map((width, index) => (
        <div
          key={index}
          className="bg-muted animate-pulse h-4 rounded-full"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

/** Pairs each question with its answer. */
function chunkTurns(messages: ChatMessage[]): [ChatMessage, ChatMessage?][] {
  const turns: [ChatMessage, ChatMessage?][] = [];
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const next = messages[index + 1];
    turns.push([message, next?.role === "coach" ? next : undefined]);
  }
  return turns;
}
