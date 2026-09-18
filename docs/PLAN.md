# PrepSprint — Implementation Plan

Derived from `docs/prd.md`, `docs/02-design-system.md`, `docs/03-user-flows.md`,
`docs/04-technical-architecture.md`, `docs/05-database-schema.md`,
`docs/06-rag-architecture.md`, `docs/design.md`.

Build mode agreed with the user: **build all 12 phases straight through**, keys added later.

---

## 0. Locked technical decisions

| Area | Decision | Why |
| --- | --- | --- |
| Framework | Next.js 15, App Router, TypeScript, no `src/` dir | Matches folder structure in `04-technical-architecture.md` |
| Styling | Tailwind CSS v4 + CSS-variable design tokens | Tokens required by design-system §28 |
| Components | shadcn/ui (restyled, not default look) | PRD §2; design.md forbids generic SaaS look |
| Gemini SDK | `@google/genai` | Current official SDK (`@google/generative-ai` is deprecated) |
| Generation model | `gemini-2.5-flash` | Fast enough for a time-pressured product; cheap |
| Embedding model | `gemini-embedding-001` @ **768 dimensions** | Under pgvector's 2000-dim index limit; cheap; good quality |
| Structured AI output | `responseMimeType: application/json` + `responseSchema` | Plans/quizzes/evaluations/reports must parse reliably |
| PDF text | `unpdf` | Serverless-safe, no native deps, returns **per-page** text → real page citations |
| DB | Supabase Postgres + pgvector, SQL migrations in `supabase/migrations/` | PRD §20 |
| Vector search | `match_document_chunks()` Postgres RPC | Keeps retrieval in one place (RAG doc §6) |
| Files | Private Supabase Storage bucket `documents`, signed URLs | Schema doc "Storage" |
| Auth | Supabase Auth (email/password + Google), `@supabase/ssr` + middleware | PRD §21 |
| Charts | Recharts | PRD §2 |
| Icons | Lucide, thin/simple only — no sparkles, robots, brains | design.md §18 |
| Accent colour | One restrained **warm coral-orange**; everything else neutral | design.md §4 rules out AI purple |
| Retrieval | `top_k = 3`, isolated in `lib/ai/rag.ts` | PRD §9 |
| No-keys behaviour | `lib/demo/fixtures.ts` seeds every screen when env is unset | Lets the whole UI be verified before credentials exist |

### Explicitly NOT built (PRD §26)
Agents, multi-agent systems, voice, OCR, long-term memory, recommender systems,
multiple AI providers, mobile app, advanced analytics.

---

## 1. Target file structure

```text
app/
  layout.tsx  globals.css  page.tsx            # landing page
  (auth)/login  (auth)/signup  auth/callback
  (app)/layout.tsx                             # sidebar + mobile bottom nav
    dashboard/
    preparations/            page.tsx
    preparations/new/        page.tsx          # 4-step guided setup
    preparations/[id]/       page.tsx          # overview + plan + timeline
    preparations/[id]/learn/
    preparations/[id]/quiz/
    preparations/[id]/interview/
    preparations/[id]/weak-areas/
    preparations/[id]/revision/
    documents/  progress/  settings/  setup/
  api/
    chat/                          # grounded RAG chat (streaming)
    documents/upload/              # → Storage + document row
    documents/[id]/process/        # extract → chunk → embed → index
    documents/[id]/status/
    preparations/[id]/plan/        # AI preparation plan + crash prep
    quiz/generate/  quiz/evaluate/
    interview/start/  interview/answer/  interview/report/
    revision/
    debug/retrieval/               # dev-only retrieval inspector

components/
  ui/          # shadcn primitives
  layout/      Sidebar  MobileNav  AppShell  ThemeToggle
  preparation/ PreparationCard  TimeSelector  TypeSelector  GoalSelector
               PreparationTimeline  TopicList  Timer  CrashPrepBoard
  quiz/        QuestionCard  AnswerInput  FeedbackPanel  ScoreCard
  interview/   InterviewStage  TranscriptView  InterviewReport
  documents/   DocumentUpload  ProcessingStatus  DocumentList
  progress/    ProgressRing  StatTile  TopicBars  WeakAreaList  ProgressCharts
  sources/     SourceReference  SourceSheet

lib/
  ai/    gemini.ts  prompts.ts  embeddings.ts  rag.ts  quiz.ts
         interview.ts  preparation-plan.ts  crash-prep.ts  revision.ts
  documents/  parser.ts  chunker.ts  pipeline.ts
  supabase/   client.ts  server.ts  admin.ts  middleware.ts
  data/       preparations.ts  documents.ts  quiz.ts  interview.ts  progress.ts
  demo/       fixtures.ts
  env.ts  utils.ts
types/  index.ts
supabase/migrations/  0001_init.sql … 0005_vector_search.sql
```

