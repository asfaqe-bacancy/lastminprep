# PrepSprint

Last-minute exam and interview preparation. You give it your material and the
amount of time you have; it works out what to focus on, teaches it, questions
you on it, finds the gaps and writes you one page to read before you walk in.

Every answer is grounded in the documents you uploaded, and every answer shows
the page it came from.

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres +
pgvector) · Gemini

---

## Quick start

```bash
npm install
cp .env.example .env.local        # fill in four values — see Credentials
# paste supabase/apply-all.sql into the Supabase SQL Editor and run it
npm run check:setup               # confirms all of the above actually works
npm run dev
```

Open http://localhost:3000.

**It runs before you have any credentials.** With no Supabase project
configured the app serves preview data so every screen can be looked at, and
says plainly where a key is missing rather than failing. Nothing is saved in
that mode.

`npm run check:setup` is the thing to reach for whenever something is off. It
tells you whether the problem is your setup or the code:

```
Gemini
  ok    gemini-3.6-flash answers, and returns valid JSON
  ok    gemini-embedding-001 returns 768 dimensions
Database
  ok    all 10 tables present
  ok    match_document_chunks() exists
Storage
  ok    private 'documents' bucket exists
```

---

## Credentials

Both `.env.local` and `.env` are loaded. Use `.env.local` — it takes
precedence, and both are git-ignored. **Restart the dev server after editing
either**; nothing picks up a changed key at runtime.

### 1. Gemini

Get a key from [Google AI Studio](https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=...
```

This writes the plan, teaches topics, asks and marks questions, runs the
interview and writes the final review. Server-side only.

### 2. Supabase

Create a project, then from **Project settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then apply the schema. Open the Supabase **SQL Editor**, paste
**`supabase/apply-all.sql`**, run it once. That is every migration except
`0007`, concatenated in the right order.

Every statement is idempotent, so if it fails halfway you can fix the cause and
run the whole thing again.

PostgREST caches the schema, so wait a few seconds before the app can see the
new tables, then run `npm run check:setup`.

The individual files, if you would rather run them one at a time:

| File | What it does |
| --- | --- |
| `0001_extensions.sql` | Enables `pgvector` and `pgcrypto` |
| `0002_tables.sql` | All ten tables |
| `0003_indexes.sql` | Foreign-key and lookup indexes |
| `0004_rls.sql` | Row Level Security on every user-owned table |
| `0005_storage.sql` | The private `documents` bucket and its policies |
| `0006_vector_search.sql` | The `match_document_chunks()` search function |
| `0007_vector_index.sql` | The HNSW vector index — **run this last**, once retrieval is working |
| `0008_profiles_trigger.sql` | Profile row per user, and a backfill for existing ones |

With the Supabase CLI instead: `supabase db push`.

`0007` is held back deliberately. Until there are a few thousand chunks a
sequential scan is quick and exact, and adding an approximate index before
retrieval is proven makes a retrieval bug much harder to diagnose.

### 3. Google sign-in (optional)

In Supabase, **Authentication → Providers → Google**, and add
`http://localhost:3000/auth/callback` as a redirect URL. Email and password
work without it.

---

## Deploying

Vercel, with two things that catch people out.

**1. Set the environment variables in Vercel, not just locally.** Project
Settings → Environment Variables, all four, then redeploy. `NEXT_PUBLIC_*`
values are inlined into the bundle at **build** time, so they must be present
*before* the build or the deployment ships in preview-data mode.

**2. Point Supabase at your deployed URL.** Authentication → URL Configuration
still says `localhost:3000` by default, so email confirmation links and Google
OAuth from the deployed app will bounce users to localhost. Set the Site URL to
your domain and allow `https://<your-domain>/auth/callback`.

The debug inspectors under `/api/debug/` return 404 when
`NODE_ENV === "production"`, so they do not need removing before a deploy.

---

## How it works

### The pipeline

```
Upload PDF
  → store in Supabase Storage
  → extract text, one entry per page
  → clean it (join hard-wrapped lines, repair hyphenated breaks)
  → split into overlapping chunks
  → embed each chunk with Gemini
  → store chunks + vectors in Postgres
```

Page numbers survive the whole way through, which is what lets a citation say
"React Native Notes.pdf, page 12" and mean it.

### Answering a question

```
Question
  → embed the question
  → pgvector cosine search, scoped to this preparation
  → top 3 chunks
  → build a context block
  → Gemini, with a prompt that forbids going outside that context
  → answer + the page each claim came from
```

If retrieval finds nothing above the similarity floor, the app says the
material doesn't cover it. It does not quietly answer from the model's own
knowledge — that is the whole point of grounding it in your documents.

### Where things live

```
app/
  (app)/                    signed-in screens
    dashboard/              what to do next
    preparations/[id]/      overview, learn, quiz, interview,
                            weak-areas, revision, crash
  (auth)/                   sign in and sign up
  api/                      everything the client calls
  api/debug/                retrieval and chunking inspectors (dev only)

lib/
  ai/         gemini, prompts, schemas, embeddings, rag,
              preparation-plan, learn, quiz, interview,
              revision, crash-prep
  documents/  parser, chunker, pipeline
  supabase/   browser, server, service-role and proxy clients
  data/       every database read and write, mapped to domain types
  demo/       fixtures and the in-memory store behind preview mode

supabase/migrations/   the schema, in order
supabase/apply-all.sql  the same thing, ready to paste
scripts/check-setup.mjs the setup checker
proxy.ts                session refresh + signed-out redirects
```

`lib/ai/prompts.ts` holds every prompt in the product. `lib/ai/rag.ts` holds
all retrieval. Both are meant to be read.

Note `proxy.ts`: Next.js 16 renamed `middleware.ts` to `proxy.ts` and dropped
the edge runtime from it, which suits Supabase SSR.

---

## Development tools

Two inspectors, both 404 in production.

**Chunking** — see exactly how a PDF was split, and try other sizes:

```bash
curl -X POST -F "file=@notes.pdf" \
  "http://localhost:3000/api/debug/document?targetChars=900&overlapChars=150" | jq
```

**Retrieval** — see what a question matched and how closely:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"preparationId":"<id>","query":"why was the bridge a bottleneck?"}' \
  http://localhost:3000/api/debug/retrieval | jq
