/**
 * Question Builder
 *
 * Builds the next adaptive question based on the previous answer and
 * current signal state. Follows the "one question at a time" principle
 * and constructs questions that narrow from broad to specific.
 */

import type { ExtractedSignals, ProjectShape, AiRole, UserPersona } from "./intent-capture-engine.js";

// ─── Types ─────────────────────────────────────────────────────

export interface PopupQuestion {
  id: string;
  category: string;
  text: string;
  plainLanguage: string;
  choices: QuestionChoice[] | undefined;
  questionNumber: number;
  totalQuestions: number;
  progressLabel: string;
}

export interface QuestionChoice {
  label: string;
  value: string;
  description?: string;
}

export interface QuestionBuilderInput {
  signals: ExtractedSignals;
  questionIndex: number;
  maxQuestions: number;
  previousCategory: string;
  previousAnswer: string;
}

// ─── Question Templates ────────────────────────────────────────

const GENERAL_OPENING: Omit<PopupQuestion, "id" | "questionNumber" | "totalQuestions" | "progressLabel"> = {
  category: "general-idea",
  text: "احكيلي بشكل عام عن فكرتك والمشروع اللي في بالك.\nشايفه بيساعد مين وبيحل إيه؟",
  plainLanguage: "Tell me about your project idea in your own words.",
  choices: undefined,
};

function buildUserClarification(signals: ExtractedSignals): PopupQuestion["choices"] {
  return [
    { label: "فرد / مستقل", value: "individual", description: "Freelancer, solo founder, or personal use" },
    { label: "شركة أو مؤسسة", value: "company", description: "Business customers or enterprise" },
    { label: "فريق داخلي", value: "internal-team", description: "Your own team or department" },
    { label: "جمهور واسع", value: "broad-audience", description: "Open to the public or many users" },
  ];
}

function buildProductShapeClarification(): PopupQuestion["choices"] {
  return [
    { label: "Web App", value: "web-app", description: "A web application or dashboard" },
    { label: "SaaS", value: "saas", description: "Subscription-based cloud product" },
    { label: "Internal Tool", value: "internal-tool", description: "For internal team use only" },
    { label: "AI Wrapper", value: "ai-wrapper", description: "An app built around AI capabilities" },
  ];
}

function buildAiRoleClarification(): PopupQuestion["choices"] {
  return [
    { label: "يكتب المحتوى", value: "writes", description: "AI generates or drafts content" },
    { label: "يحلل البيانات", value: "analyzes", description: "AI analyzes data and provides insights" },
    { label: "يرد على المستخدمين", value: "responds", description: "AI handles support or conversations" },
    { label: "يشغّل workflows", value: "orchestrates", description: "AI automates multi-step processes" },
  ];
}

function buildDeliveryClarification(): PopupQuestion["choices"] {
  return [
    { label: "نسخة سريعة", value: "mvp", description: "Quick prototype to validate the idea fast" },
    { label: "أساس قوي", value: "foundation", description: "Clean, scalable foundation from the start" },
  ];
}

// ─── Question Selection Logic ──────────────────────────────────

function selectNextCategory(
  signals: ExtractedSignals,
  previousCategory: string,
  questionIndex: number
): string {
  // First question is always the general opener
  if (questionIndex === 0) {
    return "general-idea";
  }

  // Priority order based on what's still missing
  const priorities: Array<{ category: string; check: () => boolean }> = [
    {
      category: "target-user",
      check: () => signals.targetUser === "unknown"
    },
    {
      category: "core-problem",
      check: () => signals.coreProblem.trim().length < 30
    },
    {
      category: "product-shape",
      check: () => signals.productShape === "unknown"
    },
    {
      category: "ai-role",
      check: () => signals.hasAiFeatures && signals.aiRole === "none"
    },
    {
      category: "delivery-preference",
      check: () => signals.deliveryPreference === "unknown"
    },
    {
      category: "constraints",
      check: () => signals.constraints.length === 0 && questionIndex >= 3
    },
  ];

  // Skip the category we just asked about
  for (const { category, check } of priorities) {
    if (category !== previousCategory && check()) {
      return category;
    }
  }

  // If everything seems covered, ask a deepening question on the weakest area
  if (signals.coreProblem.trim().length < 60) {
    return "deepen-problem";
  }
  if (signals.targetUser !== "unknown" && !signals.constraints.length) {
    return "constraints";
  }

  return "synthesis";
}

function buildQuestionForCategory(
  category: string,
  signals: ExtractedSignals,
  questionIndex: number,
  maxQuestions: number
): PopupQuestion {
  const progressLabel = buildProgressLabel(questionIndex, maxQuestions);
  const base: Pick<PopupQuestion, "id" | "questionNumber" | "totalQuestions" | "progressLabel"> = {
    id: `popup-${category}-${Date.now()}`,
    questionNumber: questionIndex + 1,
    totalQuestions: maxQuestions,
    progressLabel,
  };

  switch (category) {
    case "general-idea":
      return {
        ...base,
        ...GENERAL_OPENING,
      };

    case "target-user":
      return {
        ...base,
        category: "target-user",
        text: buildTargetUserText(signals),
        plainLanguage: "Who is the primary user of this product?",
        choices: buildUserClarification(signals),
      };

    case "core-problem":
      return {
        ...base,
        category: "core-problem",
        text: buildCoreProblemText(signals),
        plainLanguage: "What is the main problem this solves?",
        choices: undefined,
      };

    case "product-shape":
      return {
        ...base,
        category: "product-shape",
        text: buildProductShapeText(signals),
        plainLanguage: "What shape does the product take?",
        choices: buildProductShapeClarification(),
      };

    case "ai-role":
      return {
        ...base,
        category: "ai-role",
        text: buildAiRoleText(signals),
        plainLanguage: "What exactly will the AI do in the product?",
        choices: buildAiRoleClarification(),
      };

    case "delivery-preference":
      return {
        ...base,
        category: "delivery-preference",
        text: buildDeliveryText(signals),
        plainLanguage: "What matters more right now — speed or quality?",
        choices: buildDeliveryClarification(),
      };

    case "constraints":
      return {
        ...base,
        category: "constraints",
        text: buildConstraintsText(signals),
        plainLanguage: "Are there any hard constraints or deadlines?",
        choices: undefined,
      };

    case "deepen-problem":
      return {
        ...base,
        category: "deepen-problem",
        text: buildDeepenProblemText(signals),
        plainLanguage: "Help me understand the problem better.",
        choices: undefined,
      };

    case "synthesis":
    default:
      return {
        ...base,
        category: "synthesis",
        text: buildSynthesisText(signals),
        plainLanguage: "Let me summarize what I understand.",
        choices: undefined,
      };
  }
}