---

## 2. Database migrations (dependency order, per `05-database-schema.md`)

1. `0001_extensions.sql` — `vector`, `pgcrypto`
2. `0002_tables.sql` — profiles, preparations, documents, document_chunks,
   preparation_topics, quiz_questions, quiz_answers, interview_sessions,
   interview_messages, user_progress (UUID PKs, `timestamptz`, enum CHECKs,
   `embedding vector(768)`)
3. `0003_indexes.sql` — every index listed in the schema doc
4. `0004_rls.sql` — RLS on all user-owned tables; `auth.uid() = user_id`;
   child rows authorised through their parent preparation/document/session
5. `0005_storage.sql` — private `documents` bucket + per-user path policies
6. `0006_vector_search.sql` — `match_document_chunks(query_embedding, prep_id, match_count)`
   returning content, page_number, document_id, filename, similarity
7. `0007_vector_index.sql` — ivfflat/hnsw index, added *after* retrieval is proven working
8. `0008_profile_trigger.sql` — auto-create `profiles` row on signup

---

## 3. Phases

Each phase ends with: `npm run build` + typecheck clean, dev server exercised,
errors fixed. Phases 2–11 that need live keys get their logic verified by
type-checked, isolated modules plus fixture-driven UI; anything only provable
with a real key is listed at the end as "needs your keys".

### Phase 1 — UI foundation (no AI)
Scaffold; design tokens (radius 10/16/22/28/32, neutral + one accent, light/dark);
Inter + SF Pro fallback; AppShell with minimal desktop sidebar and mobile bottom nav;
landing page ("You don't need more time. You need a better way to use it.");
dashboard (greeting, time-to-go, primary preparation card, recent list, stat tiles);
4-step Create Preparation flow; preparation overview; documents/progress/settings shells;
skeleton, empty and error states throughout. Verify: every route renders on
desktop + mobile widths, both themes, no horizontal overflow.

### Phase 2 — Gemini
`lib/ai/gemini.ts` (server-only client, model constants, retry + typed errors),
`lib/ai/prompts.ts`, a streaming `/api/chat` route, Prep Coach panel with
conversation history, loading and error handling.
Milestone: question → Gemini → response.

### Phase 3 — Document upload
Supabase clients + middleware + auth pages; private Storage upload;
`documents` row; `lib/documents/parser.ts` per-page extraction with `unpdf`;
text cleaning; processing-status UI with the contextual copy from design.md §20.
Milestone: PDF → extracted text.

### Phase 4 — Chunking
`lib/documents/chunker.ts` — recursive splitter, ~800 tokens with ~120 overlap,
page attribution preserved; dev chunk inspector.
Milestone: text → inspectable chunks.

### Phase 5 — Embeddings
`lib/ai/embeddings.ts` — batched `gemini-embedding-001` @768 dims, retry,
task-type distinction for document vs query; `lib/documents/pipeline.ts`
orchestrates extract→chunk→embed→insert with status transitions and failure recovery.

### Phase 6 — Vector search
`match_document_chunks` RPC wired through `lib/ai/rag.ts`; `top_k = 3`;
dev-only `/api/debug/retrieval` + inspector page showing chunks and similarity scores.

### Phase 7 — RAG
Grounded system prompt (answer only from context; say plainly when material
lacks the answer; never invent sources); context builder with `SOURCE n` blocks;
`SourceReference` + `SourceSheet` showing the retrieved passage;
"not found in your material" path. Milestone: answers grounded in an uploaded PDF.

