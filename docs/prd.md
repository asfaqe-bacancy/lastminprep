# PrepSprint - AI Last-Minute Exam & Interview Preparation

## 1. Product Overview

Build a polished, production-quality web application called **PrepSprint**.

PrepSprint is an AI-powered last-minute preparation platform for exams and interviews.

The core idea:

> The user provides their preparation material and tells the app how much time they have. PrepSprint uses RAG and Gemini to create a focused preparation plan, teach important concepts, quiz the user, identify weak areas, and help them revise before the exam or interview.

The application should feel like a real SaaS product, not a demo or generic chatbot.

The primary goal of this project is also to demonstrate practical understanding of:

- LLMs
- Gemini API
- Prompt engineering
- Conversation history
- Embeddings
- Vector databases
- Semantic search
- RAG
- Grounded AI responses
- Document processing
- AI-generated quizzes
- AI interview simulation

Keep the implementation understandable for a developer who is learning RAG.

---

# 2. Technology Stack

Use:

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
- Lucide icons

Use server-side API routes/server actions for Gemini and database operations where appropriate.

Never expose secret API keys in the browser.

---

# 3. Product Design

The UI should be:

- Minimal
- Modern
- Premium
- Clean
- Professional
- Mobile responsive
- Desktop responsive
- Easy to understand
- Fast

Avoid the typical generic admin dashboard appearance.

Use:

- Clean cards
- Strong typography
- Good spacing
- Subtle borders
- Simple progress indicators
- Clear primary actions
- Skeleton/loading states
- Empty states
- Error states
- Responsive layouts

Support light and dark mode.

The application should work properly on:

- Desktop
- Tablet
- Mobile

Do not simply shrink the desktop UI for mobile.

---

# 4. Main User Flow

The main experience should be:

```text
Dashboard
    ↓
Create Preparation
    ↓
Choose Exam / Interview
    ↓
Enter Available Time
    ↓
Upload Preparation Material
    ↓
Process Documents
    ↓
Create Embeddings
    ↓
Store in Vector Database
    ↓
Generate Preparation Plan
    ↓
Learn
    ↓
Quiz / Interview
    ↓
Evaluate Performance
    ↓
Identify Weak Areas
    ↓
Targeted Practice
    ↓
Final Revision
```

---

# 5. Main Navigation

Desktop sidebar:

- Dashboard
- Preparations
- Documents
- Progress
- Settings

Mobile navigation:

- Home
- Preparations
- Add
- Progress
- More

---

# 6. Dashboard

Create a useful dashboard.

Show:

### Greeting

Example:

"Good afternoon"

"Ready for your next preparation?"

### Start Preparation

Two large options:

```text
Exam Preparation
Interview Preparation
```

### Recent Preparations

Example:

```text
React Native Interview
1 hour preparation
Progress: 70%

JavaScript Exam
3 hour preparation
Completed
```

### Progress

Show:

- Preparations completed
- Questions answered
- Weak topics
- Average quiz performance
- Study time

Keep the dashboard visually simple.

---

# 7. Create Preparation

Create a dedicated setup flow.

Step 1:

```text
What are you preparing for?

[ Exam ]

[ Interview ]
```

Step 2:

```text
How much time do you have?

15 minutes
30 minutes
1 hour
2 hours
3+ hours
```

Also allow custom time.

Step 3:

```text
What is your goal?

Quick Revision
Deep Preparation
Practice Questions
Mock Interview
```

Step 4:

Upload documents.

For the first version support:

- PDF

Later architecture can support:

- TXT
- DOCX
- PPTX

Documents may include:

### Exam

- Notes
- Course material
- Previous questions
- Syllabus
- PDFs

### Interview

- Resume
- Job description
- Technical notes
- Company information
- Preparation material

---

# 8. Document Processing

After upload:

```text
Upload PDF
    ↓
Extract text
    ↓
Clean text
    ↓
Split into chunks
    ↓
Generate embeddings
    ↓
Store chunks + embeddings
```

Create a document processing status UI:

```text
Uploading
✓
Extracting text
✓
Creating chunks
✓
Generating embeddings
✓
Indexing document
✓

Ready
```

Store useful metadata:

- document ID
- filename
- user ID
- page number
- chunk content
- embedding
- created date

---

# 9. RAG Architecture

Implement the basic RAG pipeline:

```text
Document
   ↓
Load
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
Gemini
   ↓
Grounded Answer
```

When the user asks a question:

```text
Question
   ↓
Question Embedding
   ↓
Vector Search
   ↓
Top Relevant Chunks
   ↓
Prompt + Context
   ↓
Gemini
   ↓
Answer
```

