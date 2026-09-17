/**
 * Fixture data for demo mode.
 *
 * Used only when Supabase is unconfigured (see `lib/env.ts`). It lets every
 * screen render — and be reviewed — before credentials exist, and doubles as a
 * safe fallback if a live demo loses its network.
 *
 * The content deliberately matches the worked examples in the product docs.
 */

import type {
  CrashPrepBoard,
  FinalRevision,
  InterviewMessage,
  InterviewReport,
  InterviewSession,
  Preparation,
  PreparedDocument,
  ProgressSnapshot,
  QuizQuestion,
  QuizResult,
  SourceCitation,
  Topic,
  TopicPerformance,
} from "@/types";

const DEMO_USER = "demo-user";

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const DEMO_PROFILE = {
  id: DEMO_USER,
  name: "Asfaqe",
  email: "you@example.com",
};

const rnSource = (page: number, snippet: string): SourceCitation => ({
  chunkId: `chunk-rn-${page}`,
  documentId: "doc-rn-notes",
  filename: "React Native Notes.pdf",
  pageNumber: page,
  snippet,
});

export const DEMO_PREPARATIONS: Preparation[] = [
  {
    id: "prep-rn-interview",
    userId: DEMO_USER,
    title: "React Native Interview",
    type: "interview",
    goal: "mock_interview",
    availableMinutes: 45,
    status: "active",
    progressPercent: 68,
    revision: null,
    crashBoard: null,
    plan: {
      totalMinutes: 45,
      headline: "Architecture first, then performance. Skip tooling.",
      segments: [
        {
          kind: "learn",
          label: "Learn",
          minutes: 10,
          description: "The New Architecture, in the words of your own notes.",
        },
        {
          kind: "quiz",
          label: "Quick check",
          minutes: 15,
          description: "Ten questions drawn from what you uploaded.",
        },
        {
          kind: "interview",
          label: "Mock interview",
          minutes: 15,
          description: "Questions shaped by your resume and the job description.",
        },
        {
          kind: "revision",
          label: "Final review",
          minutes: 5,
          description: "The five things to walk in remembering.",
        },
      ],
    },
    createdAt: isoMinutesAgo(26),
    startedAt: isoMinutesAgo(22),
    completedAt: null,
  },
  {
    id: "prep-js-exam",
    userId: DEMO_USER,
    title: "JavaScript Exam",
    type: "exam",
    goal: "deep_preparation",
    availableMinutes: 180,
    status: "completed",
    progressPercent: 100,
    revision: null,
    crashBoard: null,
    plan: {
      totalMinutes: 180,
      headline: "Closures and the event loop carried the most marks.",
      segments: [
        {
          kind: "learn",
          label: "Learn",
          minutes: 45,
          description: "Closures, prototypes, the event loop.",
        },
        {
          kind: "quiz",
          label: "Quick check",
          minutes: 60,
          description: "Past-paper style questions.",
        },
        {
          kind: "weak_areas",
          label: "Weak areas",
          minutes: 55,
          description: "Targeted practice on what slipped.",
        },
        {
          kind: "revision",
          label: "Final review",
          minutes: 20,
          description: "One page to read on the way in.",
        },
      ],
    },
    createdAt: isoMinutesAgo(60 * 32),
    startedAt: isoMinutesAgo(60 * 31),
    completedAt: isoMinutesAgo(60 * 28),
  },
  {
    id: "prep-dbms-exam",
    userId: DEMO_USER,
    title: "DBMS Exam",
    type: "exam",
    goal: "quick_revision",
    availableMinutes: 30,
    status: "ready",
    progressPercent: 0,
    revision: null,
    crashBoard: null,
    plan: null,
    createdAt: isoMinutesAgo(60 * 5),
    startedAt: null,
    completedAt: null,
  },
];

