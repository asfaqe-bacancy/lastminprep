import "server-only";

import { Type, type Schema } from "@google/genai";

/**
 * Response schemas for every structured call.
 *
 * Asking Gemini for JSON against a schema, rather than parsing prose, is what
 * keeps plans, questions, marking and reports from breaking a screen when the
 * model phrases something unexpectedly.
 */

export const PLAN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: "One sentence naming the trade-off this plan makes.",
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: {
            type: Type.STRING,
            enum: ["learn", "quiz", "interview", "weak_areas", "revision"],
          },
          minutes: { type: Type.INTEGER },
          description: {
            type: Type.STRING,
            description: "One line on what happens in this segment.",
          },
        },
        required: ["kind", "minutes", "description"],
      },
    },
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ["must_know", "important", "optional"],
          },
          estimatedMinutes: { type: Type.INTEGER },
          summary: {
            type: Type.STRING,
            description: "One line on what this topic covers in their material.",
          },
        },
        required: ["name", "priority", "estimatedMinutes", "summary"],
      },
    },
  },
  required: ["headline", "segments", "topics"],
};

export const CRASH_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    tiers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          priority: {
            type: Type.STRING,
            enum: ["must_know", "important", "optional"],
          },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                why: { type: Type.STRING },
                minutes: { type: Type.INTEGER },
              },
              required: ["name", "why", "minutes"],
            },
          },
        },
        required: ["priority", "topics"],
      },
    },
  },
  required: ["headline", "tiers"],
};

export const LEARN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING },
    keyIdea: { type: Type.STRING },
    remember: { type: Type.STRING },
    /** False when the material doesn't actually cover the topic. */
    covered: { type: Type.BOOLEAN },
  },
  required: ["explanation", "keyIdea", "remember", "covered"],
};

export const QUESTIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          question: { type: Type.STRING },
          expectedAnswer: { type: Type.STRING },
          difficulty: {
            type: Type.STRING,
            enum: ["easy", "medium", "hard"],
          },
        },
        required: ["topic", "question", "expectedAnswer", "difficulty"],
      },
    },
  },
  required: ["questions"],
};

export const EVALUATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      enum: ["correct", "partial", "incorrect"],
    },
    score: { type: Type.INTEGER },
    feedback: { type: Type.STRING },
    missing: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["verdict", "score", "feedback", "missing"],
};

export const INTERVIEW_QUESTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    topic: { type: Type.STRING },
  },
  required: ["question", "topic"],
};

export const INTERVIEW_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    scores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            enum: ["Technical knowledge", "Communication", "Topic coverage"],
          },
          score: { type: Type.INTEGER },
          comment: { type: Type.STRING },
        },
        required: ["label", "score", "comment"],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    areasToRevise: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          why: { type: Type.STRING },
        },
        required: ["topic", "why"],
      },
    },
  },
  required: ["summary", "scores", "strengths", "areasToRevise"],
};

export const REVISION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    mustRemember: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          sourceNumber: {
            type: Type.INTEGER,
            description: "Which SOURCE block in the context this came from, or 0.",
          },
        },
        required: ["text", "sourceNumber"],
      },
    },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ["title", "body"],
      },
    },
    commonQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["question", "answer"],
      },
    },
    weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "mustRemember", "concepts", "commonQuestions", "weakAreas"],
};
