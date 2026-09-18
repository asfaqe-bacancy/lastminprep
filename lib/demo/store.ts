/**
 * In-memory store backing demo mode.
 *
 * Seeded from `fixtures.ts` and mutated by the normal app flows, so creating a
 * preparation or answering a question behaves realistically without a
 * database. State is per server process and resets on restart — it is a
 * preview of the UI, not persistence. Held on `globalThis` so dev-server hot
 * reloads don't wipe it mid-click.
 */

import type {
  FinalRevision,
  InterviewMessage,
  InterviewReport,
  InterviewSession,
  Preparation,
  PreparedDocument,
  ProgressSnapshot,
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  Topic,
  TopicPerformance,
} from "@/types";
import {
  DEMO_CRASH_BOARD,
  DEMO_DOCUMENTS,
  DEMO_INTERVIEW_MESSAGES,
  DEMO_INTERVIEW_REPORT,
  DEMO_INTERVIEW_SESSION,
  DEMO_PREPARATIONS,
  DEMO_PROGRESS,
  DEMO_QUIZ_QUESTIONS,
  DEMO_QUIZ_RESULTS,
  DEMO_REVISION,
  DEMO_TOPIC_PERFORMANCE,
  DEMO_TOPICS,
} from "./fixtures";

interface DemoState {
  preparations: Preparation[];
  documents: PreparedDocument[];
  topics: Topic[];
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  sessions: InterviewSession[];
  messages: InterviewMessage[];
  revisions: Record<string, FinalRevision>;
}

function seed(): DemoState {
  return {
    preparations: structuredClone(DEMO_PREPARATIONS),
    documents: structuredClone(DEMO_DOCUMENTS),
    topics: structuredClone(DEMO_TOPICS),
    questions: structuredClone(DEMO_QUIZ_QUESTIONS),
    answers: DEMO_QUIZ_RESULTS.map((result) => structuredClone(result.answer)),
    sessions: [structuredClone(DEMO_INTERVIEW_SESSION)],
    messages: structuredClone(DEMO_INTERVIEW_MESSAGES),
    revisions: { "prep-rn-interview": structuredClone(DEMO_REVISION) },
  };
}

const globalForDemo = globalThis as typeof globalThis & {
  __prepsprintDemoState?: DemoState;
};

function state(): DemoState {
  globalForDemo.__prepsprintDemoState ??= seed();
  return globalForDemo.__prepsprintDemoState;
}