// ─── Contextual Question Text Builders ─────────────────────────

function buildTargetUserText(signals: ExtractedSignals): string {
  const projectContext = signals.projectType !== "unknown"
    ? ` بما إن مشروعك شكله ${translateProjectType(signals.projectType)}،`
    : "";

  return `مين المستخدم الأساسي أكتر؟${projectContext}`;
}

function buildCoreProblemText(signals: ExtractedSignals): string {
  const userContext = signals.targetUser !== "unknown"
    ? ` لـ ${translateUserPersona(signals.targetUser)}`
    : "";

  return `إيه أكتر مشكلة أو ألم المنتج ده بيحله${userContext}؟`;
}

function buildProductShapeText(signals: ExtractedSignals): string {
  return `شايف شكل المنتج إيه أقرب؟`;
}

function buildAiRoleText(signals: ExtractedSignals): string {
  return `الـ AI في المنتج هيعمل إيه بالضبط؟`;
}

function buildDeliveryText(signals: ExtractedSignals): string {
  return `أهم حاجة بالنسبة لك دلوقتي إيه؟`;
}

function buildConstraintsText(signals: ExtractedSignals): string {
  return `فيه أي قيود مهمة لازم ناخد بالنا منها؟ زي deadlines أو ميزانية أو compliance؟`;
}

function buildDeepenProblemText(signals: ExtractedSignals): string {
  if (signals.targetUser !== "unknown") {
    return `تقدر توصفلي أكتر إزاي ${translateUserPersona(signals.targetUser)} بتتعامل مع المشكلة دلوقتي؟ وإيه اللي بيخلي الحل ده مهم؟`;
  }
  return `تقدر تفاصلي أكتر عن المشكلة اللي عايز تحلها؟`;
}

function buildSynthesisText(signals: ExtractedSignals): string {
  return `خليني ألخص اللي فهمته: عندك ${translateProductShape(signals.productShape)} لـ ${translateUserPersona(signals.targetUser)} بيحل مشكلة في ${signals.coreProblem.slice(0, 60)}. هل ده صحيح ولا في حاجة ناقصة؟`;
}

function buildProgressLabel(current: number, max: number): string {
  if (current === 0) {
    return "سؤال سريع لفهم فكرتك";
  }
  return `سؤال ${current + 1} من ${max}`;
}

// ─── Translation Helpers ───────────────────────────────────────

function translateProjectType(type: string): string {
  const map: Record<string, string> = {
    "saas": "منتج SaaS",
    "internal-tool": "أداة داخلية",
    "content-site": "موقع محتوى",
    "wrapper-app": "تطبيق AI wrapper",
    "mvp": "MVP",
  };
  return map[type] ?? type;
}

function translateUserPersona(persona: string): string {
  const map: Record<string, string> = {
    "individual": "مستخدمين أفراد",
    "company": "شركات",
    "internal-team": "فريق داخلي",
    "broad-audience": "جمهور واسع",
  };
  return map[persona] ?? persona;
}

function translateProductShape(shape: string): string {
  const map: Record<string, string> = {
    "web-app": "Web App",
    "saas": "منتج SaaS",
    "internal-tool": "أداة داخلية",
    "ai-wrapper": "تطبيق AI wrapper",
  };
  return map[shape] ?? shape;
}

// ─── Main Builder ──────────────────────────────────────────────

export class QuestionBuilder {
  /**
   * Build the next popup question based on current signals and state.
   */
  build(input: QuestionBuilderInput): PopupQuestion {
    const nextCategory = selectNextCategory(
      input.signals,
      input.previousCategory,
      input.questionIndex
    );

    return buildQuestionForCategory(
      nextCategory,
      input.signals,
      input.questionIndex,
      input.maxQuestions
    );
  }

  /**
   * Build the very first question (always the general opener).
   */
  buildFirstQuestion(maxQuestions: number): PopupQuestion {
    return {
      id: `popup-general-idea-${Date.now()}`,
      category: "general-idea",
      text: GENERAL_OPENING.text,
      plainLanguage: GENERAL_OPENING.plainLanguage,
      choices: undefined,
      questionNumber: 1,
      totalQuestions: maxQuestions,
      progressLabel: "سؤال سريع لفهم فكرتك",
    };
  }

  /**
   * Check if the next question should be a synthesis/final question.
   */
  shouldSynthesize(signals: ExtractedSignals, questionIndex: number, maxQuestions: number): boolean {
    const confidentSignals = Object.values(signals.confidence).filter(Boolean).length;
    const totalSignals = Object.keys(signals.confidence).length;
    const coverageRatio = confidentSignals / totalSignals;

    // Synthesize if we have high coverage or we're at the budget limit
    return coverageRatio >= 0.75 || questionIndex >= maxQuestions - 1;
  }
}
