# PrepSprint

Last-minute exam and interview preparation. You give it your material and the
amount of time you have; it works out what to focus on, teaches it, questions
you on it, finds the gaps and writes you one page to read before you walk in.

Every answer is grounded in the documents you uploaded, and every answer shows
the page it came from.

---

## Running it

```bash
npm install
cp .env.example .env.local   # fill this in — see "Credentials" below
npm run dev
```

Open http://localhost:3000.

**It runs before you have any credentials.** With no Supabase project
configured the app serves preview data so every screen can be looked at, and
says plainly where a key is missing rather than failing. Nothing is saved in
that mode.

---

## Credentials

### 1. Gemini

Get a key from [Google AI Studio](https://aistudio.google.com/apikey) and set:

```
GEMINI_API_KEY=...
```

This is what writes the plan, teaches topics, asks and marks questions, runs
the interview and writes the final review. It is read server-side only.

### 2. Supabase

Create a project, then from **Project settings → API** set:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then apply the database schema. In the Supabase dashboard open **SQL Editor**
and run the files in `supabase/migrations/` **in numeric order**:

| File | What it does |
| --- | --- |
| `0001_extensions.sql` | Enables `pgvector` and `pgcrypto` |
| `0002_tables.sql` | All ten tables |
| `0003_indexes.sql` | Foreign-key and lookup indexes |
| `0004_rls.sql` | Row Level Security on every user-owned table |
| `0005_storage.sql` | The private `documents` bucket and its policies |
| `0006_vector_search.sql` | The `match_document_chunks()` search function |
| `0007_vector_index.sql` | The HNSW vector index — **run this last**, once retrieval works |
| `0008_profiles_trigger.sql` | Creates a profile row for each new user |

With the Supabase CLI instead: `supabase db push`.

Every file is safe to re-run, so if one fails halfway you can fix the cause
and run it again from the top.

Restart the dev server after editing `.env.local`. Visit `/settings` to
confirm both connections report **Connected**.

### 3. Google sign-in (optional)

In Supabase, **Authentication → Providers → Google**, and add
`http://localhost:3000/auth/callback` as a redirect URL. Email and password
work without this.

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
  ai/       gemini, prompts, schemas, embeddings, rag,
            preparation-plan, learn, quiz, interview,
            revision, crash-prep
  documents/  parser, chunker, pipeline
  supabase/   browser, server, service-role and proxy clients
  data/       every database read and write, mapped to domain types
  demo/       fixtures and the in-memory store behind preview mode

supabase/migrations/   the schema, in order
proxy.ts               session refresh + signed-out redirects
```

`lib/ai/prompts.ts` holds every prompt in the product. `lib/ai/rag.ts` holds
all retrieval. Both are meant to be read.

---

## Development tools

Two inspectors, both 404 in production:

**Chunking** — see exactly how a PDF was split:

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

This is the fastest way to tell whether a poor answer is a retrieval problem
or a prompting one.

---

## Tuning

| Setting | Where | Default |
| --- | --- | --- |
| Chunk size / overlap | `lib/constants.ts` | 3200 / 480 characters |
| Retrieval depth | `lib/constants.ts` | `top_k = 3` |
| Similarity floor | `lib/constants.ts` | 0.35 |
| Models | `lib/ai/gemini.ts` | `gemini-3.6-flash`, `gemini-embedding-001` |
| Embedding dimensions | `lib/ai/gemini.ts` | 768 |

**Changing the embedding dimensions means changing the database too.** The
`vector(768)` column in `0002_tables.sql` and the argument type in
`0006_vector_search.sql` must match `EMBEDDING_DIMENSIONS`, and existing rows
have to be re-embedded.

See `docs/EVAL.md` for the retrieval test set to run once keys are in place.

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

---

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build + typecheck
npm run start    # serve the build
npm run lint     # eslint
```
