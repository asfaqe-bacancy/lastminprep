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
