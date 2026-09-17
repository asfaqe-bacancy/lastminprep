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