export const DEMO_DOCUMENTS: PreparedDocument[] = [
  {
    id: "doc-rn-notes",
    preparationId: "prep-rn-interview",
    userId: DEMO_USER,
    filename: "React Native Notes.pdf",
    fileUrl: null,
    fileType: "application/pdf",
    fileSize: 2_412_000,
    role: "material",
    status: "ready",
    pageCount: 24,
    chunkCount: 62,
    errorMessage: null,
    createdAt: isoMinutesAgo(26),
  },
  {
    id: "doc-resume",
    preparationId: "prep-rn-interview",
    userId: DEMO_USER,
    filename: "Resume.pdf",
    fileUrl: null,
    fileType: "application/pdf",
    fileSize: 184_000,
    role: "resume",
    status: "ready",
    pageCount: 2,
    chunkCount: 6,
    errorMessage: null,
    createdAt: isoMinutesAgo(26),
  },
  {
    id: "doc-jd",
    preparationId: "prep-rn-interview",
    userId: DEMO_USER,
    filename: "Job Description.pdf",
    fileUrl: null,
    fileType: "application/pdf",
    fileSize: 96_000,
    role: "job_description",
    status: "ready",
    pageCount: 1,
    chunkCount: 3,
    errorMessage: null,
    createdAt: isoMinutesAgo(25),
  },
  {
    id: "doc-js-notes",
    preparationId: "prep-js-exam",
    userId: DEMO_USER,
    filename: "JavaScript Notes.pdf",
    fileUrl: null,
    fileType: "application/pdf",
    fileSize: 3_800_000,
    role: "material",
    status: "ready",
    pageCount: 58,
    chunkCount: 141,
    errorMessage: null,
    createdAt: isoMinutesAgo(60 * 32),
  },
  {
    id: "doc-dbms",
    preparationId: "prep-dbms-exam",
    userId: DEMO_USER,
    filename: "DBMS Unit 3.pdf",
    fileUrl: null,
    fileType: "application/pdf",
    fileSize: 1_100_000,
    role: "material",
    status: "ready",
    pageCount: 18,
    chunkCount: 40,
    errorMessage: null,
    createdAt: isoMinutesAgo(60 * 5),
  },
];

export const DEMO_TOPICS: Topic[] = [
  {
    id: "topic-architecture",
    preparationId: "prep-rn-interview",
    name: "Architecture",
    priority: "must_know",
    estimatedMinutes: 12,
    summary:
      "Fabric, TurboModules and the JSI — why the bridge went away and what replaced it.",
    position: 0,
  },
  {
    id: "topic-performance",
    preparationId: "prep-rn-interview",
    name: "Performance",
    priority: "must_know",
    estimatedMinutes: 10,
    summary:
      "Where frames are lost, how to measure it, and the fixes your notes recommend.",
    position: 1,
  },
  {
    id: "topic-state",
    preparationId: "prep-rn-interview",
    name: "State management",
    priority: "must_know",
    estimatedMinutes: 8,
    summary: "Local state, context, and when a store actually earns its place.",
    position: 2,
  },
  {
    id: "topic-offline",
    preparationId: "prep-rn-interview",
    name: "Offline-first",
    priority: "important",
    estimatedMinutes: 8,
    summary: "Queueing writes, resolving conflicts, and what to show the user.",
    position: 3,
  },
  {
    id: "topic-networking",
    preparationId: "prep-rn-interview",
    name: "Networking",
    priority: "important",
    estimatedMinutes: 6,
    summary: "Retries, cancellation and caching on a flaky connection.",
    position: 4,
  },
  {
    id: "topic-testing",
    preparationId: "prep-rn-interview",
    name: "Testing",
    priority: "optional",
    estimatedMinutes: 4,
    summary: "What you'd test and where you'd stop.",
    position: 5,
  },
  {
    id: "topic-deployment",
    preparationId: "prep-rn-interview",
    name: "Deployment",
    priority: "optional",
    estimatedMinutes: 4,
    summary: "Release channels and over-the-air updates.",
    position: 6,
  },
];

export const DEMO_CRASH_BOARD: CrashPrepBoard = {
  totalMinutes: 45,
  headline:
    "Forty-five minutes buys you three topics properly, not seven badly.",
  tiers: [
    {
      priority: "must_know",
      label: "Must know",
      stars: 5,
      topics: [
        {
          name: "React Native architecture",
          why: "The job description names it twice and your notes cover it in depth.",
          minutes: 12,
        },
        {
          name: "Performance optimization",
          why: "Your resume claims it, so expect to be pushed on specifics.",
          minutes: 10,
        },
        {
          name: "State management",
          why: "Comes up in almost every round at this level.",
          minutes: 8,
        },
      ],
    },
    {
      priority: "important",
      label: "Important",
      stars: 4,
      topics: [
        {
          name: "Networking",
          why: "Your notes tie it to the offline work on your resume.",
          minutes: 6,
        },
        {
          name: "Offline-first architecture",
          why: "One strong example is enough here.",
          minutes: 5,
        },
      ],
    },
    {
      priority: "optional",
      label: "Optional",
      stars: 2,
      topics: [
        {
          name: "Testing",
          why: "Only if you finish early — a sentence of intent will do.",
          minutes: 2,
        },
        {
          name: "Deployment",
          why: "Unlikely to decide the round.",
          minutes: 2,
        },
      ],
    },
  ],
};

