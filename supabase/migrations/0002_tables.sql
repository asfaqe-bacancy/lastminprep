-- PrepSprint · 0002 · tables
--
-- Created in dependency order: profiles, preparations, documents,
-- document_chunks, preparation_topics, quiz_questions, quiz_answers,
-- interview_sessions, interview_messages, user_progress.
--
-- Deviations from docs/05-database-schema.md, all additive:
--   * documents.status carries the granular pipeline stages (extracting,
--     chunking, embedding, indexing) instead of one opaque "processing", so
--     the upload screen can show which step is running without a second
--     column. documents also gains file_size, role, chunk_count and
--     error_message.
--   * document_chunks gains preparation_id and user_id. Both are denormalised
--     on purpose: RLS then needs no joins, and vector search can be scoped to
--     one preparation cheaply.
--   * preparations gains plan, revision and crash_board (all jsonb),
--     progress_percent and started_at. The generated revision page and crash
--     board are stored so they can be reopened without being regenerated.
--   * preparation_topics gains summary and position.
--   * quiz_answers gains verdict and missing alongside the documented
--     evaluation/score/is_correct columns.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New preparation',
  type text not null check (type in ('exam', 'interview')),
  goal text not null check (
    goal in (
      'quick_revision',
      'deep_preparation',
      'practice_questions',
      'mock_interview'
    )
  ),
  available_minutes integer not null check (
    available_minutes between 5 and 480
  ),
  status text not null default 'draft' check (
    status in ('draft', 'processing', 'ready', 'active', 'completed')
  ),
  plan jsonb,
  revision jsonb,
  crash_board jsonb,
  progress_percent integer not null default 0 check (
    progress_percent between 0 and 100
  ),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  preparation_id uuid not null references preparations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  file_url text,
  file_type text not null default 'application/pdf',
  file_size bigint,
  role text not null default 'material' check (
    role in ('material', 'resume', 'job_description')
  ),
  status text not null default 'uploading' check (
    status in (
      'uploading',
      'extracting',
      'chunking',
      'embedding',
      'indexing',
      'ready',
      'failed'
    )
  ),
  page_count integer,
  chunk_count integer,
  error_message text,
  created_at timestamptz not null default now()
);

-- The embedding dimension must match EMBEDDING_DIMENSIONS in lib/ai/gemini.ts.
-- 768 also keeps the column under pgvector's 2000-dimension index limit.
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  preparation_id uuid not null references preparations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  page_number integer,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists preparation_topics (
  id uuid primary key default gen_random_uuid(),
  preparation_id uuid not null references preparations (id) on delete cascade,
  name text not null,
  priority text not null default 'important' check (
    priority in ('must_know', 'important', 'optional')
  ),
  estimated_minutes integer,
  summary text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  preparation_id uuid not null references preparations (id) on delete cascade,
  topic_id uuid references preparation_topics (id) on delete set null,
  topic text not null default 'General',
  question text not null,
  difficulty text not null default 'medium' check (
    difficulty in ('easy', 'medium', 'hard')
  ),
  expected_answer text,
  source_chunk_ids jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_answer text not null default '',
  evaluation text,
  verdict text check (verdict in ('correct', 'partial', 'incorrect')),
  missing jsonb not null default '[]'::jsonb,
  score numeric(5, 2),
  is_correct boolean,
  created_at timestamptz not null default now()
);

create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  preparation_id uuid not null references preparations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb
);

create table if not exists interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  role text not null check (role in ('interviewer', 'user')),
  content text not null,
  question_number integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preparation_id uuid not null references preparations (id) on delete cascade,
  topic_id uuid references preparation_topics (id) on delete set null,
  questions_answered integer not null default 0,
  questions_correct integer not null default 0,
  score numeric(5, 2),
  time_spent_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (preparation_id, topic_id)
);
