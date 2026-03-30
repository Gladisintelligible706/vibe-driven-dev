/**
 * Popup Flow Controller
 *
 * Orchestrates the full Intent Capture Popup flow:
 * - Manages current question, count, progress, and stop conditions
 * - Coordinates the intent-capture-engine, question-builder, and intent-confidence modules
 * - Produces an IntentSummary ready for handoff into /vibe.init
 */

import { IntentCaptureEngine, type ExtractedSignals, type CaptureInput, type CaptureOutput } from "./intent-capture-engine.js";
import { QuestionBuilder, type PopupQuestion, type QuestionBuilderInput } from "./question-builder.js";
import { IntentConfidenceScorer, type ConfidenceResult } from "./intent-confidence.js";
import type { OnboardingProjectType, DeliveryPreference } from "../intelligence/onboarding-engine.js";

// ─── Types ─────────────────────────────────────────────────────

export type FlowPhase = "idle" | "active" | "completed" | "stopped" | "failed";

export interface PopupFlowState {
  phase: FlowPhase;
  currentQuestion: PopupQuestion | null;
  questionIndex: number;
  maxQuestions: number;
  answers: PopupAnswer[];
  signals: ExtractedSignals;
  confidence: ConfidenceResult | null;
  startedAt: number;
  completedAt: number | null;
}

export interface PopupAnswer {
  questionId: string;
  category: string;
  text: string;
  answeredAt: number;
}

export interface IntentSummary {
  projectSummary: string;
  projectType: OnboardingProjectType | "unknown";
  targetUser: string;
  coreProblem: string;
  productShape: string;
  aiRole: string;
  hasAiFeatures: boolean;
  deliveryPreference: DeliveryPreference | "unknown";
  platform: string;
  constraints: string[];
  assumptions: string[];
  confidenceTier: string;
  confidenceScore: number;
  questionCount: number;
  answers: Array<{ category: string; text: string }>;
}

export interface PopupFlowStartResult {
  question: PopupQuestion;
  state: PopupFlowState;
}

export interface PopupFlowAnswerResult {
  nextQuestion: PopupQuestion | null;
  state: PopupFlowState;
  summary: IntentSummary | null;
  completed: boolean;
  extraction: CaptureOutput;
  confidence: ConfidenceResult;
}

export interface PopupFlowConfig {
  maxQuestions?: number;
  language?: "ar" | "en";
}

// ─── Default Config ────────────────────────────────────────────

const DEFAULT_CONFIG: Required<PopupFlowConfig> = {
  maxQuestions: 5,
  language: "ar",
};

// ─── Helpers ───────────────────────────────────────────────────

function createEmptySignals(): ExtractedSignals {
  return {
    projectSummary: "",
    projectType: "unknown",
    targetUser: "unknown",
    coreProblem: "",
    productShape: "unknown",
    aiRole: "none",
    hasAiFeatures: false,
    deliveryPreference: "unknown",
    platform: "unknown",
    constraints: [],
    confidence: {},
  };
}

function buildIntentSummary(
  signals: ExtractedSignals,
  confidence: ConfidenceResult,
  answers: PopupAnswer[]
): IntentSummary {
  return {
    projectSummary: signals.projectSummary,
    projectType: signals.projectType,
    targetUser: signals.targetUser !== "unknown" ? signals.targetUser : "broad-audience",
    coreProblem: signals.coreProblem,
    productShape: signals.productShape !== "unknown" ? signals.productShape : "web-app",
    aiRole: signals.aiRole,
    hasAiFeatures: signals.hasAiFeatures,
    deliveryPreference: signals.deliveryPreference !== "unknown" ? signals.deliveryPreference : "mvp",
    platform: signals.platform !== "unknown" ? signals.platform : "web",
    constraints: signals.constraints,
    assumptions: confidence.assumptions,
    confidenceTier: confidence.tier,
    confidenceScore: confidence.ratio,
    questionCount: answers.length,
    answers: answers.map((a) => ({ category: a.category, text: a.text })),
  };
}

// ─── Main Controller ───────────────────────────────────────────

export class PopupFlowController {
  private captureEngine = new IntentCaptureEngine();
  private questionBuilder = new QuestionBuilder();
  private confidenceScorer = new IntentConfidenceScorer();
  private config: Required<PopupFlowConfig>;