Start with a small top-k retrieval value such as 3.

Keep retrieval logic in a separate service/module so it can be improved later.

---

# 10. Grounded AI

The AI must prioritize the user's uploaded material.

Use a clear RAG system prompt.

The AI should:

- Answer using retrieved context
- Avoid inventing information
- Clearly indicate when information is unavailable
- Reference relevant sources
- Keep answers understandable

If the answer cannot be found in the uploaded material, the application should clearly communicate that the information was not found rather than pretending it was present.

---

# 11. Source Citations

Every RAG answer should show its sources.

Example:

```text
Answer

React Native's new architecture...

Sources
────────────────
React Native Notes.pdf
Page 12

React Native Architecture.pdf
Page 8
```

Make sources clickable where practical.

Show the relevant retrieved text when the user opens a source.

This makes the RAG behavior transparent.

---

# 12. Preparation Plan

After documents are processed, Gemini should generate a preparation plan based on:

- Preparation type
- Available time
- Uploaded material
- User goal

Example for 60 minutes:

```text
Your 60-minute plan

10 min
Core concepts

15 min
Important questions

20 min
Practice

10 min
Weak areas

5 min
Final revision
```

The plan should prioritize important material rather than attempting to cover everything.

---

# 13. Learn Mode

Create a focused learning interface.

Show:

- Current topic
- Short explanation
- Important points
- Source citations
- "Explain simpler"
- "Give example"
- "Ask me a question"

The AI should retrieve relevant chunks before answering.

---

# 14. Quiz Mode

Create an interactive quiz.

Example:

```text
Question 3 of 10

What is the purpose of embeddings
in a RAG system?

[ User answer ]

Submit
```

After submission:

```text
Your answer

...

Feedback

Correct / Partially Correct / Incorrect

Explanation

...

Source
RAG Notes.pdf
Page 8
```

Track:

- Question
- Topic
- User answer
- Correctness
- Score
- Source

---

# 15. Weak Area Detection

After a quiz, identify topics where the user struggled.

Example:

```text
Your weak areas

Embeddings       50%
Vector Search    60%
RAG              90%
Chunking         80%
```

Allow:

```text
Practice Weak Areas
```

When clicked, retrieve relevant document chunks and generate targeted questions.

---

# 16. Interview Mode

For interview preparation, create an AI interviewer.

The AI should use:

- Resume
- Job description
- Uploaded preparation material

Example:

```text
AI Interviewer

Tell me about your experience
with React Native.

[ User answer ]

Submit
```

Then the AI asks a follow-up question.

The interview should feel conversational.

Example:

```text
Question
   ↓
User Answer
   ↓
AI Analysis
   ↓
Follow-up Question
   ↓
User Answer
```

Do not reveal the evaluation immediately after every question if it would make the interview unrealistic.

Allow a final interview report.

---

# 17. Interview Report

After the interview show:

```text
Interview Summary

Questions answered: 10

Technical knowledge
8/10

Communication
8/10

Topic coverage
7/10

Areas to revise
• React Native architecture
• Performance optimization
• Offline synchronization
```

The report should provide useful explanations rather than just numbers.

---

# 18. Last-Minute Crash Preparation

This is the key differentiating feature.

The user should be able to say:

```text
I have an interview in 45 minutes.
```

or select:

```text
45 minutes
```

PrepSprint should automatically create a crash preparation session.

Example:

```text
45-MINUTE CRASH PREP

Must Know
★★★★★

React Native Architecture
Performance Optimization
State Management

Important
★★★★

Networking
Offline-first architecture

Optional
★★

Testing
Deployment
```

Then guide the user through the highest-priority material.

---

# 19. Final Revision

At the end of the preparation session generate a concise final revision page.

Example:

```text
FINAL REVISION

10 things you must remember

1. ...
2. ...
3. ...

Important concepts

...

Common questions

...

Your weak areas

...
```

The revision should be generated from the user's uploaded material.

---

# 20. Database

Use Supabase PostgreSQL.

Suggested tables:

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

Important fields should include:

### preparations

```text
id
user_id
type
goal
available_minutes
status
created_at
completed_at
```

### documents

```text
id
preparation_id
user_id
filename
file_url
status
created_at
```

### document_chunks

```text
id
document_id
content
page_number
embedding
metadata
created_at
```

### quiz_questions

```text
id
preparation_id
topic
question
answer
difficulty
source_chunk_ids
created_at
```

### quiz_answers

```text
id
question_id
user_answer
evaluation
score
created_at
```

Use Row Level Security so users can only access their own data.

---

