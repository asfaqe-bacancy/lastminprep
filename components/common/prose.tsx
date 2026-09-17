import { cn } from "@/lib/utils";

/**
 * Renders model output as content rather than as a chat message
 * (design-system section 10).
 *
 * Deliberately not a markdown renderer: the prompts ask for plain prose, and
 * this handles the only two shapes that actually come back — paragraphs and
 * simple bullet lists — while stripping any stray emphasis markers. That
 * avoids a markdown dependency and, with it, any HTML injection surface.
 */
export function Prose({
  text,
  className,
  size = "default",
}: {
  text: string;
  className?: string;
  size?: "default" | "large";
}) {
  const blocks = groupBlocks(text);

  return (
    <div
      className={cn(
        "space-y-4",
        size === "large"
          ? "text-[1.0625rem] leading-[1.65]"
          : "text-[0.9375rem] leading-[1.65]",
        className,
      )}
    >
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="space-y-2 pl-0">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span
                  aria-hidden
                  className="bg-muted-foreground/50 mt-[0.6em] size-1 shrink-0 rounded-full"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{block.text}</p>
        ),
      )}
    </div>
  );
}

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function groupBlocks(raw: string): Block[] {
  const lines = clean(raw).split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function clean(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}
