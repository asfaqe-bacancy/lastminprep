-- PrepSprint · complete schema, ready to paste
--
-- Generated from supabase/migrations/. Paste the whole file into the Supabase
-- SQL Editor and run it once. Every statement is idempotent, so it is safe to
-- run again if something fails partway.
--
-- 0007_vector_index.sql is deliberately NOT included. Add the vector index
-- only after retrieval is confirmed working; before that a sequential scan
-- over a few hundred chunks is faster to debug and more accurate.
--
-- After running: PostgREST caches the schema, so give it a few seconds before
-- the app can see the new tables.



-- ===========================================================================
-- 0001_extensions.sql
-- ===========================================================================

-- PrepSprint · 0001 · extensions
--
-- Apply the files in this folder in numeric order, either through the Supabase
-- SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "vector";


-- ===========================================================================
-- 0002_tables.sql
-- ===========================================================================

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


-- ===========================================================================
-- 0003_indexes.sql
-- ===========================================================================

-- PrepSprint · 0003 · indexes
--
-- The vector index is deliberately not here; it goes in 0007 so it can be
-- added once retrieval is known to work (RAG doc, section 6).

create index if not exists preparations_user_id_idx on preparations (user_id);
create index if not exists preparations_user_created_idx
  on preparations (user_id, created_at desc);

create index if not exists documents_user_id_idx on documents (user_id);
create index if not exists documents_preparation_id_idx
  on documents (preparation_id);

create index if not exists document_chunks_document_id_idx
  on document_chunks (document_id);
create index if not exists document_chunks_preparation_id_idx
  on document_chunks (preparation_id);
create index if not exists document_chunks_user_id_idx
  on document_chunks (user_id);

create index if not exists preparation_topics_preparation_id_idx
  on preparation_topics (preparation_id, position);

create index if not exists quiz_questions_preparation_id_idx
  on quiz_questions (preparation_id, position);
create index if not exists quiz_answers_question_id_idx
  on quiz_answers (question_id);
create index if not exists quiz_answers_user_id_idx
  on quiz_answers (user_id, created_at desc);

create index if not exists interview_sessions_preparation_id_idx
  on interview_sessions (preparation_id);
create index if not exists interview_messages_session_id_idx
  on interview_messages (session_id, created_at);

create index if not exists user_progress_preparation_id_idx
  on user_progress (preparation_id);


-- ===========================================================================
-- 0004_rls.sql
-- ===========================================================================

-- PrepSprint · 0004 · row level security
--
-- Rule: a row is yours when auth.uid() = user_id. Child rows that carry no
-- user_id (topics, questions, answers, messages) are authorised through their
-- parent preparation or session.
--
-- The service-role key used by the document pipeline bypasses all of this, so
-- server code always checks ownership of the parent record first.
--
-- Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is dropped
-- first. That makes this file safe to re-run after a partial failure.

alter table profiles enable row level security;
alter table preparations enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table preparation_topics enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table interview_sessions enable row level security;
alter table interview_messages enable row level security;
alter table user_progress enable row level security;

-- profiles ------------------------------------------------------------------

drop policy if exists "profiles are self-readable" on profiles;
create policy "profiles are self-readable"
  on profiles for select using (auth.uid() = id);

drop policy if exists "profiles are self-writable" on profiles;
create policy "profiles are self-writable"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles are self-insertable" on profiles;
create policy "profiles are self-insertable"
  on profiles for insert with check (auth.uid() = id);

-- preparations --------------------------------------------------------------

drop policy if exists "own preparations are readable" on preparations;
create policy "own preparations are readable"
  on preparations for select using (auth.uid() = user_id);

drop policy if exists "own preparations are insertable" on preparations;
create policy "own preparations are insertable"
  on preparations for insert with check (auth.uid() = user_id);

drop policy if exists "own preparations are updatable" on preparations;
create policy "own preparations are updatable"
  on preparations for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own preparations are deletable" on preparations;
create policy "own preparations are deletable"
  on preparations for delete using (auth.uid() = user_id);

-- documents -----------------------------------------------------------------

drop policy if exists "own documents are readable" on documents;
create policy "own documents are readable"
  on documents for select using (auth.uid() = user_id);

drop policy if exists "own documents are insertable" on documents;
create policy "own documents are insertable"
  on documents for insert with check (auth.uid() = user_id);

drop policy if exists "own documents are updatable" on documents;
create policy "own documents are updatable"
  on documents for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own documents are deletable" on documents;
create policy "own documents are deletable"
  on documents for delete using (auth.uid() = user_id);

-- document_chunks -----------------------------------------------------------