export const DEMO_LEARN_CONTENT: Record<
  string,
  { title: string; body: string; keyIdea: string; remember: string; sources: SourceCitation[] }
> = {
  "topic-architecture": {
    title: "Architecture",
    body: "The New Architecture changes how React Native communicates between JavaScript and native code. The old asynchronous bridge serialised every call to JSON and shipped it across a queue, which meant no call could ever be synchronous and every frame paid a serialisation cost. The JSI replaces that queue with direct references: JavaScript holds a handle on a native object and calls it in process.\n\nTwo systems sit on top of the JSI. Fabric is the new renderer, and it builds an immutable shadow tree that can be created on any thread, so layout no longer blocks the main thread. TurboModules make native modules lazy — a module is only initialised the first time it is actually used, which is why startup improves noticeably on large apps.",
    keyIdea:
      "The bridge was removed, not optimised. JSI lets JavaScript hold direct references to native objects.",
    remember:
      "Fabric is the renderer. TurboModules are lazy native modules. Both sit on the JSI.",
    sources: [
      rnSource(
        12,
        "The New Architecture replaces the asynchronous bridge with the JavaScript Interface (JSI), allowing direct, synchronous access to native objects without JSON serialisation.",
      ),
      rnSource(
        8,
        "Fabric constructs an immutable shadow tree which can be created off the main thread, so layout work no longer competes with user interaction.",
      ),
    ],
  },
  "topic-performance": {
    title: "Performance",
    body: "Almost all dropped frames in a React Native app come from one of three places: doing too much work in a render pass, re-rendering subtrees that did not change, and moving large amounts of data across the boundary between JavaScript and native.\n\nYour notes recommend measuring before changing anything. Start with the frame rate monitor to confirm which thread is losing frames — the JS thread and the UI thread fail in different ways and need different fixes. A JS-thread stall points at render work or an expensive synchronous computation; a UI-thread stall points at layout, shadow or image decoding.",
    keyIdea:
      "Find out which thread is dropping frames before you change any code.",
    remember:
      "Measure first. JS-thread stalls mean render work; UI-thread stalls mean layout or images.",
    sources: [
      rnSource(
        17,
        "Use the performance monitor to establish which thread is dropping frames. Optimising the wrong thread is the most common wasted effort.",
      ),
    ],
  },
};

export const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-1",
    preparationId: "prep-rn-interview",
    topicId: "topic-architecture",
    topicName: "Architecture",
    question: "What problem does the New Architecture solve?",
    difficulty: "medium",
    expectedAnswer:
      "It removes the asynchronous JSON bridge, replacing it with the JSI so JavaScript can hold direct references to native objects and call them synchronously.",
    sourceChunkIds: ["chunk-rn-12"],
    sources: [
      rnSource(
        12,
        "The New Architecture replaces the asynchronous bridge with the JavaScript Interface (JSI), allowing direct, synchronous access to native objects.",
      ),
    ],
    position: 3,
  },
  {
    id: "q-2",
    preparationId: "prep-rn-interview",
    topicId: "topic-performance",
    topicName: "Performance",
    question:
      "How would you diagnose a list that stutters while scrolling?",
    difficulty: "hard",
    expectedAnswer:
      "Check which thread is dropping frames, then look at row re-renders, image decoding and whether the list is virtualised with stable keys.",
    sourceChunkIds: ["chunk-rn-17"],
    sources: [
      rnSource(
        17,
        "Use the performance monitor to establish which thread is dropping frames before changing any code.",
      ),
    ],
    position: 4,
  },
];

export const DEMO_QUIZ_RESULTS: QuizResult[] = [
  {
    question: DEMO_QUIZ_QUESTIONS[0],
    answer: {
      id: "a-1",
      questionId: "q-1",
      userAnswer:
        "It gets rid of the bridge so JS and native can talk directly instead of sending JSON messages.",
      verdict: "partial",
      feedback:
        "You have the central point: the serialised bridge is gone and calls are direct. What's missing is the name of the mechanism — the JSI — and the consequence that calls can now be synchronous.",
      missing: ["JSI as the replacement", "Synchronous calls become possible"],
      score: 70,
      createdAt: isoMinutesAgo(12),
    },
  },
];

