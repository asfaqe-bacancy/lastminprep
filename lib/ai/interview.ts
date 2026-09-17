import "server-only";

import type {
  InterviewMessage,
  InterviewReport,
  InterviewScore,
} from "@/types";
import { INTERVIEW_LENGTH, RETRIEVAL_TOP_K_WIDE } from "@/lib/constants";
import { typeLabel } from "@/lib/format";
import { sampleChunks } from "@/lib/data/chunks";
import { buildGroundedContext } from "./rag";
import {
  INTERVIEW_REPORT_SYSTEM,
  INTERVIEW_SYSTEM,
  buildContextBlock,
  buildInterviewFollowUpPrompt,
  buildInterviewOpeningPrompt,
  buildInterviewReportPrompt,
} from "./prompts";
import {
  INTERVIEW_QUESTION_SCHEMA,
  INTERVIEW_REPORT_SCHEMA,
} from "./schemas";
import { generateJson, toHistory } from "./gemini";

/**
 * The AI interviewer.
 *
 * Two things make it feel like an interview rather than a quiz:
 *
 *  1. It sees the conversation so far, so a follow-up genuinely follows on
 *     from what the candidate just said.
 *  2. It never marks an answer mid-interview. Evaluation is withheld until
 *     the closing report (PRD section 16).
 */

export interface InterviewQuestion {
  question: string;
  topic: string;
}

/** Resume and job description first — that's what makes questions specific. */
async function interviewContext(
  preparationId: string,
  documentIds: string[] | undefined,
  query: string,
): Promise<string> {
  const retrieved = await buildGroundedContext({
    preparationId,
    query,
    topK: RETRIEVAL_TOP_K_WIDE,
    documentIds,
  });

  if (retrieved.grounded) return retrieved.context;

  // Nothing matched, so fall back to a sample of everything rather than
  // interviewing with no material at all.
  const sample = await sampleChunks(preparationId, 10, documentIds);
  return buildContextBlock(sample);
}

export async function askOpeningQuestion(options: {
  preparationId: string;
  topics: string[];
  documentIds?: string[];
}): Promise<InterviewQuestion> {
  const context = await interviewContext(
    options.preparationId,
    options.documentIds,
    `Experience, responsibilities and requirements relating to ${options.topics.join(", ") || "this role"}.`,
  );

  const response = await generateJson<InterviewQuestion>({
    system: INTERVIEW_SYSTEM,
    prompt: buildInterviewOpeningPrompt({
      context,
      type: "Interview",
      topics: options.topics,
    }),
    schema: INTERVIEW_QUESTION_SCHEMA,
    temperature: 0.9,
    maxOutputTokens: 512,
  });

  return {
    question: response.question.trim(),
    topic: response.topic.trim() || options.topics[0] || "General",
  };
}

export async function askFollowUpQuestion(options: {
  preparationId: string;
  topics: string[];
  messages: InterviewMessage[];
  documentIds?: string[];
  total?: number;
}): Promise<InterviewQuestion> {
  const total = options.total ?? INTERVIEW_LENGTH;
  const asked = options.messages.filter(
    (message) => message.role === "interviewer",
  ).length;
  const lastAnswer =
    [...options.messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";

  // Retrieve against what they just said, so the follow-up can be checked
  // against the material rather than invented.
  const context = await interviewContext(
    options.preparationId,
    options.documentIds,
    lastAnswer || options.topics.join(", "),
  );

  const covered = new Set(
    options.messages
      .filter((message) => message.role === "interviewer")
      .map((message) => message.content.toLowerCase()),
  );

  const response = await generateJson<InterviewQuestion>({
    system: INTERVIEW_SYSTEM,
    history: toHistory(
      options.messages.map((message) => ({
        role: message.role === "user" ? "user" : "coach",
        content: message.content,
      })),
      10,
    ),
    prompt: buildInterviewFollowUpPrompt({
      context,
      questionNumber: asked + 1,
      remaining: Math.max(0, total - asked - 1),
      topics: options.topics.filter(
        (topic) => !covered.has(topic.toLowerCase()),
      ),
    }),
    schema: INTERVIEW_QUESTION_SCHEMA,
    temperature: 0.9,
    maxOutputTokens: 512,
  });

  return {
    question: response.question.trim(),
    topic: response.topic.trim() || "General",
  };
}

const SCORE_LABELS = [
  "Technical knowledge",
  "Communication",
  "Topic coverage",
] as const;

export async function writeInterviewReport(options: {
  preparationId: string;
  type: "exam" | "interview";
  messages: InterviewMessage[];
  documentIds?: string[];
}): Promise<InterviewReport> {
  const answered = options.messages.filter(
    (message) => message.role === "user",
  ).length;

  const transcript = options.messages
    .map(
      (message) =>
        `${message.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${message.content}`,
    )
    .join("\n\n");

  const sample = await sampleChunks(options.preparationId, 10, options.documentIds);

  const response = await generateJson<{
    summary: string;
    scores: { label: string; score: number; comment: string }[];
    strengths: string[];
    areasToRevise: { topic: string; why: string }[];
  }>({
    system: INTERVIEW_REPORT_SYSTEM,
    prompt: buildInterviewReportPrompt({
      context: buildContextBlock(sample),
      transcript: transcript || "(no answers were given)",
    }),
    schema: INTERVIEW_REPORT_SCHEMA,
    temperature: 0.4,
    thinkingBudget: 1024,
    maxOutputTokens: 3072,
  });

  const scores: InterviewScore[] = SCORE_LABELS.map((label) => {
    const match = response.scores.find((entry) => entry.label === label);
    return {
      label,
      score: Math.min(10, Math.max(0, Math.round(match?.score ?? 0))),
      outOf: 10,
      comment: match?.comment?.trim() ?? "Not enough was said to judge this.",
    };
  });

  return {
    questionsAnswered: answered,
    scores,
    summary: response.summary.trim(),
    strengths: (response.strengths ?? [])
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 4),
    areasToRevise: (response.areasToRevise ?? [])
      .filter((entry) => entry.topic?.trim())
      .map((entry) => ({
        topic: entry.topic.trim(),
        why: entry.why?.trim() ?? "",
      }))
      .slice(0, 5),
  };
}

/** Average of the report's scores, as a percentage for the progress bars. */
export function reportScorePercent(report: InterviewReport): number {
  if (report.scores.length === 0) return 0;
  const total = report.scores.reduce(
    (sum, score) => sum + score.score / score.outOf,
    0,
  );
  return Math.round((total / report.scores.length) * 100);
}

export { typeLabel };
