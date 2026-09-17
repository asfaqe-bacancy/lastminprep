/**
 * PrepSprint domain types.
 *
 * These mirror the Supabase schema in `supabase/migrations`. Snake_case rows
 * are mapped to camelCase objects in `lib/data/*` so UI code never deals with
 * raw database shapes.
 */

export type PreparationType = "exam" | "interview";

export type PreparationGoal =
  | "quick_revision"
  | "deep_preparation"
  | "practice_questions"
  | "mock_interview";

export type PreparationStatus =
  | "draft"
  | "processing"
  | "ready"
  | "active"
  | "completed";

/**
 * Granular processing stages. The schema doc suggests a single `processing`
 * value; we expand it so the upload screen can show which step is running
 * without a second column.
 */
export type DocumentStatus =
  | "uploading"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexing"
  | "ready"
  | "failed";

export type DocumentRole = "material" | "resume" | "job_description";

export type TopicPriority = "must_know" | "important" | "optional";

export type Difficulty = "easy" | "medium" | "hard";

export type Verdict = "correct" | "partial" | "incorrect";

export type PlanSegmentKind =
  | "learn"
  | "quiz"
  | "interview"
  | "weak_areas"
  | "revision";

export interface PlanSegment {
  kind: PlanSegmentKind;
  label: string;
  minutes: number;
  description: string;
}

export interface PreparationPlan {
  totalMinutes: number;
  headline: string;
  segments: PlanSegment[];
}

export interface Preparation {
  id: string;
  userId: string;
  title: string;
  type: PreparationType;
  goal: PreparationGoal;
  availableMinutes: number;
  status: PreparationStatus;
  plan: PreparationPlan | null;
  revision: FinalRevision | null;
  crashBoard: CrashPrepBoard | null;
  progressPercent: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PreparedDocument {
  id: string;
  preparationId: string;
  userId: string;
  filename: string;
  fileUrl: string | null;
  fileType: string;
  fileSize: number | null;
  role: DocumentRole;
  status: DocumentStatus;
  pageCount: number | null;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface Topic {
  id: string;
  preparationId: string;
  name: string;
  priority: TopicPriority;
  estimatedMinutes: number | null;
  summary: string | null;
  position: number;
}

/** A chunk returned by vector search, with everything needed to cite it. */
export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  filename: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}

/** The citation shape the UI renders. */
export interface SourceCitation {
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber: number | null;
  snippet: string;
}

export interface GroundedAnswer {
  answer: string;
  /** False when retrieval found nothing usable — the UI says so plainly. */
  grounded: boolean;
  sources: SourceCitation[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  sources?: SourceCitation[];
  grounded?: boolean;
  pending?: boolean;
  error?: string;
}

export interface QuizQuestion {
  id: string;
  preparationId: string;
  topicId: string | null;
  topicName: string;
  question: string;
  difficulty: Difficulty;
  expectedAnswer: string | null;
  sourceChunkIds: string[];
  sources: SourceCitation[];
  position: number;
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  userAnswer: string;
  verdict: Verdict;
  /** Prose feedback. Leads with what the user got right. */
  feedback: string;
  missing: string[];
  score: number;
  createdAt: string;
}

export interface QuizResult {
  question: QuizQuestion;
  answer: QuizAnswer;
}

export interface TopicPerformance {
  topicId: string | null;
  name: string;
  questionsAnswered: number;
  questionsCorrect: number;
  /** 0-100 */
  score: number;
  note: string;
}

export interface InterviewSession {
  id: string;
  preparationId: string;
  userId: string;
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
  report: InterviewReport | null;
}

export interface InterviewMessage {
  id: string;
  sessionId: string;
  role: "interviewer" | "user";
  content: string;
  questionNumber: number | null;
  createdAt: string;
}

export interface InterviewScore {
  label: string;
  score: number;
  outOf: number;
  comment: string;
}

export interface InterviewReport {
  questionsAnswered: number;
  scores: InterviewScore[];
  summary: string;
  strengths: string[];
  areasToRevise: { topic: string; why: string }[];
}

export interface CrashPrepTier {
  priority: TopicPriority;
  label: string;
  stars: number;
  topics: { name: string; why: string; minutes: number }[];
}

export interface CrashPrepBoard {
  totalMinutes: number;
  headline: string;
  tiers: CrashPrepTier[];
}

export interface RevisionPoint {
  text: string;
  source: SourceCitation | null;
}

export interface FinalRevision {
  headline: string;
  mustRemember: RevisionPoint[];
  concepts: { title: string; body: string }[];
  commonQuestions: { question: string; answer: string }[];
  weakAreas: string[];
}

export interface ProgressSnapshot {
  preparationsCompleted: number;
  questionsAnswered: number;
  averageScore: number;
  studyMinutes: number;
  weakTopics: TopicPerformance[];
  recentScores: { label: string; score: number }[];
}