export const DEMO_TOPIC_PERFORMANCE: TopicPerformance[] = [
  {
    topicId: "topic-state",
    name: "State management",
    questionsAnswered: 4,
    questionsCorrect: 2,
    score: 50,
    note: "Needs another pass",
  },
  {
    topicId: "topic-offline",
    name: "Offline-first",
    questionsAnswered: 3,
    questionsCorrect: 2,
    score: 62,
    note: "Almost there",
  },
  {
    topicId: "topic-performance",
    name: "Performance",
    questionsAnswered: 5,
    questionsCorrect: 4,
    score: 78,
    note: "Solid, one gap",
  },
  {
    topicId: "topic-architecture",
    name: "Architecture",
    questionsAnswered: 6,
    questionsCorrect: 6,
    score: 94,
    note: "Strong",
  },
];

export const DEMO_INTERVIEW_SESSION: InterviewSession = {
  id: "session-1",
  preparationId: "prep-rn-interview",
  userId: DEMO_USER,
  status: "active",
  startedAt: isoMinutesAgo(9),
  completedAt: null,
  report: null,
};

export const DEMO_INTERVIEW_MESSAGES: InterviewMessage[] = [
  {
    id: "m-1",
    sessionId: "session-1",
    role: "interviewer",
    content:
      "Your resume says you took an app offline-first. Walk me through how writes were handled while the device had no connection.",
    questionNumber: 1,
    createdAt: isoMinutesAgo(9),
  },
  {
    id: "m-2",
    sessionId: "session-1",
    role: "user",
    content:
      "We queued the writes locally and replayed them when the connection came back, with a last-write-wins rule on conflicts.",
    questionNumber: 1,
    createdAt: isoMinutesAgo(8),
  },
  {
    id: "m-3",
    sessionId: "session-1",
    role: "interviewer",
    content:
      "Last-write-wins discards data by design. Was there a case where that lost something a user cared about, and how did you find out?",
    questionNumber: 2,
    createdAt: isoMinutesAgo(8),
  },
];

export const DEMO_INTERVIEW_REPORT: InterviewReport = {
  questionsAnswered: 10,
  scores: [
    {
      label: "Technical knowledge",
      score: 8,
      outOf: 10,
      comment:
        "Strong on architecture. You named Fabric and TurboModules without prompting and explained why the bridge was removed.",
    },
    {
      label: "Communication",
      score: 8,
      outOf: 10,
      comment:
        "Clear and well paced. A few answers opened with detail before the conclusion — lead with the answer, then justify it.",
    },
    {
      label: "Topic coverage",
      score: 7,
      outOf: 10,
      comment:
        "Two areas from the job description never came up in your answers, so they remain untested.",
    },
  ],
  summary:
    "You would pass a first technical round on architecture alone. The weakness is depth on synchronisation: your answers described what you built but not the trade-offs you chose between.",
  strengths: [
    "Explaining the New Architecture without jargon",
    "Concrete examples drawn from real work",
  ],
  areasToRevise: [
    {
      topic: "React Native architecture",
      why: "You can describe it. Practise defending why it improves startup specifically.",
    },
    {
      topic: "Performance optimization",
      why: "Your answers named tools but not numbers. Be ready with a before and after.",
    },
    {
      topic: "Offline synchronisation",
      why: "Last-write-wins needs a justification, and an account of what it costs.",
    },
  ],
};

export const DEMO_REVISION: FinalRevision = {
  headline: "Five things to walk in remembering",
  mustRemember: [
    {
      text: "The bridge is gone. The JSI lets JavaScript hold direct references to native objects, so calls can be synchronous.",
      source: rnSource(
        12,
        "The New Architecture replaces the asynchronous bridge with the JavaScript Interface (JSI).",
      ),
    },
    {
      text: "Fabric is the renderer and builds an immutable shadow tree off the main thread, so layout stops blocking interaction.",
      source: rnSource(
        8,
        "Fabric constructs an immutable shadow tree which can be created off the main thread.",
      ),
    },
    {
      text: "TurboModules initialise lazily, which is where most of the startup improvement comes from.",
      source: rnSource(14, "TurboModules are initialised on first use rather than at startup."),
    },
    {
      text: "Find the thread dropping frames before optimising anything.",
      source: rnSource(17, "Establish which thread is dropping frames before changing code."),
    },
    {
      text: "Last-write-wins is a decision with a cost. Name the cost before they ask.",
      source: null,
    },
  ],
  concepts: [
    {
      title: "JSI",
      body: "A C++ interface that exposes native objects to JavaScript as host objects. No serialisation, no queue.",
    },
    {
      title: "Fabric",
      body: "The renderer built on the JSI. Immutable shadow tree, thread-safe construction, synchronous measurement when needed.",
    },
    {
      title: "TurboModules",
      body: "Native modules resolved on demand through the JSI instead of being registered eagerly at startup.",
    },
  ],
  commonQuestions: [
    {
      question: "Why was the bridge a bottleneck?",
      answer:
        "Every call was serialised to JSON and queued, so nothing could be synchronous and each frame paid a serialisation cost.",
    },
    {
      question: "What actually makes startup faster?",
      answer:
        "Lazy TurboModules. Nothing is initialised until it is used, so a large app stops paying for modules it never touches.",
    },
  ],
  weakAreas: ["State management", "Offline-first"],
};