```

This is the fastest way to tell whether a poor answer is a retrieval problem or
a prompting one.

---

## Tuning

| Setting | Where | Default |
| --- | --- | --- |
| Chunk size / overlap | `lib/constants.ts` | 3200 / 480 characters |
| Retrieval depth | `lib/constants.ts` | `top_k = 3` |
| Similarity floor | `lib/constants.ts` | 0.35 |
| Quiz / interview length | `lib/constants.ts` | 10 / 8 questions |
| Models | `lib/ai/gemini.ts` | `gemini-3.6-flash`, `gemini-embedding-001` |
| Embedding dimensions | `lib/ai/gemini.ts` | 768 |

**Changing the embedding dimensions means changing the database too.** The
`vector(768)` column in `0002_tables.sql` and the argument type in
`0006_vector_search.sql` must match `EMBEDDING_DIMENSIONS`, and existing rows
have to be re-embedded.

On the generation model: `gemini-3.6-flash` was chosen on measured behaviour
rather than version number. `gemini-2.5-flash` is rejected outright for
accounts created after its retirement, and the newer `gemini-3.8-flash`
returned 503 "high demand" on two of three structured calls while 3.6
completed three of three at roughly 1.7s each. For a product built around not
wasting the user's minutes, answering reliably beats being newest. Re-check
with `npm run check:setup` if you change it.

See `docs/EVAL.md` for the retrieval test set — particularly the case where you
ask about something the document does not cover, which is what proves grounding
actually holds.

---

## Security

- Row Level Security on every user-owned table; the general rule is
  `auth.uid() = user_id`, and child rows are authorised through their parent.
- Uploads go to a private bucket under `<user_id>/<preparation_id>/`, and the
  storage policy checks that first path segment.
- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only. The
  service-role client is marked `server-only`, so importing it into a client
  component fails the build.
- Ownership is always resolved from the session, never from a user id in a
  request body.
- The service-role key bypasses RLS entirely. Treat it like a database
  password: never in a `NEXT_PUBLIC_*` variable, never pasted into a chat or an
  issue. Rotate it in Project Settings → API if it leaks.

---

## Troubleshooting

**Every screen says "Preview data. No database is connected."**
`NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, or
the dev server has not been restarted since you added them.

**"Something went wrong on our side" when creating a preparation or uploading.**
Almost always the schema. Run `npm run check:setup`. The server log has the
real message — the browser gets a generic one on purpose so internal detail
does not leak.

**`PGRST205 — Could not find the table 'public.x' in the schema cache`.**
Either the migrations were never applied, or PostgREST has not reloaded its
cache yet. Run `supabase/apply-all.sql`, wait a few seconds, check again.

Careful when diagnosing this by hand: a PostgREST `HEAD` request returns no
response body, so supabase-js reports a missing table as `error: null`. Probe
with a real `GET`, which is what `check:setup` does.

**"Bucket not found" on upload.** Migration `0005` has not been applied.

**Retrieval returns nothing, or the coach always says the material does not
cover it.** Check the documents finished processing — a document row carries
`status` and `error_message`. If they are `ready` with a non-zero
`chunk_count`, use the retrieval inspector and consider lowering
`RETRIEVAL_MIN_SIMILARITY`.

**A document is stuck at `failed`.** Read its `error_message`. A scanned PDF
with no selectable text cannot be read; there is no OCR. If it says a key is
missing, add the key and re-upload.

**503 "high demand" from Gemini.** Transient capacity. The client already
retries three times with backoff; if it persists, pick another flash model in
`lib/ai/gemini.ts`.

**`/login` 404s on a deployment.** Something did not make it into the build.
Check that the route exists in the deployed commit, not just locally.

**Progress looks empty after real work.** The average, the score chart and the
weak-areas list need marked answers. Run a Quick check; the rest of the page
shows regardless.

---

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build + typecheck
npm run start        # serve the build
npm run lint         # eslint
npm run check:setup  # verify keys, schema, search function and bucket
```

---

## Documentation

| File | What it covers |
| --- | --- |
| `docs/prd.md` | The product brief this was built from |
| `docs/PLAN.md` | Implementation plan, decisions, and what was verified how |
| `docs/design.md`, `docs/02-design-system.md` | Visual direction and design tokens |
| `docs/03-user-flows.md` | Screen-by-screen flows |
| `docs/04-technical-architecture.md` | Architecture and folder layout |
| `docs/05-database-schema.md` | Schema intent, and where the code deviates |
| `docs/06-rag-architecture.md` | The RAG design in detail |
| `docs/EVAL.md` | Retrieval and grounding test set |
