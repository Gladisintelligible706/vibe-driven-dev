import type { OnboardingSeed, OnboardingAssessment } from "../intelligence/onboarding-engine.js";

export type QuestionCategory =
  | "project-concept"
  | "target-user"
  | "problem-framing"
  | "success-definition"
  | "constraints"
  | "ai-scope"
  | "delivery-preference"
  | "platform"
  | "technical-debt"
  | "timeline";

export type QuestionLeverage = "critical" | "high" | "medium" | "low";

export interface AdaptiveQuestion {
  id: string;
  category: QuestionCategory;
  text: string;
  leverage: QuestionLeverage;
  plainLanguage: string;
  followUpOf?: string | undefined;
  skipIfKnown: string[];
  answerSignals: string[];
}

export interface QuestionBudget {
  total: number;
  remaining: number;
  criticalAsked: number;
  highAsked: number;
}

export interface QuestionEngineInput {
  seed: OnboardingSeed;
  assessment: OnboardingAssessment;
  previousAnswers: Record<string, string>;
  mode: "guided" | "autopilot" | "expert";
}

export interface QuestionEngineOutput {
  questions: AdaptiveQuestion[];
  budget: QuestionBudget;
  canProceedWithoutAnswers: boolean;
  skippedCategories: string[];
  reasoning: string[];
}

const MAX_QUESTIONS_GUIDED = 7;
const MAX_QUESTIONS_AUTOPILOT = 4;
const MAX_QUESTIONS_EXPERT = 2;

const QUESTION_TEMPLATES: Record<QuestionCategory, {
  leverage: QuestionLeverage;
  text: string;
  plainLanguage: string;
  skipSignals: string[];
  answerSignals: string[];
}> = {
  "project-concept": {
    leverage: "critical",
    text: "What kind of project do you want to build?",
    plainLanguage: "Tell me what you want to build in your own words.",
    skipSignals: ["problemStatement"],
    answerSignals: ["projectType"]
  },
  "target-user": {
    leverage: "critical",
    text: "Who is this project for?",
    plainLanguage: "Who will use this?",
    skipSignals: ["targetUser"],
    answerSignals: ["targetUser"]
  },
  "problem-framing": {
    leverage: "critical",
    text: "What problem should this project solve for them?",
    plainLanguage: "What problem does it fix?",
    skipSignals: ["problemStatement"],
    answerSignals: ["problemStatement"]
  },
  "success-definition": {
    leverage: "high",
    text: "What would a good first version help the user do successfully?",
    plainLanguage: "How will you know the first version works well?",
    skipSignals: ["successDefinition"],
    answerSignals: ["successDefinition"]
  },
  "constraints": {
    leverage: "high",
    text: "Are there any important constraints or deadlines?",
    plainLanguage: "Any deadlines or things we must respect?",
    skipSignals: ["constraints"],
    answerSignals: ["constraints"]
  },
  "ai-scope": {
    leverage: "medium",
    text: "Should AI be a core product feature or just a helper inside the workflow?",
    plainLanguage: "Is AI central to the product or just a nice-to-have?",
    skipSignals: ["hasAiFeatures"],
    answerSignals: ["hasAiFeatures"]
  },
  "delivery-preference": {
    leverage: "medium",
    text: "Do you want a fast MVP or a stronger long-term foundation?",
    plainLanguage: "Quick launch or solid foundation first?",
    skipSignals: ["deliveryPreference"],
    answerSignals: ["deliveryPreference"]
  },
  "platform": {
    leverage: "low",
    text: "Is this a web app, mobile app, or something else?",
    plainLanguage: "Where will people use it?",
    skipSignals: ["platform"],
    answerSignals: ["platform"]
  },
  "technical-debt": {
    leverage: "low",
    text: "Is there existing code or tech debt we should know about?",
    plainLanguage: "Any existing code or technical issues?",
    skipSignals: [],
    answerSignals: []
  },
  "timeline": {
    leverage: "low",
    text: "When do you need this ready?",
    plainLanguage: "What is your timeline?",
    skipSignals: [],
    answerSignals: []
  }
};

