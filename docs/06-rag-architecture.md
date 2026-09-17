# PrepSprint RAG Architecture

## Goal

Build a simple, understandable RAG system that answers questions using the user's uploaded preparation material.

The core principle:

> Retrieve relevant material first, then ask Gemini to answer using that context.

## Complete Pipeline

```text
Document
  ↓
Load
  ↓
Extract Text
  ↓
Clean Text
  ↓
Chunk
  ↓
Embedding
  ↓
Vector Database
  ↓
Similarity Search
  ↓
Relevant Chunks
  ↓
Prompt
  ↓
Gemini
  ↓
Grounded Answer
```

## 1. Document Upload

User uploads a PDF.

Store the original file in Supabase Storage.

Create a document record.

## 2. Text Extraction

Extract text from the PDF.

Preserve page information where possible.

Example:

```text
Page 1
...

Page 2
...
```

The page number is important for source citations.

## 3. Chunking

Do not send an entire document to Gemini for every question.

Split extracted text into smaller chunks.

Use recursive text splitting with overlap.

Initial configuration can be tuned during testing.

Example:

```text
chunk size: around 500-1000 tokens
overlap: around 50-150 tokens
```

The exact values should be evaluated against the documents being used.

## 4. Embeddings

Generate an embedding for every chunk.

Conceptually:

```text
"RAG retrieves relevant context..."
       ↓
[0.02, -0.18, 0.41, ...]
```

Store the vector in PostgreSQL using pgvector.

The vector dimension must match the embedding model being used.

## 5. Query Embedding

When the user asks:

```text
How does semantic search work?
```

Generate an embedding for the question.

```text
Question
 ↓
Embedding
```

## 6. Similarity Search

Search pgvector for the chunks most similar to the question.

Start with:

```text
top_k = 3
```

Return:

- Chunk content
- Document ID
- Page number
- Similarity score
- Metadata

## 7. Build Context

Combine the retrieved chunks into a context block.

Example:

```text
SOURCE 1
Document: RAG Notes.pdf
Page: 8

...

SOURCE 2
Document: AI Notes.pdf
Page: 12

...
```

## 8. Grounded Prompt

Use a system instruction similar to:

```text
Answer the user's question using the provided context.

Use only information supported by the context.

If the answer is not contained in the context,
say that the information was not found in the
uploaded material.

Do not invent facts or sources.

When possible, reference the source information.
```

## 9. Gemini Response

Send:

```text
System instruction
+
Conversation history where appropriate
+
Retrieved context
+
Current question
```

Then display the answer.

## 10. Source Citations

Return source metadata alongside the answer.

UI example:

```text
Answer

Semantic search compares the meaning
of text using embeddings...

Sources

RAG Notes.pdf
Page 8

AI Notes.pdf
Page 12
```

## 11. Conversation History

For a preparation session, maintain short-term conversation history.

Each request should include relevant previous messages where needed.

Do not blindly send unlimited history.

For long sessions, summarize older context if necessary.

## 12. RAG for Learn Mode

```text
User selects topic
 ↓
Retrieve relevant chunks
 ↓
Gemini explains topic
 ↓
Show sources
```

## 13. RAG for Quiz Mode

```text
Retrieve topic material
 ↓
Gemini generates question
 ↓
User answers
 ↓
Retrieve relevant source material
 ↓
Gemini evaluates answer
 ↓
Save result
```

## 14. RAG for Interview Mode

Use uploaded:
- Resume
- Job description
- Technical notes
- Preparation material

Flow:

```text
Interview state
 ↓
Retrieve relevant context
 ↓
Generate question
 ↓
User answers
 ↓
Evaluate
 ↓
Generate follow-up
```

## 15. RAG for Crash Prep

The crash-prep planner should use:
- Available time
- Preparation type
- Topics
- Retrieved document information
- User performance

Prioritize the material that is most relevant to the preparation goal and available time.

## 16. Grounding Rules

The application should distinguish between:

### Supported

Information directly supported by retrieved context.

### Not found

The uploaded material does not contain enough information.

Do not silently fill missing information with model knowledge when the feature is intended to be grounded in the user's documents.

## 17. Retrieval Debugging

During development create a debug view showing:

```text
Question

Retrieved chunk 1
Similarity: ...

Retrieved chunk 2
Similarity: ...

Retrieved chunk 3
Similarity: ...
```

This makes it easier to understand whether RAG is working.

Remove or protect debug tooling before production.

## 18. Failure Cases

Handle:

- Empty documents
- Poor PDF extraction
- No relevant chunks
- Low similarity
- Gemini failure
- Embedding failure
- Vector database failure
- Rate limits
- Very large documents

If retrieval returns nothing useful, do not fabricate a grounded answer.

## 19. Evaluation

Before the competition, create a small test set.

For each question record:

```text
Question
Expected source
Expected concept
Retrieved sources
Answer quality
Grounding
```

Test:
- Direct questions
- Paraphrased questions
- Questions not in the document
- Questions spanning multiple chunks
- Follow-up questions

## 20. Future Improvements

Only after the basic RAG system works consider:

- Better chunking
- Metadata filtering
- Hybrid search
- Reranking
- Streaming
- Persistent conversation memory
- Evaluation dashboards
- Guardrails
- More file formats

Keep the first implementation simple and explainable.
