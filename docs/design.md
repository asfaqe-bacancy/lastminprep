PrepSprint Design System

Design Direction

PrepSprint should not look like an AI product.

Avoid the common visual language of AI websites:

Purple/blue gradients everywhere

Glowing AI effects

Robot or sparkle icons

ChatGPT-style layouts

Excessive glassmorphism

Neon colors

"AI" badges everywhere

Huge gradient hero sections

Generic SaaS dashboards

Instead, PrepSprint should feel like a premium consumer product,
closer to the polish and physicality of modern Apple software.

The visual direction is:

Liquid, tactile, calm, premium, editorial, focused and slightly
futuristic without looking like an AI tool.

Think:

iPhone

Apple Music

Apple Fitness

Apple Wallet

iOS Settings

premium productivity apps

modern editorial apps

high-end mobile interfaces

The product should feel like something a user would want to keep open.

1. Core Visual Principles

1.1 Product First, AI Second

The UI should communicate:

Preparation

not:

Artificial Intelligence

The user should feel that they are using a preparation product that
happens to have intelligent functionality.

Avoid putting "AI" in every heading.

Instead of:

AI Powered Interview Preparation

Use:

Your interview starts in 45 minutes.

Instead of:

AI Generated Quiz

Use:

Quick Check

Instead of:

AI Assistant

Use:

Prep Coach

2. Overall Visual Feel

Use a clean, spacious interface with:

Large typography

Rounded containers

Soft depth

Subtle shadows

Thin borders

Smooth transitions

Layered surfaces

Generous whitespace

Strong visual hierarchy

Corners should feel rounded but not cartoonish.

Recommended radius:

Small: 10px

Medium: 16px

Large: 22px

Feature cards: 28px

Large hero surfaces: 32px

Avoid excessive rounded pills.

Use pills only for:

Status

Filters

Tags

Time selection

Small metadata

3. Liquid UI

The interface should have a subtle liquid feel.

Do NOT create extreme glassmorphism.

Use layered translucent surfaces sparingly:

Background
↓
Soft ambient shape
↓
Translucent surface
↓
Content

Cards can have:

Slight transparency

Very subtle backdrop blur

Thin borders

Soft shadow

Highlight along the top/edge

The effect should be barely noticeable.

The interface should still look excellent with blur disabled.

4. Color System

Do not use a typical "AI purple" color system.

Base colors should be neutral.

Light Mode

Primary background:

Warm white / soft gray

Primary surface:

White

Secondary surface:

Very light gray

Text:

Near black

Secondary text:

Muted gray

Borders:

Very subtle gray

Use one restrained accent color.

Possible accent direction:

Apple-like green

Warm orange

Coral

Deep blue

Soft red

The accent should communicate actions and progress rather than decorate
the entire UI.

Dark Mode

Use:

Near-black background

Dark charcoal surfaces

Soft white text

Muted gray secondary text

Same accent color

Avoid pure black + neon colors.

5. Typography

Typography is extremely important.

Use a modern system-style sans-serif.

Preferred:

Inter
SF Pro Display / SF Pro Text when available
system-ui

Use strong hierarchy.

Example:

45 min

should feel large and confident.

Not:

45 MINUTES OF AI POWERED PREPARATION

Prefer sentence case.

Avoid excessive uppercase text.

6. Homepage / Landing Page

The landing page should feel like a premium consumer application.

Hero:

You don't need
more time.

You need a better
way to use it.

[ Start Preparing ]

Supporting text:

Upload what you need to know. Tell us how much time you have. We'll
help you focus on what matters.

Do not mention "RAG", "LLM", "Gemini", embeddings or vector databases on
the main hero.

Those are implementation details.

7. Dashboard

The dashboard should immediately answer:

What should I do next?

Example:

Good afternoon, Asfaqe

Your interview starts in

45 min

Then a large primary preparation card:

┌─────────────────────────────────────┐
│ │
│ React Native Interview │
│ │
│ 45 minutes │
│ │
│ ━━━━━━━━━━━━━━━░░░░░ │
│ 68% prepared │
│ │
│ Continue → │
│ │
└─────────────────────────────────────┘

The card should feel physical and tactile.

8. New Preparation

Do not use a long traditional form.

Make the setup feel like a guided interaction.

Screen 1

What are you preparing for?

     Exam

     Interview

Large selectable cards.

Screen 2

How much time do you have?

15 min

30 min

45 min

1 hour

2 hours

Custom

The selected option should have a strong but subtle visual response.

Screen 3

What do you have?

Drop your material here

- Add PDF

Keep this screen extremely simple.

9. Preparation Overview

After processing the material, show a beautiful overview.

Example:

45 minute preparation

React Native Interview

────────────────────────────

Your focus

01 Architecture
02 Performance
03 Offline-first
04 Networking

────────────────────────────

45 min

10 min Learn
15 min Quick Check
15 min Mock Interview
05 min Final Review

[ Start ]

Use numbered sections rather than excessive icons.

10. Learn Mode

Learn mode should feel like reading a premium article.

Avoid chatbot bubbles.

Instead:

Architecture

The New Architecture changes
how React Native communicates
between JavaScript and native...

Key idea

...

Remember

...

Source
React Native Notes · Page 12

The AI response should look like content, not a chat message.

This is important.

11. Quick Check

Quiz UI should be minimal.

Example:

QUESTION 04

What problem does the
New Architecture solve?

────────────────────────

Your answer

┌──────────────────────────────┐
│ │
│ │
└──────────────────────────────┘

              Submit

Do not create colorful game-like quiz screens.

After submission:

Good answer.

You covered the main concept.

One thing to add:

...

Source
Architecture Notes · Page 8

12. Interview Mode

Interview mode should feel immersive.

Use a focused screen.

MOCK INTERVIEW