function getBudgetForMode(mode: "guided" | "autopilot" | "expert"): number {
  switch (mode) {
    case "guided":
      return MAX_QUESTIONS_GUIDED;
    case "autopilot":
      return MAX_QUESTIONS_AUTOPILOT;
    case "expert":
      return MAX_QUESTIONS_EXPERT;
  }
}

function isSignalPresent(
  seed: OnboardingSeed,
  signalKey: string
): boolean {
  switch (signalKey) {
    case "problemStatement":
      return seed.problemStatement.trim().length >= 40;
    case "targetUser":
      return (seed.targetUser?.trim().length ?? 0) >= 8;
    case "successDefinition":
      return (seed.successDefinition?.trim().length ?? 0) >= 24;
    case "hasAiFeatures":
      return true; // always has a value
    case "deliveryPreference":
      return true; // always has a value
    case "constraints":
      return seed.constraints.length > 0;
    case "projectType":
      return seed.projectType !== "mvp" || seed.problemStatement.trim().length >= 60;
    case "platform":
      return (seed.platform?.trim().length ?? 0) > 0;
    default:
      return false;
  }
}

function shouldSkipCategory(
  category: QuestionCategory,
  seed: OnboardingSeed,
  assessment: OnboardingAssessment,
  previousAnswers: Record<string, string>
): boolean {
  const template = QUESTION_TEMPLATES[category];

  // Skip if all skip signals are already present
  if (template.skipSignals.length > 0) {
    const allPresent = template.skipSignals.every((signal) =>
      isSignalPresent(seed, signal)
    );
    if (allPresent) {
      return true;
    }
  }

  // Skip if we already have a good answer from previous rounds
  if (previousAnswers[category] && previousAnswers[category].trim().length > 10) {
    return true;
  }

  // Skip if the assessment already covered this
  if (assessment.missingSignals.length === 0 && category !== "constraints" && category !== "ai-scope") {
    return true;
  }

  return false;
}

function buildAdaptiveQuestion(
  category: QuestionCategory,
  followUpOf?: string
): AdaptiveQuestion {
  const template = QUESTION_TEMPLATES[category];
  return {
    id: `q-${category}-${Date.now()}`,
    category,
    text: template.text,
    leverage: template.leverage,
    plainLanguage: template.plainLanguage,
    followUpOf,
    skipIfKnown: template.skipSignals,
    answerSignals: template.answerSignals
  };
}

function buildFollowUpQuestion(
  category: QuestionCategory,
  previousAnswer: string
): AdaptiveQuestion | null {
  const followUps: Record<QuestionCategory, ((answer: string) => AdaptiveQuestion | null)[]> = {
    "project-concept": [
      (answer) => {
        if (/saas|subscription|dashboard/i.test(answer)) {
          return {
            ...buildAdaptiveQuestion("target-user", "project-concept"),
            text: "Since this is a SaaS product, who is the primary paying customer?",
            plainLanguage: "Who pays for this?"
          };
        }
        return null;
      }
    ],
    "target-user": [
      (answer) => {
        if (/team|enterprise|company/i.test(answer)) {
          return {
            ...buildAdaptiveQuestion("constraints", "target-user"),
            text: "Does the team have any compliance or security requirements?",
            plainLanguage: "Any special security rules for your team?"
          };
        }
        return null;
      }
    ],
    "problem-framing": [],
    "success-definition": [],
    "constraints": [],
    "ai-scope": [],
    "delivery-preference": [],
    "platform": [],
    "technical-debt": [],
    "timeline": []
  };

  const builders = followUps[category] ?? [];
  for (const builder of builders) {
    const result = builder(previousAnswer);
    if (result) {
      return result;
    }
  }

  return null;
}

