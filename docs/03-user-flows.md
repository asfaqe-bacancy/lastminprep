# PrepSprint User Flows

## Core Product Flow

```text
Dashboard
  ↓
Create Preparation
  ↓
Choose Exam / Interview
  ↓
Select Available Time
  ↓
Set Goal
  ↓
Upload Material
  ↓
Process Documents
  ↓
Generate Preparation Plan
  ↓
Learn / Quiz / Interview
  ↓
Identify Weak Areas
  ↓
Targeted Practice
  ↓
Final Revision
```

## Flow 1: Create Preparation

### Step 1: Type

User chooses:
- Exam
- Interview

### Step 2: Time

Options:
- 15 minutes
- 30 minutes
- 45 minutes
- 1 hour
- 2 hours
- Custom

### Step 3: Goal

Options:
- Quick Revision
- Deep Preparation
- Practice Questions
- Mock Interview

### Step 4: Documents

Upload PDF material.

Exam documents:
- Notes
- Course material
- Previous questions
- Syllabus

Interview documents:
- Resume
- Job description
- Technical notes
- Company information
- Preparation material

### Step 5: Processing

Show:
- Uploading
- Extracting content
- Creating study sections
- Generating embeddings
- Indexing
- Ready

## Flow 2: Preparation Plan

After processing, generate a time-aware plan.

Example:

```text
60 minutes

10 min - Core concepts
15 min - Important questions
20 min - Practice
10 min - Weak areas
5 min - Final revision
```

## Flow 3: Learn

User selects a topic.

System retrieves relevant document chunks and shows:
- Explanation
- Key ideas
- Examples where supported
- Sources

Actions:
- Explain simpler
- Give example
- Ask me a question

## Flow 4: Quiz

```text
Generate question
  ↓
User answers
  ↓
Evaluate answer
  ↓
Show feedback
  ↓
Record topic performance
  ↓
Next question
```

Track:
- Question
- Topic
- Answer
- Correctness
- Score
- Sources

## Flow 5: Weak Areas

After a quiz:
1. Group results by topic.
2. Identify low-performing topics.
3. Show topics to revisit.
4. Let user start targeted practice.
5. Retrieve relevant source material.
6. Generate new questions.

## Flow 6: Interview

```text
Start interview
  ↓
Ask question
  ↓
User answers
  ↓
Analyze answer
  ↓
Ask follow-up
  ↓
Repeat
  ↓
Final report
```

Use:
- Resume
- Job description
- Preparation documents

## Flow 7: Final Revision

Generate:
- Most important concepts
- Common questions
- Weak areas
- Key reminders
- Relevant sources

## Flow 8: Last-Minute Crash Prep

User selects available time.

System prioritizes material based on the available time.

Example:

```text
45-MINUTE CRASH PREP

Must Know
- Architecture
- Performance
- State management

Important
- Networking
- Offline-first

Optional
- Testing
- Deployment
```

Then guide the user through the highest-priority material.

## Flow 9: Authentication

```text
Landing
  ↓
Sign in / Sign up
  ↓
Dashboard
```

Use Supabase Auth.

## Flow 10: Error and Empty States

Every flow should have:
- Empty state
- Loading state
- Error state
- Retry action
- Success state