### Phase 8 — Preparation plan
`lib/ai/preparation-plan.ts` — time-aware, goal-aware, prioritised plan from
retrieved material (structured JSON → `preparation_topics`);
overview screen with numbered focus list and the minute-by-minute timeline;
session runner + calm `Timer`.

### Phase 9 — Quiz ("Quick Check")
Topic-grounded question generation; answer evaluation
(Correct / Partially correct / Incorrect + what to add + source);
persistence to `quiz_questions` / `quiz_answers` / `user_progress`;
weak-area detection grouped by topic, editorial layout, targeted practice.

### Phase 10 — Interview
`lib/ai/interview.ts`; resume + JD aware interviewer; immersive stage;
conversational follow-ups from answer analysis; evaluation withheld until the end;
final report (technical knowledge / communication / coverage + areas to revise
with explanations).

### Phase 11 — Crash prep (the differentiator)
`lib/ai/crash-prep.ts` — available time + material + goal + RAG + performance →
Must know / Important / Optional tiers with star weighting, then a guided run
through the highest-priority material.

### Phase 12 — Polish
Streaming everywhere it helps; iOS-like motion (150–300ms ease-out, 0.97–0.98
press scale); final revision screen built to be screenshotted; Recharts progress
views; source previews; accessibility pass (contrast, focus rings, keyboard,
labels, touch targets); responsive refinement; full empty/loading/error coverage.

---

## 4. Verification

- `npm run build` and `tsc --noEmit` clean after every phase.
- Every screen checked at 390px, 834px and 1440px, in light and dark.
- Fixture mode renders all screens with no credentials configured.
- `docs/EVAL.md` test set (RAG doc §19): direct, paraphrased, out-of-document,
  multi-chunk and follow-up questions — to run once keys are in place.

## 5. Needs your keys (documented at handover)
`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` — plus applying `supabase/migrations/*` and creating
the `documents` bucket. `.env.example` and `README.md` will spell out each step.

---

## 6. Build status

All twelve phases are built. Deviations from the plan above, and what was
verified how:

### Changed during the build

| Plan said | Actually done | Why |
| --- | --- | --- |
| shadcn/ui on Radix | shadcn `base-nova` on `@base-ui/react` | That is what `shadcn@latest` installs now. Bespoke components were built on top rather than fighting its defaults. |
| `middleware.ts` | `proxy.ts` | Renamed in Next.js 16; the edge runtime is gone from it, which suits Supabase SSR. |
| Plan/revision in separate tables | `preparations.plan`, `.revision`, `.crash_board` as jsonb | They are generated whole and read whole; storing them means they reopen without being regenerated. |
| `documents.status = processing` | Granular `extracting`/`chunking`/`embedding`/`indexing` | The upload screen needs to show which step is running, and this avoids a second column. |
| — | `document_chunks.preparation_id` and `.user_id` added | RLS then needs no joins, and vector search can be scoped to one preparation cheaply. |
| — | `lib/demo/*` preview mode | Added so the whole UI could be verified before credentials existed. Doubles as a live-demo fallback. |

### Verified without credentials

- `npm run build` and `tsc --noEmit` clean; `eslint` clean.
- All 34 routes resolve; every screen renders at 390 / 834 / 1440 px in both themes.
- **PDF extraction and chunking against real PDFs**, through
  `/api/debug/document`: 4-page document → 4 page-attributed chunks; forcing
  `targetChars=900` produced correct recursive splits at sentence boundaries
  with the overlap carrying the previous chunk's closing sentence.
- **Retrieval**, through `/api/debug/retrieval`, against the fixture corpus.
- **The full create flow**: create preparation → upload PDF → processing
  stages advance → `ready` with page and chunk counts.
- **Input validation**: bad type and out-of-range time rejected with the
  messages the UI shows.
- **Degradation without a key**: AI routes return an actionable 503; the coach
  still retrieves and displays sources, and says why there is no answer
  instead of inventing one.

### Needs credentials to verify

Everything that calls Gemini for real, and the Supabase read/write paths:
plan generation, learn, quiz generation and marking, the interview and its
report, crash triage, the final review, real embeddings and pgvector search,
auth, and Storage uploads. `docs/EVAL.md` is the test set to run first.