function prioritizeCategories(
  categories: QuestionCategory[],
  seed: OnboardingSeed
): QuestionCategory[] {
  const priority: QuestionCategory[] = [];

  // Critical first
  const critical = categories.filter((c) => QUESTION_TEMPLATES[c].leverage === "critical");
  priority.push(...critical);

  // High next
  const high = categories.filter((c) => QUESTION_TEMPLATES[c].leverage === "high");
  priority.push(...high);

  // Medium based on context
  const medium = categories.filter((c) => QUESTION_TEMPLATES[c].leverage === "medium");
  // If AI features are relevant, ask about AI scope sooner
  if (seed.hasAiFeatures && medium.includes("ai-scope")) {
    priority.push("ai-scope");
    priority.push(...medium.filter((c) => c !== "ai-scope"));
  } else {
    priority.push(...medium);
  }

  // Low last
  const low = categories.filter((c) => QUESTION_TEMPLATES[c].leverage === "low");
  priority.push(...low);

  return priority;
}

export class QuestionEngine {
  buildQuestions(input: QuestionEngineInput): QuestionEngineOutput {
    const maxQuestions = getBudgetForMode(input.mode);
    const allCategories: QuestionCategory[] = [
      "project-concept",
      "target-user",
      "problem-framing",
      "success-definition",
      "constraints",
      "ai-scope",
      "delivery-preference",
      "platform",
      "technical-debt",
      "timeline"
    ];

    const skippedCategories: string[] = [];
    const reasoning: string[] = [];
    const questions: AdaptiveQuestion[] = [];

    // Filter out categories that can be skipped
    const relevantCategories = allCategories.filter((category) => {
      if (shouldSkipCategory(category, input.seed, input.assessment, input.previousAnswers)) {
        skippedCategories.push(category);
        reasoning.push(`Skipped "${category}": signal already present or previously answered.`);
        return false;
      }
      return true;
    });

    // Prioritize remaining categories
    const prioritized = prioritizeCategories(relevantCategories, input.seed);

    // Build questions within budget
    let criticalAsked = 0;
    let highAsked = 0;

    for (const category of prioritized) {
      if (questions.length >= maxQuestions) {
        reasoning.push(`Budget exhausted at ${maxQuestions} questions.`);
        break;
      }

      const question = buildAdaptiveQuestion(category);
      questions.push(question);

      if (question.leverage === "critical") {
        criticalAsked++;
      } else if (question.leverage === "high") {
        highAsked++;
      }

      // Check for follow-up from previous answers
      const previousAnswer = input.previousAnswers[category];
      if (previousAnswer && questions.length < maxQuestions) {
        const followUp = buildFollowUpQuestion(category, previousAnswer);
        if (followUp) {
          questions.push(followUp);
          reasoning.push(`Added adaptive follow-up for "${category}".`);
        }
      }
    }

    // Can we proceed without more answers?
    const hasAllCritical = !allCategories
      .filter((c) => QUESTION_TEMPLATES[c].leverage === "critical")
      .some((c) => !shouldSkipCategory(c, input.seed, input.assessment, input.previousAnswers));

    const canProceedWithoutAnswers =
      hasAllCritical &&
      (input.assessment.canInitializeState || input.mode === "expert");

    if (canProceedWithoutAnswers) {
      reasoning.push("All critical signals are present. Safe to proceed.");
    } else if (!hasAllCritical) {
      reasoning.push("Critical signals are missing. Must ask before proceeding.");
    }

    return {
      questions,
      budget: {
        total: maxQuestions,
        remaining: maxQuestions - questions.length,
        criticalAsked,
        highAsked
      },
      canProceedWithoutAnswers,
      skippedCategories,
      reasoning
    };
  }

  shouldAskMore(
    currentBudget: QuestionBudget,
    hasBlockingUncertainty: boolean
  ): boolean {
    if (hasBlockingUncertainty) {
      return currentBudget.remaining > 0;
    }
    return currentBudget.remaining > 0 && currentBudget.criticalAsked < 3;
  }
}