drop policy if exists "own chunks are readable" on document_chunks;
create policy "own chunks are readable"
  on document_chunks for select using (auth.uid() = user_id);

drop policy if exists "own chunks are insertable" on document_chunks;
create policy "own chunks are insertable"
  on document_chunks for insert with check (auth.uid() = user_id);

drop policy if exists "own chunks are deletable" on document_chunks;
create policy "own chunks are deletable"
  on document_chunks for delete using (auth.uid() = user_id);

-- preparation_topics --------------------------------------------------------

drop policy if exists "topics follow their preparation" on preparation_topics;
create policy "topics follow their preparation"
  on preparation_topics for all
  using (
    exists (
      select 1 from preparations p
      where p.id = preparation_topics.preparation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from preparations p
      where p.id = preparation_topics.preparation_id and p.user_id = auth.uid()
    )
  );

-- quiz_questions ------------------------------------------------------------

drop policy if exists "questions follow their preparation" on quiz_questions;
create policy "questions follow their preparation"
  on quiz_questions for all
  using (
    exists (
      select 1 from preparations p
      where p.id = quiz_questions.preparation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from preparations p
      where p.id = quiz_questions.preparation_id and p.user_id = auth.uid()
    )
  );

-- quiz_answers --------------------------------------------------------------

drop policy if exists "own answers are readable" on quiz_answers;
create policy "own answers are readable"
  on quiz_answers for select using (auth.uid() = user_id);

drop policy if exists "own answers are insertable" on quiz_answers;
create policy "own answers are insertable"
  on quiz_answers for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from quiz_questions q
      join preparations p on p.id = q.preparation_id
      where q.id = quiz_answers.question_id and p.user_id = auth.uid()
    )
  );

-- interview_sessions --------------------------------------------------------

drop policy if exists "own sessions are readable" on interview_sessions;
create policy "own sessions are readable"
  on interview_sessions for select using (auth.uid() = user_id);

drop policy if exists "own sessions are insertable" on interview_sessions;
create policy "own sessions are insertable"
  on interview_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "own sessions are updatable" on interview_sessions;
create policy "own sessions are updatable"
  on interview_sessions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- interview_messages --------------------------------------------------------

drop policy if exists "messages follow their session" on interview_messages;
create policy "messages follow their session"
  on interview_messages for all
  using (
    exists (
      select 1 from interview_sessions s
      where s.id = interview_messages.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from interview_sessions s
      where s.id = interview_messages.session_id and s.user_id = auth.uid()
    )
  );

-- user_progress -------------------------------------------------------------

drop policy if exists "own progress is readable" on user_progress;
create policy "own progress is readable"
  on user_progress for select using (auth.uid() = user_id);

drop policy if exists "own progress is writable" on user_progress;
create policy "own progress is writable"
  on user_progress for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ===========================================================================
-- 0005_storage.sql
-- ===========================================================================

-- PrepSprint · 0005 · storage
--
-- Private bucket for uploaded PDFs. Paths are `<user_id>/<preparation_id>/<uuid>.pdf`
-- so ownership is the first path segment (see lib/supabase/storage.ts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = array['application/pdf'];

drop policy if exists "own files are readable" on storage.objects;
create policy "own files are readable"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own files are insertable" on storage.objects;
create policy "own files are insertable"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own files are deletable" on storage.objects;
create policy "own files are deletable"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ===========================================================================
-- 0006_vector_search.sql
-- ===========================================================================

-- PrepSprint · 0006 · vector search
--
-- All similarity search goes through this function, so retrieval can be
-- changed in one place (RAG doc, section 6).
--
-- `security invoker` matters: the function runs with the caller's permissions,
-- so row level security still applies and a user can only ever match their own
-- chunks.
--
-- `<=>` is pgvector's cosine distance, so similarity is 1 - distance.

create or replace function match_document_chunks (
  query_embedding vector(768),
  p_preparation_id uuid,
  match_count integer default 3,
  p_document_ids uuid[] default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  content text,
  page_number integer,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.filename,
    c.content,
    c.page_number,
    1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where c.preparation_id = p_preparation_id
    and c.embedding is not null
    and (p_document_ids is null or c.document_id = any (p_document_ids))
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;


-- ===========================================================================
-- 0008_profiles_trigger.sql
-- ===========================================================================

-- PrepSprint · 0008 · profile creation
--
-- Gives every new auth user a profile row, so the app never has to branch on
-- a missing profile.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill anyone who signed up before this trigger existed. Without it, a
-- user created between running 0002 and 0008 never gets a profile row.
insert into public.profiles (id, email, name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