# 21. Authentication

Use Supabase Auth.

Support:

- Email/password
- Google login if easy to configure

Authentication does not need to be overly complicated for the first version.

---

# 22. AI Architecture

Keep AI functionality modular.

Suggested structure:

```text
lib/
  ai/
    gemini.ts
    prompts.ts
    embeddings.ts
    rag.ts
    quiz.ts
    interview.ts
    preparation-plan.ts

lib/
  documents/
    parser.ts
    chunker.ts

lib/
  supabase/
    client.ts
    server.ts
```

The goal is to keep the AI logic separate from UI components.

---

# 23. Environment Variables

Use:

```env
GEMINI_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose:

```text
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to the client.

---

# 24. Development Strategy

IMPORTANT:

Do NOT build the complete application in one step.

Build incrementally.

After every phase:

1. Run the application.
2. Test the feature.
3. Fix errors.
4. Confirm it works.
5. Only then move to the next phase.

Do not introduce unnecessary libraries.

Keep implementation simple and understandable.

---

# 25. Development Phases

## Phase 1 - UI Foundation

Build:

- Next.js project
- Tailwind
- shadcn/ui
- Layout
- Sidebar
- Mobile navigation
- Dashboard
- Create Preparation page
- Preparation details page

No AI yet.

---

## Phase 2 - Gemini

Build:

- Gemini server integration
- Basic prompt
- Chat interface
- Loading state
- Error handling
- Conversation history

Milestone:

```text
User question
→ Gemini
→ Response
```

works reliably.

---

## Phase 3 - Document Upload

Build:

- PDF upload
- Supabase Storage
- PDF text extraction
- Document record
- Processing status

Milestone:

```text
PDF
→ extracted text
```

---

## Phase 4 - Chunking

Build:

```text
Extracted text
→ chunks
```

Display/debug the generated chunks.

Make sure chunking works before adding embeddings.

---

## Phase 5 - Embeddings

Build:

```text
Chunks
→ Gemini embeddings
```

Store embeddings in Supabase.

---

## Phase 6 - Vector Search

Build:

```text
Question
→ embedding
→ pgvector similarity search
→ top 3 chunks
```

Create a temporary debug interface showing retrieved chunks.

---

## Phase 7 - RAG

Connect:

```text
Question
→ retrieval
→ context
→ Gemini
→ answer
```

Add grounded prompts and source citations.

Milestone:

The application can answer questions based on an uploaded PDF.

---

## Phase 8 - Preparation Plan

Build:

- Time selection
- Goal selection
- AI-generated preparation plan
- Topic prioritization
- Preparation session

---

## Phase 9 - Quiz

Build:

- AI question generation
- User answers
- Answer evaluation
- Scores
- Progress
- Weak areas

---

## Phase 10 - Interview

Build:

- Resume/JD upload
- AI interviewer
- Conversation history
- Follow-up questions
- Interview report

---

## Phase 11 - Crash Prep

Build the main differentiating feature:

```text
Available time
+
Uploaded material
+
Goal
+
RAG
=
Personalized crash preparation
```

---

## Phase 12 - Polish

Add:

- Streaming responses
- Better loading states
- Animations
- Empty states
- Error states
- Responsive improvements
- Accessibility
- Source previews
- Progress charts
- Final revision page

---

# 26. What NOT to Build Initially

Do not start with:

- AI agents
- Multi-agent systems
- Voice
- OCR
- Long-term memory
- Complex recommendation systems
- Multiple AI providers
- Mobile app
- Advanced analytics

These can be added later if the core product is stable.

---

# 27. Competition Demo Flow

The final demo should be approximately:

```text
1. Open PrepSprint

2. Select Interview

3. Select 45 minutes

4. Upload:
   Resume.pdf
   JobDescription.pdf
   ReactNativeNotes.pdf

5. Process documents

6. AI generates:
   45-minute preparation plan

7. Start preparation

8. Ask a technical question

9. Show RAG answer + source

10. Start mock interview

11. Answer several questions

12. Show follow-up questions

13. Show weak areas

14. Start targeted practice

15. Show final revision

16. Show preparation summary
```

The demo should make it obvious that this is not simply a chatbot.

The core story should be:

> **"Give PrepSprint your material and the amount of time you have. It figures out what you should focus on and helps you practice it."**

---

# 28. Important Development Rule

At each stage, explain the implementation in simple terms before writing complicated code.

Prefer:

```text
small feature
→ test
→ understand
→ next feature
```

over:

```text
build everything
→ debug everything
```

Keep the architecture production-ready but beginner-friendly.

Do not over-engineer the application.
