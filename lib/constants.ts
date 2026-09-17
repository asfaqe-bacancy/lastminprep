import type {
  Difficulty,
  DocumentRole,
  DocumentStatus,
  PlanSegmentKind,
  PreparationGoal,
  PreparationStatus,
  PreparationType,
  TopicPriority,
  Verdict,
} from "@/types";

export const APP_NAME = "PrepSprint";
export const APP_TAGLINE =
  "Upload what you need to know. Tell us how much time you have.";

export const PREPARATION_TYPES: {
  value: PreparationType;
  label: string;
  description: string;
}[] = [
  {
    value: "exam",
    label: "Exam",
    description: "Notes, course material, past papers or a syllabus.",
  },
  {
    value: "interview",
    label: "Interview",
    description: "A resume, job description and your technical notes.",
  },
];

export const TIME_OPTIONS = [15, 30, 45, 60, 120, 180] as const;

export const GOALS: {
  value: PreparationGoal;
  label: string;
  description: string;
  types: PreparationType[];
}[] = [
  {
    value: "quick_revision",
    label: "Quick revision",
    description: "Skim the essentials and lock them in.",
    types: ["exam", "interview"],
  },
  {
    value: "deep_preparation",
    label: "Deep preparation",
    description: "Work through the material properly, topic by topic.",
    types: ["exam", "interview"],
  },
  {
    value: "practice_questions",
    label: "Practice questions",
    description: "Mostly answering questions, with feedback.",
    types: ["exam", "interview"],
  },
  {
    value: "mock_interview",
    label: "Mock interview",
    description: "A conversational interview, then a written report.",
    types: ["interview"],
  },
];

export const DOCUMENT_ROLES: {
  value: DocumentRole;
  label: string;
  hint: string;
}[] = [
  { value: "material", label: "Material", hint: "Notes, slides, past papers" },
  { value: "resume", label: "Resume", hint: "Used to ask about your work" },
  {
    value: "job_description",
    label: "Job description",
    hint: "Used to target the questions",
  },
];

/** Ordered pipeline stages, used by the processing screen. */
export const PROCESSING_STAGES: {
  status: DocumentStatus;
  label: string;
  running: string;
}[] = [
  { status: "uploading", label: "Uploaded", running: "Uploading" },
  {
    status: "extracting",
    label: "Content extracted",
    running: "Extracting content",
  },
  {
    status: "chunking",
    label: "Study sections created",
    running: "Creating your study sections",
  },
  {
    status: "embedding",
    label: "Material understood",
    running: "Reading through your material",
  },
  { status: "indexing", label: "Indexed", running: "Almost ready" },
];

export const PRIORITY_META: Record<
  TopicPriority,
  { label: string; stars: number; blurb: string }
> = {
  must_know: {
    label: "Must know",
    stars: 5,
    blurb: "Do not walk in without these.",
  },
  important: { label: "Important", stars: 4, blurb: "Worth the time if it's there." },
  optional: { label: "Optional", stars: 2, blurb: "Only if you finish early." },
};

export const SEGMENT_META: Record<
  PlanSegmentKind,
  { label: string; href: string }
> = {
  learn: { label: "Learn", href: "learn" },
  quiz: { label: "Quick check", href: "quiz" },
  interview: { label: "Mock interview", href: "interview" },
  weak_areas: { label: "Weak areas", href: "weak-areas" },
  revision: { label: "Final review", href: "revision" },
};

export const STATUS_LABELS: Record<PreparationStatus, string> = {
  draft: "Draft",
  processing: "Preparing",
  ready: "Ready",
  active: "In progress",
  completed: "Completed",
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; lead: string; tone: "positive" | "caution" | "destructive" }
> = {
  correct: { label: "Correct", lead: "Good answer.", tone: "positive" },
  partial: {
    label: "Partially correct",
    lead: "You're most of the way there.",
    tone: "caution",
  },
  incorrect: {
    label: "Needs another look",
    lead: "Not quite — here's the idea.",
    tone: "destructive",
  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Warm-up",
  medium: "Core",
  hard: "Stretch",
};

/** Retrieval defaults. Deliberately small to start (RAG doc, section 6). */
export const RETRIEVAL_TOP_K = 3;
export const RETRIEVAL_TOP_K_WIDE = 6;
/** Below this cosine similarity we treat retrieval as "nothing useful found". */
export const RETRIEVAL_MIN_SIMILARITY = 0.35;

export const CHUNK_TARGET_CHARS = 3200;
export const CHUNK_OVERLAP_CHARS = 480;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_PREPARATION = 6;
export const QUIZ_LENGTH = 10;
export const INTERVIEW_LENGTH = 8;