export function resetDemoState(): void {
  globalForDemo.__prepsprintDemoState = seed();
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/* -------------------------------------------------------------- preparations */

export function demoListPreparations(): Preparation[] {
  return [...state().preparations].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function demoGetPreparation(id: string): Preparation | null {
  return state().preparations.find((prep) => prep.id === id) ?? null;
}

export function demoCreatePreparation(
  input: Pick<
    Preparation,
    "title" | "type" | "goal" | "availableMinutes"
  >,
): Preparation {
  const preparation: Preparation = {
    id: newId("prep"),
    userId: "demo-user",
    status: "draft",
    progressPercent: 0,
    plan: null,
    revision: null,
    crashBoard: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    ...input,
  };
  state().preparations.push(preparation);
  return preparation;
}

export function demoUpdatePreparation(
  id: string,
  patch: Partial<Preparation>,
): Preparation | null {
  const preparation = demoGetPreparation(id);
  if (!preparation) return null;
  Object.assign(preparation, patch);
  return preparation;
}

/* ----------------------------------------------------------------- documents */

export function demoListDocuments(preparationId?: string): PreparedDocument[] {
  const all = state().documents;
  const scoped = preparationId
    ? all.filter((doc) => doc.preparationId === preparationId)
    : all;
  return [...scoped].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function demoAddDocument(
  input: Pick<
    PreparedDocument,
    "preparationId" | "filename" | "fileType" | "fileSize" | "role"
  >,
): PreparedDocument {
  const doc: PreparedDocument = {
    id: newId("doc"),
    userId: "demo-user",
    fileUrl: null,
    status: "uploading",
    pageCount: null,
    chunkCount: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    ...input,
  };
  state().documents.push(doc);
  return doc;
}

export function demoUpdateDocument(
  id: string,
  patch: Partial<PreparedDocument>,
): PreparedDocument | null {
  const doc = state().documents.find((item) => item.id === id);
  if (!doc) return null;
  Object.assign(doc, patch);
  return doc;
}

/* -------------------------------------------------------------------- topics */

export function demoListTopics(preparationId: string): Topic[] {
  return state()
    .topics.filter((topic) => topic.preparationId === preparationId)
    .sort((a, b) => a.position - b.position);
}

export function demoSetTopics(preparationId: string, topics: Topic[]): Topic[] {
  const current = state();
  current.topics = current.topics.filter(
    (topic) => topic.preparationId !== preparationId,
  );
  current.topics.push(...topics);
  return demoListTopics(preparationId);
}

/* ---------------------------------------------------------------------- quiz */

export function demoListQuestions(preparationId: string): QuizQuestion[] {
  return state()
    .questions.filter((question) => question.preparationId === preparationId)
    .sort((a, b) => a.position - b.position);
}

export function demoAddQuestion(question: QuizQuestion): QuizQuestion {
  state().questions.push(question);
  return question;
}

export function demoAddAnswer(answer: QuizAnswer): QuizAnswer {
  state().answers.push(answer);
  return answer;
}

export function demoListResults(preparationId: string): QuizResult[] {
  const questions = demoListQuestions(preparationId);
  const answers = state().answers;
  return questions
    .map((question) => {
      const answer = answers.find((item) => item.questionId === question.id);
      return answer ? { question, answer } : null;
    })
    .filter((result): result is QuizResult => result !== null);
}

/* ----------------------------------------------------------------- interview */

export function demoGetSession(preparationId: string): InterviewSession | null {
  return (
    state().sessions.find(
      (session) => session.preparationId === preparationId,
    ) ?? null
  );
}

export function demoStartSession(preparationId: string): InterviewSession {
  const existing = demoGetSession(preparationId);
  if (existing && existing.status === "active") return existing;
  const session: InterviewSession = {
    id: newId("session"),
    preparationId,
    userId: "demo-user",
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    report: null,
  };
  state().sessions.push(session);
  return session;
}

export function demoListMessages(sessionId: string): InterviewMessage[] {
  return state()
    .messages.filter((message) => message.sessionId === sessionId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function demoAddMessage(message: InterviewMessage): InterviewMessage {
  state().messages.push(message);
  return message;
}

export function demoCompleteSession(
  sessionId: string,
  report: InterviewReport,
): InterviewSession | null {
  const session = state().sessions.find((item) => item.id === sessionId);
  if (!session) return null;
  session.status = "completed";
  session.completedAt = new Date().toISOString();
  session.report = report;
  return session;
}

export function demoInterviewReport(): InterviewReport {
  return structuredClone(DEMO_INTERVIEW_REPORT);
}

/* ------------------------------------------------------------------ revision */

export function demoGetRevision(preparationId: string): FinalRevision | null {
  return state().revisions[preparationId] ?? null;
}

export function demoSetRevision(
  preparationId: string,
  revision: FinalRevision,
): FinalRevision {
  state().revisions[preparationId] = revision;
  return revision;
}

/* ------------------------------------------------------------------ progress */

export function demoTopicPerformance(preparationId: string): TopicPerformance[] {
  const results = demoListResults(preparationId);
  if (results.length === 0) return structuredClone(DEMO_TOPIC_PERFORMANCE);

  const byTopic = new Map<string, TopicPerformance>();
  for (const { question, answer } of results) {
    const key = question.topicName;
    const entry = byTopic.get(key) ?? {
      topicId: question.topicId,
      name: key,
      questionsAnswered: 0,
      questionsCorrect: 0,
      score: 0,
      note: "",
    };
    entry.questionsAnswered += 1;
    if (answer.verdict === "correct") entry.questionsCorrect += 1;
    entry.score =
      (entry.score * (entry.questionsAnswered - 1) + answer.score) /
      entry.questionsAnswered;
    byTopic.set(key, entry);
  }
  return [...byTopic.values()].map((entry) => ({
    ...entry,
    score: Math.round(entry.score),
    note: noteForScore(entry.score),
  }));
}

export function noteForScore(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Solid, one gap";
  if (score >= 55) return "Almost there";
  return "Needs another pass";
}

export function demoProgress(): ProgressSnapshot {
  const completed = state().preparations.filter(
    (prep) => prep.status === "completed",
  ).length;
  return {
    ...structuredClone(DEMO_PROGRESS),
    preparationsCompleted: Math.max(completed, DEMO_PROGRESS.preparationsCompleted),
  };
}

export function demoCrashBoard() {
  return structuredClone(DEMO_CRASH_BOARD);
}

/* ------------------------------------------------------- studied topics */

const globalForStudied = globalThis as typeof globalThis & {
  __prepsprintStudied?: Set<string>;
};

function studiedSet(): Set<string> {
  globalForStudied.__prepsprintStudied ??= new Set();
  return globalForStudied.__prepsprintStudied;
}

export function demoMarkTopicStudied(
  preparationId: string,
  topicName: string,
): void {
  studiedSet().add(`${preparationId}:${topicName.toLowerCase()}`);
}

export function demoCountStudiedTopics(preparationId: string): number {
  let count = 0;
  for (const key of studiedSet()) {
    if (key.startsWith(`${preparationId}:`)) count += 1;
  }
  return count;
}
