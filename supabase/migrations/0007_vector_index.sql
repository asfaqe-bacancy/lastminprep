-- PrepSprint · 0007 · vector index
--
-- Apply this once retrieval is working and there is real data to index
-- (RAG doc, section 6). Before that, a sequential scan over a few hundred
-- chunks is both fast enough and more accurate.
--
-- HNSW is used rather than IVFFlat because it needs no training pass and
-- behaves well as rows are added one preparation at a time. The operator class
-- must match the distance operator used in match_document_chunks (<=>).

create index if not exists document_chunks_embedding_idx
  on document_chunks
  using hnsw (embedding vector_cosine_ops);
