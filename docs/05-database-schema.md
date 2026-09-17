# PrepSprint Database Schema

Use Supabase PostgreSQL with pgvector.

## Tables

```text
profiles
preparations
documents
document_chunks
preparation_topics
quiz_questions
quiz_answers
interview_sessions
interview_messages
user_progress
```

## profiles

```text
id uuid primary key
email text
name text
avatar_url text nullable
created_at timestamptz
updated_at timestamptz
```

## preparations

```text
id uuid primary key
user_id uuid
type text              -- exam | interview
goal text
available_minutes int
status text             -- draft | processing | ready | active | completed
title text
created_at timestamptz
completed_at timestamptz nullable
```

## documents

```text
id uuid primary key
preparation_id uuid
user_id uuid
filename text
file_url text
file_type text
status text             -- uploading | processing | ready | failed
page_count int nullable
created_at timestamptz
```

## document_chunks

```text
id uuid primary key
document_id uuid
content text
page_number int nullable
embedding vector
metadata jsonb
created_at timestamptz
```

Use a pgvector dimension matching the selected Gemini embedding model.

## preparation_topics

```text
id uuid primary key
preparation_id uuid
name text
priority text
estimated_minutes int nullable
created_at timestamptz
```

## quiz_questions

```text
id uuid primary key
preparation_id uuid
topic_id uuid nullable
question text
difficulty text
expected_answer text nullable
source_chunk_ids jsonb
created_at timestamptz
```

## quiz_answers

```text
id uuid primary key
question_id uuid
user_id uuid
user_answer text
evaluation text
score numeric nullable
is_correct boolean nullable
created_at timestamptz
```

## interview_sessions

```text
id uuid primary key
preparation_id uuid
user_id uuid
status text
started_at timestamptz
completed_at timestamptz nullable
summary jsonb nullable
```

## interview_messages

```text
id uuid primary key
session_id uuid
role text              -- interviewer | user
content text
question_number int nullable
metadata jsonb
created_at timestamptz
```

## user_progress

```text
id uuid primary key
user_id uuid
preparation_id uuid
topic_id uuid nullable
questions_answered int
questions_correct int
score numeric nullable
time_spent_seconds int
updated_at timestamptz
```

## Relationships

```text
profiles
  ↓
preparations
  ├── documents
  │     └── document_chunks
  ├── preparation_topics
  │     └── quiz_questions
  │            └── quiz_answers
  └── interview_sessions
         └── interview_messages
```

## Storage

Create a private Supabase Storage bucket:

```text
documents
```

Store uploaded PDFs there.

Use authenticated access and signed URLs where required.

## Indexes

Add indexes for:

- preparations.user_id
- documents.user_id
- documents.preparation_id
- document_chunks.document_id
- quiz_questions.preparation_id
- quiz_answers.question_id
- interview_sessions.preparation_id
- interview_messages.session_id
- user_progress.preparation_id

Add an appropriate pgvector index after the retrieval flow is working.

## RLS

Enable Row Level Security on user-owned tables.

General rule:

```text
auth.uid() = user_id
```

For child records, enforce ownership through the related preparation/document/session.

## Database Rules

- Never store money-like values as floating point where exact precision matters.
- Use UUIDs.
- Use timestamps with timezone.
- Validate enums at the application/database layer.
- Do not allow users to access another user's documents or preparation data.

## Migration Strategy

Create tables in dependency order:

1. profiles
2. preparations
3. documents
4. document_chunks
5. preparation_topics
6. quiz_questions
7. quiz_answers
8. interview_sessions
9. interview_messages
10. user_progress

Then add:
- RLS
- indexes
- storage policies
- vector search function
