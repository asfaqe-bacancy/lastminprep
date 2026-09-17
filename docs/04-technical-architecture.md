# PrepSprint Technical Architecture

## Technology Stack

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- pgvector
- Gemini API
- Recharts
- Lucide

## High-Level Architecture

```text
Browser
  ↓
Next.js UI
  ↓
Server Actions / API Routes
  ├── Supabase
  └── Gemini
        ├── Generation
        └── Embeddings
```

## RAG Architecture

```text
PDF
 ↓
Text Extraction
 ↓
Cleaning
 ↓
Chunking
 ↓
Embedding
 ↓
Supabase + pgvector
```

Question flow:

```text
Question
 ↓
Question Embedding
 ↓
pgvector Similarity Search
 ↓
Top Relevant Chunks
 ↓
Prompt + Context
 ↓
Gemini
 ↓
Grounded Answer
```

## Suggested Folder Structure

```text
app/
  dashboard/
  preparations/
  documents/
  progress/
  settings/
  api/

components/
  ui/
  layout/
  preparation/
  quiz/
  interview/
  documents/
  progress/
  sources/

lib/
  ai/
    gemini.ts
    prompts.ts
    embeddings.ts
    rag.ts
    quiz.ts
    interview.ts
    preparation-plan.ts
  documents/
    parser.ts
    chunker.ts
  supabase/
    client.ts
    server.ts

types/
```

## Client vs Server

Client:
- UI
- Forms
- Interaction
- Local UI state

Server:
- Gemini API
- Embeddings
- Vector search
- Sensitive Supabase operations
- Document processing where appropriate

Never expose secret keys to the client.

## Environment Variables

```env
GEMINI_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Keep secret keys server-side.

## Document Processing

Initial support:
- PDF

Pipeline:

```text
Upload
 ↓
Supabase Storage
 ↓
Create document record
 ↓
Extract text
 ↓
Split into chunks
 ↓
Generate embeddings
 ↓
Insert chunks
 ↓
Mark document ready
```

## Retrieval

Start with top-k = 3.

Store:
- Content
- Page number
- Document ID
- Metadata
- Embedding

Keep retrieval code isolated so it can evolve.

## AI Modules

### Gemini

Responsible for model calls.

### Embeddings

Converts document chunks and user questions into vectors.

### RAG

Retrieves relevant context and builds grounded prompts.

### Preparation Plan

Generates a time-aware study plan.

### Quiz

Generates and evaluates questions.

### Interview

Manages interview questions, follow-ups and final report.

## Security

Use Supabase Row Level Security.

Users must only access:
- Their preparations
- Their documents
- Their chunks
- Their quiz data
- Their interview data
- Their progress

Validate input server-side.

Do not trust client-provided user IDs.

## Error Handling

Handle:
- Invalid PDF
- Empty PDF
- Extraction failure
- Embedding failure
- Gemini failure
- Vector search failure
- Database failure
- Upload failure
- Timeout/rate limit

Show user-friendly messages.

## Development Principle

Keep the implementation beginner-friendly.

Build incrementally:

```text
UI
 ↓
Gemini
 ↓
PDF
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector Search
 ↓
RAG
 ↓
Preparation
 ↓
Quiz
 ↓
Interview
 ↓
Crash Prep
```

Do not implement agents or complex multi-agent architecture initially.