  constructor(config?: PopupFlowConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the popup flow. Returns the first (open) question.
   */
  start(): PopupFlowStartResult {
    const firstQuestion = this.questionBuilder.buildFirstQuestion(this.config.maxQuestions);
    const signals = createEmptySignals();

    const state: PopupFlowState = {
      phase: "active",
      currentQuestion: firstQuestion,
      questionIndex: 0,
      maxQuestions: this.config.maxQuestions,
      answers: [],
      signals,
      confidence: null,
      startedAt: Date.now(),
      completedAt: null,
    };

    return { question: firstQuestion, state };
  }

  /**
   * Process a user answer and return the next action.
   */
  answer(state: PopupFlowState, answerText: string): PopupFlowAnswerResult {
    if (state.phase !== "active" || !state.currentQuestion) {
      throw new Error("Cannot process answer: flow is not active.");
    }

    const trimmedAnswer = answerText.trim();
    if (trimmedAnswer.length === 0) {
      throw new Error("Cannot process empty answer.");
    }

    // 1. Record the answer
    const answer: PopupAnswer = {
      questionId: state.currentQuestion.id,
      category: state.currentQuestion.category,
      text: trimmedAnswer,
      answeredAt: Date.now(),
    };
    const updatedAnswers = [...state.answers, answer];

    // 2. Extract signals from the answer
    const captureInput: CaptureInput = {
      answer: trimmedAnswer,
      questionCategory: state.currentQuestion.category,
      previousSignals: state.signals,
      questionIndex: state.questionIndex,
    };
    const extraction = this.captureEngine.extract(captureInput);

    // 3. Score confidence
    const confidence = this.confidenceScorer.score(
      extraction.signals,
      state.questionIndex,
      state.maxQuestions
    );

    // 4. Determine next action
    const nextIndex = state.questionIndex + 1;
    const shouldStop =
      confidence.shouldStop ||
      nextIndex >= state.maxQuestions ||
      this.questionBuilder.shouldSynthesize(extraction.signals, nextIndex, state.maxQuestions);

    // 5. Build next question or complete
    let nextQuestion: PopupQuestion | null = null;
    let summary: IntentSummary | null = null;
    let completed = false;
    let newPhase: FlowPhase = "active";

    if (shouldStop) {
      // Build final confidence with assumptions for remaining gaps
      const finalConfidence = this.confidenceScorer.score(
        extraction.signals,
        nextIndex,
        state.maxQuestions
      );
      summary = buildIntentSummary(extraction.signals, finalConfidence, updatedAnswers);
      completed = true;
      newPhase = "completed";
      nextQuestion = null;
    } else {
      // Build next adaptive question
      const builderInput: QuestionBuilderInput = {
        signals: extraction.signals,
        questionIndex: nextIndex,
        maxQuestions: this.config.maxQuestions,
        previousCategory: state.currentQuestion.category,
        previousAnswer: trimmedAnswer,
      };
      nextQuestion = this.questionBuilder.build(builderInput);
    }

    const newState: PopupFlowState = {
      phase: newPhase,
      currentQuestion: nextQuestion,
      questionIndex: nextIndex,
      maxQuestions: this.config.maxQuestions,
      answers: updatedAnswers,
      signals: extraction.signals,
      confidence,
      startedAt: state.startedAt,
      completedAt: completed ? Date.now() : null,
    };

    return {
      nextQuestion,
      state: newState,
      summary,
      completed,
      extraction,
      confidence,
    };
  }

  /**
   * Allow the user to skip remaining questions.
   * Produces a summary with assumptions for all gaps.
   */
  skip(state: PopupFlowState): { state: PopupFlowState; summary: IntentSummary } {
    const finalConfidence = this.confidenceScorer.score(
      state.signals,
      state.questionIndex,
      state.maxQuestions
    );
    const summary = buildIntentSummary(state.signals, finalConfidence, state.answers);

    const newState: PopupFlowState = {
      ...state,
      phase: "stopped",
      currentQuestion: null,
      completedAt: Date.now(),
      confidence: finalConfidence,
    };

    return { state: newState, summary };
  }

  /**
   * Allow the user to go back and revise the last answer.
   * Pops the last answer and re-asks the previous question.
   */
  goBack(state: PopupFlowState): PopupFlowState {
    if (state.answers.length === 0) {
      return state;
    }

    const previousAnswers = state.answers.slice(0, -1);
    const previousIndex = Math.max(0, state.questionIndex - 1);

    // Rebuild signals from remaining answers
    let rebuiltSignals = createEmptySignals();
    for (const ans of previousAnswers) {
      const captureInput: CaptureInput = {
        answer: ans.text,
        questionCategory: ans.category,
        previousSignals: rebuiltSignals,
        questionIndex: previousIndex,
      };
      const result = this.captureEngine.extract(captureInput);
      rebuiltSignals = result.signals;
    }

    // Rebuild the question for this position
    const lastAnswer = previousAnswers.length > 0 ? previousAnswers[previousAnswers.length - 1]! : undefined;
    const prevCategory = lastAnswer?.category ?? "";
    const prevAnswer = lastAnswer?.text ?? "";

    let currentQuestion: PopupQuestion | null = null;
    if (previousIndex < this.config.maxQuestions) {
      if (previousIndex === 0) {
        currentQuestion = this.questionBuilder.buildFirstQuestion(this.config.maxQuestions);
      } else {
        const builderInput: QuestionBuilderInput = {
          signals: rebuiltSignals,
          questionIndex: previousIndex,
          maxQuestions: this.config.maxQuestions,
          previousCategory: prevCategory,
          previousAnswer: prevAnswer,
        };
        currentQuestion = this.questionBuilder.build(builderInput);
      }
    }

    return {
      ...state,
      phase: "active",
      currentQuestion,
      questionIndex: previousIndex,
      answers: previousAnswers,
      signals: rebuiltSignals,
      confidence: null,
      completedAt: null,
    };
  }

  /**
   * Get a progress summary for display.
   */
  getProgress(state: PopupFlowState): {
    current: number;
    max: number;
    percentage: number;
    label: string;
  } {
    const current = state.answers.length;
    const max = this.config.maxQuestions;
    const percentage = Math.round((current / max) * 100);

    let label: string;
    if (current === 0) {
      label = "ابدأ بمشاركة فكرتك";
    } else if (current < max - 1) {
      label = `خطوة ${current} من ${max}`;
    } else {
      label = "آخر سؤال";
    }

    return { current, max, percentage, label };
  }

  /**
   * Check if the flow can still accept more questions.
   */
  canContinue(state: PopupFlowState): boolean {
    return state.phase === "active" && state.questionIndex < this.config.maxQuestions;
  }
}
