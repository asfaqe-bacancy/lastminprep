# Retrieval and grounding test set

From `06-rag-architecture.md`, section 19. Run this once `GEMINI_API_KEY` and
Supabase are configured — it is the difference between "the demo worked" and
"retrieval works".

## Setup

1. Create a preparation and upload a document you know well.
2. Note its id from the URL.
3. For each question below, call the retrieval inspector:

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"preparationId":"<id>","query":"<question>"}' \
  http://localhost:3000/api/debug/retrieval | jq '.chunks[] | {rank, similarity, filename, pageNumber}'
```

4. Then ask the same question in the app and check the answer and its sources.

## What to record

| Field | What good looks like |
| --- | --- |
| Question | — |
| Expected source | The page you know the answer is on |
| Retrieved sources | The expected page in the top 3 |
| Top similarity | Above 0.6 for a direct question |
| Answer quality | Answers the question, no padding |
| Grounded | Every claim traceable to a retrieved chunk |

## The five cases that matter

### 1. Direct questions
Wording close to the document's own. The expected page should rank first with
a high score. If this fails, something is wrong with chunking or embedding —
check the chunk inspector before anything else.

### 2. Paraphrased questions
Same meaning, different words. Ask about "how does it know what I mean" where
the document says "semantic search compares meaning using embeddings". This is
the case keyword search cannot do and embeddings can; it is the clearest
evidence that retrieval is semantic.

### 3. Questions not in the document
Ask something the material genuinely doesn't cover. The app must say so. An
invented answer here is the most serious failure this test set can find — it
means grounding is not working, and every other answer becomes untrustworthy.

### 4. Questions spanning multiple chunks
Something needing two separate sections. Check that more than one distinct page
is retrieved and that the answer draws on both.

### 5. Follow-up questions
Ask a question, then a follow-up that only makes sense in context ("why does
that matter?"). Conversation history should carry it, and retrieval should
still run on the follow-up rather than reusing the first question's chunks.

## When results are poor

| Symptom | First thing to try |
| --- | --- |
| Right page never retrieved | Smaller chunks — try `targetChars=1200` |
| Answers feel truncated | Larger overlap, or raise `RETRIEVAL_TOP_K` |
| Irrelevant chunks retrieved | Raise `RETRIEVAL_MIN_SIMILARITY` |
| "Not found" for covered topics | Lower `RETRIEVAL_MIN_SIMILARITY` |
| Answers stray beyond the material | Tighten `GROUNDING` in `lib/ai/prompts.ts` |

Change one thing at a time and re-run the set. All the knobs are in
`lib/constants.ts`.
