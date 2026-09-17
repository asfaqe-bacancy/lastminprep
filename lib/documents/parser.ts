import "server-only";

import { extractText } from "unpdf";

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pageCount: number;
  pages: ParsedPage[];
}

export class DocumentParseError extends Error {}

/**
 * Extracts text from a PDF, one entry per page.
 *
 * Page numbers are kept all the way through chunking so a citation can say
 * "React Native Notes.pdf, page 12" and mean it (RAG doc, section 2).
 *
 * `unpdf` wraps pdf.js with no native dependencies, so this runs the same in
 * development and on a serverless host.
 */
export async function extractPdf(data: Uint8Array): Promise<ParsedDocument> {
  let result: { totalPages: number; text: string[] };

  try {
    result = await extractText(data, { mergePages: false });
  } catch (cause) {
    throw new DocumentParseError(
      "That PDF couldn't be opened. It may be corrupt or password protected.",
      { cause },
    );
  }

  const pages = result.text
    .map((text, index) => ({
      pageNumber: index + 1,
      text: cleanText(text),
    }))
    .filter((page) => page.text.length > 0);

  if (pages.length === 0) {
    throw new DocumentParseError(
      "No selectable text was found. If this is a scanned document, the text can't be read yet.",
    );
  }

  return { pageCount: result.totalPages, pages };
}

/**
 * Tidies extracted text without changing its meaning.
 *
 * PDF extraction leaves hyphenated line breaks, hard-wrapped sentences and
 * repeated whitespace, all of which make chunks retrieve badly.
 */
export function cleanText(raw: string): string {
  return (
    raw
      // Windows and old Mac line endings.
      .replace(/\r\n?/g, "\n")
      // Ligatures pdf.js sometimes leaves behind.
      .replace(/ﬁ/g, "fi")
      .replace(/ﬂ/g, "fl")
      // Words split across a line break: "architec-\nture" -> "architecture".
      .replace(/([A-Za-z])-\n([a-z])/g, "$1$2")
      // A single newline inside a sentence is a hard wrap, not a paragraph.
      .replace(/([^\n.!?:;])\n(?=[a-z(])/g, "$1 ")
      // Collapse runs of blank lines to one paragraph break.
      .replace(/\n{3,}/g, "\n\n")
      // Non-breaking and zero-width characters.
      .replace(/ /g, " ")
      .replace(/[​-‍﻿]/g, "")
      // Trailing spaces on each line.
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .trim()
  );
}