export const DEMO_PROGRESS: ProgressSnapshot = {
  preparationsCompleted: 4,
  questionsAnswered: 68,
  averageScore: 76,
  studyMinutes: 412,
  weakTopics: DEMO_TOPIC_PERFORMANCE.filter((topic) => topic.score < 70),
  recentScores: [
    { label: "Mon", score: 58 },
    { label: "Tue", score: 64 },
    { label: "Wed", score: 61 },
    { label: "Thu", score: 72 },
    { label: "Fri", score: 79 },
    { label: "Sat", score: 76 },
    { label: "Sun", score: 84 },
  ],
};

/**
 * A small corpus standing in for embedded chunks in demo mode, so retrieval,
 * source citations and the debug inspector can all be seen working before a
 * database exists. Scored by word overlap rather than vectors — see
 * `lib/ai/rag.ts`.
 */
export const DEMO_CORPUS: {
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  content: string;
}[] = [
  {
    chunkId: "chunk-rn-12",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 12,
    content:
      "The New Architecture replaces the asynchronous bridge with the JavaScript Interface, known as the JSI. The old bridge serialised every call to JSON and shipped it across a queue, so no call could ever be synchronous and every frame paid a serialisation cost. With the JSI, JavaScript holds a direct handle on a native object and calls it in process.",
  },
  {
    chunkId: "chunk-rn-8",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 8,
    content:
      "Fabric is the renderer built on top of the JSI. It constructs an immutable shadow tree which can be created off the main thread, so layout work no longer competes with user interaction. Because the tree is immutable, measurement can be performed synchronously when a layout genuinely needs it.",
  },
  {
    chunkId: "chunk-rn-14",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 14,
    content:
      "TurboModules are initialised on first use rather than at startup. Native modules are resolved on demand through the JSI instead of being registered eagerly, which is where most of the startup improvement in large applications comes from.",
  },
  {
    chunkId: "chunk-rn-17",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 17,
    content:
      "Use the performance monitor to establish which thread is dropping frames before changing any code. A JavaScript thread stall points at render work or an expensive synchronous computation. A UI thread stall points at layout, shadow rendering or image decoding. Optimising the wrong thread is the most common wasted effort.",
  },
  {
    chunkId: "chunk-rn-19",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 19,
    content:
      "Long lists deserve particular attention. Make sure the list is virtualised so off-screen rows are not mounted, that row components are memoised, and that keys are stable across renders. Unstable keys force the renderer to discard and rebuild rows on every update.",
  },
  {
    chunkId: "chunk-rn-22",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 22,
    content:
      "An offline-first application treats the network as an optimisation rather than a requirement. Writes are recorded locally first and replayed when connectivity returns. The hard part is conflict resolution: last-write-wins is simple and discards data by design, so that trade-off has to be a decision rather than an accident. Show the user what is still pending.",
  },
  {
    chunkId: "chunk-rn-24",
    documentId: "doc-rn-notes",
    filename: "React Native Notes.pdf",
    pageNumber: 24,
    content:
      "Local component state is the default for state management. Context suits values that change rarely, such as the current theme or the signed-in user, and is a poor fit for values that change on every keystroke because every consumer re-renders. A store earns its place when you need selectors, middleware or persistence.",
  },
  {
    chunkId: "chunk-resume-1",
    documentId: "doc-resume",
    filename: "Resume.pdf",
    pageNumber: 1,
    content:
      "Senior React Native engineer. Led the rebuild of a logistics application used by field couriers, taking it offline-first with a local write queue and background synchronisation. Reduced cold start from 4.1s to 1.8s by migrating to the New Architecture and auditing module initialisation.",
  },
  {
    chunkId: "chunk-jd-1",
    documentId: "doc-jd",
    filename: "Job Description.pdf",
    pageNumber: 1,
    content:
      "You will own the mobile client end to end. We are looking for depth in React Native architecture, demonstrable performance work on large lists, and experience keeping an application usable on poor connections. Familiarity with the New Architecture is strongly preferred.",
  },
];
