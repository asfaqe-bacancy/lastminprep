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