Question 04

How would you diagnose
performance issues in a
React Native application?

────────────────────────

Your answer

[ ]

                    Submit

Minimize navigation and distractions.

The AI should not visually dominate the screen.

The user is the focus.

13. Progress Visualization

Progress should feel calm and useful.

Use:

Circular progress

Thin progress bars

Small line charts

Topic completion

Time remaining

Avoid:

Excessive dashboards

Huge analytics sections

Complex charts

Gaming-style XP systems

Example:

Preparation

68%

Topics
████████░░

Confidence
███████░░░

14. Weak Areas

Use an editorial layout.

Topics to revisit

01 Embeddings
Needs another pass

02 Vector Search
Almost there

03 RAG
Strong

Avoid red/green traffic-light overload.

Use typography and subtle accent treatments instead.

15. Final Revision

This should be one of the strongest screens.

Make it feel like a beautifully designed revision card.

FINAL REVIEW

5 things to remember

01
Semantic search finds
meaning, not just keywords.

02
Embeddings represent
text as vectors.

03
RAG retrieves relevant
context before generation.

...

The user should be able to screenshot this screen.

16. Time Pressure UI

Time is one of the most important parts of PrepSprint.

Use time visually.

Example:

45:00
remaining

As time decreases, the UI can subtly change.

Do not use aggressive countdown animations.

The experience should feel calm:

You have 28 minutes. Here's what matters most.

Not:

HURRY! ONLY 28 MINUTES LEFT!!!

17. Navigation

Desktop:

Use a minimal sidebar.

PrepSprint

Home
Preparations
Documents
Progress

────────────

Settings

Mobile:

Use a bottom navigation bar.

Home Prep + Progress More

The active item should use the accent color and subtle background.

18. Icons

Use Lucide icons.

Keep icons:

Simple

Thin

Consistent

Avoid:

Robot icons

Sparkles

Brain icons everywhere

AI stars

Decorative 3D icons

Icons should support meaning, not decoration.

19. Motion

Motion should feel like iOS.

Use:

150-300ms transitions

Ease-out

Small scale changes

Opacity transitions

Smooth page transitions

Shared-looking card movement where practical

Examples:

Card press:

scale: 0.98

Button press:

scale: 0.97

Do not animate everything.

Motion should communicate:

Selection

Progress

Navigation

Completion

Loading

20. Loading States

Never show generic:

Loading...

Instead use contextual states.

Document processing:

Preparing your material

Extracting content...
Creating your study sections...
Almost ready...

RAG response:

Use a subtle content skeleton.

Avoid flashy AI typing animations.

21. Empty States

Empty states should be useful.

Example:

No preparations yet.

Your first preparation can take
less than a minute to set up.

[ Start Preparing ]

22. Cards

Cards should not all look identical.

Use different compositions.

Feature Card

Large rounded surface.

List Item

Minimal border + spacing.

Progress Card

Data-focused.

Preparation Card

Large tactile surface.

Source Card

Compact and editorial.

Avoid putting every piece of information inside a card.

23. Source Design

Sources should look like references, not AI citations.

Example:

SOURCE

React Native Architecture.pdf
Page 12

"Fabric introduces..."

View source →

Use subtle typography.

24. AI Visibility

AI should be present but understated.

Instead of:

✨ AI Generated Answer

Use:

Prep Coach

or simply:

Explanation

The product should feel intelligent without constantly announcing that
it is AI.

25. Responsive Design

Mobile is a first-class experience.

Desktop:

Wider content

Sidebar

Multi-column layouts where useful

Mobile:

Single-column

Large touch targets

Bottom navigation

Sticky primary action where useful

Comfortable spacing

No tiny tables

No horizontal overflow

All primary actions should be easy to reach with one hand.

26. Accessibility

Follow:

WCAG-friendly contrast

Keyboard navigation

Visible focus states

Semantic HTML

Proper button labels

Screen-reader-friendly controls

Minimum comfortable touch targets

Do not rely only on color to communicate state.

27. Components

Create reusable components.

Suggested structure:

components/
ui/
layout/
preparation/
quiz/
interview/
documents/
progress/
sources/

Important reusable components:

PreparationCard
TimeSelector
ProgressRing
TopicList
SourceReference
DocumentUpload
QuestionCard
AnswerInput
Timer
PreparationTimeline
ScoreCard

Keep components composable.

28. Design Tokens

Create central design tokens for:

Colors

Radius

Shadows

Spacing

Typography

Transitions

Do not hardcode random values throughout components.

29. Shadows

Use extremely subtle shadows.

Preferred approach:

small shadow

- thin border

rather than heavy floating shadows.

Surfaces should feel layered, not floating.

30. Glass / Blur Rules

Use blur only where it adds depth.

Good:

Navigation

Floating action surfaces

Small overlays

Selected controls

Avoid:

Every card being glass

Blurred text backgrounds

Strong transparency

Rainbow gradients

The application must still look premium without blur.

31. What Makes PrepSprint Different

The visual identity should communicate:

CALM
FOCUSED
FAST
PREMIUM
TACTILE
HUMAN

Not:

AI
ROBOT
TECH DEMO
GENERIC SAAS

The product should feel like:

A beautiful preparation companion that happens to be powered by
advanced technology.

32. Final Design Rule

Every screen should pass this test:

Does this look like an AI-generated website?

If yes:

Remove unnecessary gradients.

Remove unnecessary AI terminology.

Remove excessive glass.

Remove decorative AI icons.

Simplify the layout.

Increase whitespace.

Improve typography.

Make the content the visual focus.

Does this feel like a premium consumer app?

If yes:

Keep it.

The goal is not to visually demonstrate how advanced the AI is.

The goal is to make the user think:

"This is really nice. I would actually use this before an exam or
interview."
