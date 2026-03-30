/**
 * Popup Flow Integration
 *
 * Bridges the Intent Capture Popups system with the existing
 * Autopilot Conductor and Router Engine. Converts popup flow
 * output into OnboardingSeed format that the rest of VDD expects.
 */

import { PopupFlowController, type IntentSummary, type PopupFlowState, type PopupFlowConfig } from "./popup-flow-controller.js";
import type { OnboardingSeed, OnboardingProjectType, DeliveryPreference } from "../intelligence/onboarding-engine.js";

// ─── Types ─────────────────────────────────────────────────────

export interface PopupIntegrationResult {
  started: boolean;
  completed: boolean;
  intentSummary: IntentSummary | null;
  seed: OnboardingSeed | null;
  flowState: PopupFlowState;
  currentQuestion: {
    id: string;
    text: string;
    category: string;
    choices: Array<{ label: string; value: string; description?: string }> | undefined;
    questionNumber: number;
    totalQuestions: number;
    progressLabel: string;
  } | null;
  message: string;
  assumptions: string[];
}

// ─── Helpers ───────────────────────────────────────────────────

function mapProjectType(input: string): OnboardingProjectType {
  switch (input) {
    case "saas": return "saas";
    case "internal-tool": return "internal-tool";
    case "content-site": return "content-site";
    case "wrapper-app": return "wrapper-app";
    default: return "mvp";
  }
}

function mapDeliveryPreference(input: string): DeliveryPreference {
  return input === "foundation" ? "foundation" : "mvp";
}

function intentSummaryToSeed(summary: IntentSummary): OnboardingSeed {
  return {
    projectType: mapProjectType(summary.projectType),
    targetUser: summary.targetUser,
    problemStatement: summary.coreProblem || summary.projectSummary,
    successDefinition: undefined,
    platform: summary.platform,
    hasAiFeatures: summary.hasAiFeatures,
    deliveryPreference: mapDeliveryPreference(summary.deliveryPreference),
    constraints: summary.constraints,
    assumptions: summary.assumptions,
  };
}

// ─── Integration Class ─────────────────────────────────────────

export class PopupFlowIntegration {
  private controller: PopupFlowController;
  private currentState: PopupFlowState | null = null;

  constructor(config?: PopupFlowConfig) {
    this.controller = new PopupFlowController(config);
  }

  /**
   * Start the popup flow. Called when /vibe.start is invoked
   * and the project state is empty or weak.
   */
  start(): PopupIntegrationResult {
    const { question, state } = this.controller.start();
    this.currentState = state;

    return {
      started: true,
      completed: false,
      intentSummary: null,
      seed: null,
      flowState: state,
      currentQuestion: {
        id: question.id,
        text: question.text,
        category: question.category,
        choices: question.choices,
        questionNumber: question.questionNumber,
        totalQuestions: question.totalQuestions,
        progressLabel: question.progressLabel,
      },
      message: question.text,
      assumptions: [],
    };
  }

  /**
   * Process a user answer within the popup flow.
   * Returns the next question or the completed intent summary.
   */
  processAnswer(answerText: string): PopupIntegrationResult {
    if (!this.currentState) {
      throw new Error("Popup flow not started. Call start() first.");
    }

    const result = this.controller.answer(this.currentState, answerText);
    this.currentState = result.state;

    if (result.completed && result.summary) {
      const seed = intentSummaryToSeed(result.summary);
      return {
        started: true,
        completed: true,
        intentSummary: result.summary,
        seed,
        flowState: result.state,
        currentQuestion: null,
        message: this.buildCompletionMessage(result.summary, result.confidence.assumptions),
        assumptions: result.confidence.assumptions,
      };
    }

    const q = result.nextQuestion;
    return {
      started: true,
      completed: false,
      intentSummary: null,
      seed: null,
      flowState: result.state,
      currentQuestion: q ? {
        id: q.id,
        text: q.text,
        category: q.category,
        choices: q.choices,
        questionNumber: q.questionNumber,
        totalQuestions: q.totalQuestions,
        progressLabel: q.progressLabel,
      } : null,
      message: q?.text ?? "Flow completed unexpectedly.",
      assumptions: result.confidence.assumptions,
    };
  }

  /**
   * Skip the remaining questions and produce a summary with assumptions.
   */
  skip(): PopupIntegrationResult {
    if (!this.currentState) {
      throw new Error("Popup flow not started. Call start() first.");
    }

    const { state, summary } = this.controller.skip(this.currentState);
    this.currentState = state;
    const seed = intentSummaryToSeed(summary);

    return {
      started: true,
      completed: true,
      intentSummary: summary,
      seed,
      flowState: state,
      currentQuestion: null,
      message: this.buildCompletionMessage(summary, summary.assumptions),
      assumptions: summary.assumptions,
    };
  }

  /**
   * Go back to the previous question.
   */
  goBack(): PopupIntegrationResult {
    if (!this.currentState) {
      throw new Error("Popup flow not started. Call start() first.");
    }

    const newState = this.controller.goBack(this.currentState);
    this.currentState = newState;

    const q = newState.currentQuestion;
    return {
      started: true,
      completed: false,
      intentSummary: null,
      seed: null,
      flowState: newState,
      currentQuestion: q ? {
        id: q.id,
        text: q.text,
        category: q.category,
        choices: q.choices,
        questionNumber: q.questionNumber,
        totalQuestions: q.totalQuestions,
        progressLabel: q.progressLabel,
      } : null,
      message: q?.text ?? "No more questions to go back to.",
      assumptions: [],
    };
  }

  /**
   * Get the current flow state (for persistence or inspection).
   */
  getState(): PopupFlowState | null {
    return this.currentState;
  }

  /**
   * Restore a previously saved flow state.
   */
  restoreState(state: PopupFlowState): void {
    this.currentState = state;
  }

  /**
   * Get progress information.
   */
  getProgress(): { current: number; max: number; percentage: number; label: string } | null {
    if (!this.currentState) return null;
    return this.controller.getProgress(this.currentState);
  }

  /**
   * Check if the flow is currently active.
   */
  isActive(): boolean {
    return this.currentState?.phase === "active";
  }

  // ─── Internal Helpers ────────────────────────────────────────

  private buildCompletionMessage(summary: IntentSummary, assumptions: string[]): string {
    const lines: string[] = [];

    lines.push("شكراً! فهمت فكرتك كويس. خليني ألخص:");
    lines.push("");
    lines.push(`- نوع المشروع: ${summary.projectType}`);
    lines.push(`- المستخدم المستهدف: ${summary.targetUser}`);
    lines.push(`- المشكلة الأساسية: ${summary.coreProblem.slice(0, 100)}`);
    if (summary.hasAiFeatures) {
      lines.push(`- دور الـ AI: ${summary.aiRole}`);
    }
    lines.push(`- أولوية البناء: ${summary.deliveryPreference === "mvp" ? "نسخة سريعة (MVP)" : "أساس قوي"}`);

    if (assumptions.length > 0) {
      lines.push("");
      lines.push("افتراضات تم عملها:");
      for (const assumption of assumptions) {
        lines.push(`- ${assumption}`);
      }
    }

    lines.push("");
    lines.push("هبدأ دلوقتي في تجهيز المشروع وبناء أول خطة.");

    return lines.join("\n");
  }
}
