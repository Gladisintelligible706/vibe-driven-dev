import type { OnboardingAssessment } from "../intelligence/onboarding-engine.js";
import type { EventTopologyAdvice } from "../intelligence/event-topology-advisor.js";
import type { ModelEscalationAdvice } from "../intelligence/model-escalation-advisor.js";
import type { ProviderRecommendation } from "../intelligence/provider-selector.js";
import type { StackRecommendation } from "../intelligence/stack-selector.js";
import { ConfidenceEngine, type ConfidenceAssessment } from "./confidence-engine.js";
import { QuestionEngine, type QuestionEngineOutput, type AdaptiveQuestion } from "./question-engine.js";
import { CheckpointPolicy, type PauseDecision, type CheckpointPolicyInput } from "./checkpoint-policy.js";
import { NextStepEngine, type NextStepRecommendation, type MissionPlan } from "./next-step-engine.js";

export type AutopilotMission =
  | "capture-intent"
  | "build-planning-package"
  | "lock-technical-direction"
  | "build-prd-package"
  | "prepare-execution-handoff";

export type AutopilotCheckpoint =
  | "intent-captured"
  | "planning-package-complete"
  | "technical-strategy-locked"
  | "detail-package-complete"
  | "prd-threshold-reached";

export type AutopilotMode = "guided" | "autopilot" | "expert";

export interface AutopilotStep {
  command: "/vibe.plan" | "/vibe.research" | "/vibe.blueprint" | "/vibe.detail" | "/vibe.scaffold" | "/vibe.qa";
  reason: string;
}

export interface AutopilotPlan {
  mode: AutopilotMode;
  mission: AutopilotMission;
  checkpointBefore: AutopilotCheckpoint;
  checkpointAfter: AutopilotCheckpoint;
  continueAutomatically: boolean;
  confidence: ConfidenceAssessment;
  summary: string;
  steps: AutopilotStep[];
  humanNextStep: string[];
  questions: AdaptiveQuestion[];
  pauseDecision: PauseDecision | null;
  missionPlan: MissionPlan | null;
}

export type CheckpointApprovalType =
  | "stack"
  | "provider"
  | "events"
  | "model-escalation";

export interface CheckpointApproval {
  type: CheckpointApprovalType;
  status: "not-needed" | "review" | "accepted" | "deferred";
  requiresApproval: boolean;
  summary: string;
  recommendedAction: string;
}

export interface StageCheckpointSummary {
  checkpoint: AutopilotCheckpoint;
  mission: AutopilotMission;
  summary: string;
  artifacts: string[];
  approvals: CheckpointApproval[];
  humanNextStep: string[];
  pauseDecision: PauseDecision | null;
  whatWasCompleted: string[];
  whatWasLearned: string[];
  whatRemainsOpen: string[];
  nextBestStep: string;
  requiresApproval: boolean;
}

export interface AutopilotInput {
  onboarding: OnboardingAssessment;
  currentStage: "init" | "plan" | "research" | "blueprint" | "detail" | "scaffold" | "qa" | "handoff";
  currentStatus?: "idle" | "active" | "halted" | "failed" | "handoff-ready" | "completed";
  previousAnswers?: Record<string, string>;
  artifactsPresent?: string[];
  hasBlockers?: boolean;
  contradictions?: string[];
}

export interface StageCheckpointInput {
  command: "/vibe.blueprint" | "/vibe.detail" | "/vibe.scaffold";
  artifactsCreated: string[];
  stack?: StackRecommendation;
  provider?: ProviderRecommendation;
  events?: EventTopologyAdvice;
  modelEscalation?: ModelEscalationAdvice;
  nextRecommendedCommand?: string | null;
  blockers?: string[];
  warnings?: string[];
  qualityGateFailures?: string[];
}

function inferCheckpoint(stage: AutopilotInput["currentStage"]): AutopilotCheckpoint {
  if (stage === "research") {
    return "planning-package-complete";
  }

  if (stage === "blueprint" || stage === "detail" || stage === "scaffold" || stage === "qa" || stage === "handoff") {
    return "technical-strategy-locked";
  }

  return "intent-captured";
}

function buildSteps(input: AutopilotInput, confidence: ConfidenceAssessment): AutopilotStep[] {
  const steps: AutopilotStep[] = [];

  if (!confidence.canContinuePlanningPackage) {
    return steps;
  }

  if (input.currentStage === "init") {
    steps.push(
      {
        command: "/vibe.plan",
        reason: "Turn the captured idea into a scoped planning package."
      },
      {
        command: "/vibe.research",
        reason: "Ground the project with assumptions, risks, and a first research pass."
      }
    );
  } else if (input.currentStage === "plan") {
    steps.push({
      command: "/vibe.research",
      reason: "Complete the planning package with a first research pass."
    });
  }

  if (confidence.canContinueBlueprint && (input.currentStage === "init" || input.currentStage === "plan" || input.currentStage === "research")) {
    steps.push({
      command: "/vibe.blueprint",
      reason: "The idea is specific enough to lock a first technical direction."
    });
  }

  return steps;
}

function inferMission(steps: AutopilotStep[]): AutopilotMission {
  if (steps.some((step) => step.command === "/vibe.blueprint")) {
    return "lock-technical-direction";
  }

  if (steps.length > 0) {
    return "build-planning-package";
  }

  return "capture-intent";
}

function inferCheckpointAfter(steps: AutopilotStep[], current: AutopilotCheckpoint): AutopilotCheckpoint {
  if (steps.some((step) => step.command === "/vibe.blueprint")) {
    return "technical-strategy-locked";
  }

  if (steps.some((step) => step.command === "/vibe.research")) {
    return "planning-package-complete";
  }

  return current;
}

function buildSummary(mission: AutopilotMission, steps: AutopilotStep[]): string {
  if (steps.length === 0) {
    return "Autopilot captured the idea but should stop at the current checkpoint before it continues.";
  }

  const labels = steps.map((step) => step.command).join(" -> ");

  if (mission === "lock-technical-direction") {
    return `Autopilot can complete the planning package and continue into technical strategy: ${labels}.`;
  }

  return `Autopilot can continue through the planning package: ${labels}.`;
}

function buildHumanNextStep(steps: AutopilotStep[], confidence: ConfidenceAssessment): string[] {
  if (steps.length === 0) {
    return [
      "Answer the next onboarding question so the system can safely continue.",
      "Review the assumptions the system already inferred before moving on."
    ];
  }

  const nextActions = [
    `Autopilot will continue with ${steps.map((step) => step.command).join(", ")}.`,
    "The system will stop at the next checkpoint and summarize what it created."
  ];

  if (confidence.canContinueBlueprint) {
    nextActions.push("Expect a technical-direction checkpoint after blueprint completes.");
  }

  return nextActions;
}

function buildWhatWasCompleted(command: StageCheckpointInput["command"], artifacts: string[]): string[] {
  const completed: string[] = [];

  if (command === "/vibe.blueprint") {
    completed.push("Technical direction has been established.");
    completed.push("Architecture baseline and system boundaries are defined.");
  } else if (command === "/vibe.detail") {
    completed.push("Implementation structure is ready.");
    completed.push("Validation plan and execution notes are in place.");
  } else {
    completed.push("PRD generation is complete.");
    completed.push("Feature breakdown and implementation plan are ready.");
  }

  if (artifacts.length > 0) {
    completed.push(`Created ${artifacts.length} artifacts: ${artifacts.slice(0, 5).join(", ")}${artifacts.length > 5 ? "..." : ""}.`);
  }

  return completed;
}

function buildWhatWasLearned(
  stack?: StackRecommendation,
  provider?: ProviderRecommendation,
  events?: EventTopologyAdvice
): string[] {
  const learned: string[] = [];

  if (stack) {
    learned.push(`Recommended stack: ${stack.recommendedStack.frontend} + ${stack.recommendedStack.backend} + ${stack.recommendedStack.database}.`);
  }

  if (provider) {
    learned.push(`AI provider direction: ${provider.topProvider} with ${provider.topModel}.`);
  }

  if (events) {
    if (events.relevance.requiresEventArchitecture) {
      learned.push(`Event architecture is justified: ${events.relevance.summary}`);
    } else {
      learned.push("Event architecture is not needed yet. Keep handling simple.");
    }
  }

  return learned;
}

function buildWhatRemainsOpen(
  approvals: CheckpointApproval[],
  blockers: string[]
): string[] {
  const open: string[] = [];

  const pendingApprovals = approvals.filter((a) => a.status === "review");
  for (const approval of pendingApprovals) {
    open.push(`Pending approval: ${approval.type} — ${approval.summary}`);
  }

  for (const blocker of blockers) {
    open.push(`Blocker: ${blocker}`);
  }

  return open;
}

export class AutopilotConductor {
  private questionEngine = new QuestionEngine();
  private checkpointPolicy = new CheckpointPolicy();
  private nextStepEngine = new NextStepEngine();

  plan(input: AutopilotInput): AutopilotPlan {
    const confidence = new ConfidenceEngine().assess({
      onboarding: input.onboarding
    });
    const checkpointBefore = inferCheckpoint(input.currentStage);
    const steps = buildSteps(input, confidence);
    const mission = inferMission(steps);
    const checkpointAfter = inferCheckpointAfter(steps, checkpointBefore);

    // Build adaptive questions if needed
    let questions: AdaptiveQuestion[] = [];
    if (input.onboarding.needsMoreAnswers) {
      const questionResult = this.questionEngine.buildQuestions({
        seed: input.onboarding.seed,
        assessment: input.onboarding,
        previousAnswers: input.previousAnswers ?? {},
        mode: input.onboarding.mode
      });
      questions = questionResult.questions;
    }

    // Evaluate checkpoint pause decision
    const pauseInput: CheckpointPolicyInput = {
      checkpoint: checkpointBefore,
      mission,
      confidence: confidence.level,
      confidenceDecision: confidence.decision,
      hasStackApproval: false,
      hasProviderApproval: false,
      hasEventApproval: false,
      hasModelEscalationApproval: false,
      hasBlockers: input.hasBlockers ?? false,
      hasWarnings: false,
      warningsCount: 0,
      hasQualityGateFailure: false,
      artifactsCreated: input.artifactsPresent ?? [],
      contradictions: input.contradictions ?? [],
      mode: input.onboarding.mode
    };
    const pauseDecision = this.checkpointPolicy.evaluate(pauseInput);

    // Build mission plan
    const missionPlan = this.nextStepEngine.buildMissionPlan({
      currentStage: input.currentStage,
      currentStatus: input.currentStatus ?? "active",
      confidence,
      artifactsPresent: input.artifactsPresent ?? [],
      hasBlockers: input.hasBlockers ?? false,
      mode: input.onboarding.mode
    });

    const continueAutomatically =
      steps.length > 0 &&
      input.onboarding.mode === "autopilot" &&
      pauseDecision.verdict === "continue";

    return {
      mode: input.onboarding.mode,
      mission,
      checkpointBefore,
      checkpointAfter,
      continueAutomatically,
      confidence,
      summary: buildSummary(mission, steps),
      steps,
      humanNextStep: buildHumanNextStep(steps, confidence),
      questions,
      pauseDecision,
      missionPlan
    };
  }

  summarizeStage(input: StageCheckpointInput): StageCheckpointSummary {
    const approvals: CheckpointApproval[] = [];

    if (input.stack) {
      approvals.push({
        type: "stack",
        status: "review",
        requiresApproval: true,
        summary: `Recommended stack: ${input.stack.recommendedStack.frontend} + ${input.stack.recommendedStack.backend} + ${input.stack.recommendedStack.database}.`,
        recommendedAction: "Review and confirm the proposed application stack before deeper execution."
      });
    }

    if (input.provider) {
      approvals.push({
        type: "provider",
        status: "review",
        requiresApproval: true,
        summary: `Recommended AI provider path: ${input.provider.topProvider} using ${input.provider.topModel}.`,
        recommendedAction: "Review and confirm the project AI provider direction before implementation locks in."
      });
    }

    if (input.events) {
      approvals.push({
        type: "events",
        status: input.events.relevance.requiresEventArchitecture ? "review" : "not-needed",
        requiresApproval: input.events.relevance.requiresEventArchitecture,
        summary: input.events.relevance.summary,
        recommendedAction: input.events.relevance.requiresEventArchitecture
          ? "Review whether event architecture should be locked now."
          : "No event architecture approval is needed yet."
      });
    }

    if (input.modelEscalation) {
      approvals.push({
        type: "model-escalation",
        status:
          input.modelEscalation.decision === "accepted"
            ? "accepted"
            : input.modelEscalation.decision === "deferred"
            ? "deferred"
            : "not-needed",
        requiresApproval: input.modelEscalation.shouldRecommend,
        summary: input.modelEscalation.summary,
        recommendedAction: input.modelEscalation.handoffPrompt
      });
    }

    const checkpoint =
      input.command === "/vibe.blueprint"
        ? "technical-strategy-locked" as const
        : input.command === "/vibe.detail"
        ? "detail-package-complete" as const
        : "prd-threshold-reached" as const;
    const mission =
      input.command === "/vibe.scaffold"
        ? "build-prd-package" as const
        : "lock-technical-direction" as const;
    const humanNextStep = approvals
      .filter((approval) => approval.requiresApproval || approval.status === "deferred")
      .map((approval) => approval.recommendedAction);

    if (humanNextStep.length === 0 && input.nextRecommendedCommand) {
      humanNextStep.push(`Continue to ${input.nextRecommendedCommand}.`);
    }

    // Evaluate pause decision
    const pauseInput: CheckpointPolicyInput = {
      checkpoint,
      mission,
      confidence: "high",
      confidenceDecision: "checkpoint",
      hasStackApproval: input.stack !== undefined,
      hasProviderApproval: input.provider !== undefined,
      hasEventApproval: input.events !== undefined,
      hasModelEscalationApproval: input.modelEscalation !== undefined,
      hasBlockers: (input.blockers?.length ?? 0) > 0,
      hasWarnings: (input.warnings?.length ?? 0) > 0,
      warningsCount: input.warnings?.length ?? 0,
      hasQualityGateFailure: (input.qualityGateFailures?.length ?? 0) > 0,
      artifactsCreated: input.artifactsCreated,
      contradictions: [],
      mode: "autopilot"
    };
    const pauseDecision = this.checkpointPolicy.evaluate(pauseInput);

    const whatWasCompleted = buildWhatWasCompleted(input.command, input.artifactsCreated);
    const whatWasLearned = buildWhatWasLearned(input.stack, input.provider, input.events);
    const whatRemainsOpen = buildWhatRemainsOpen(approvals, input.blockers ?? []);

    const summary =
      input.command === "/vibe.blueprint"
        ? "Blueprint completed. The system now has a first technical direction and can surface the highest-impact approvals."
        : input.command === "/vibe.detail"
        ? "Detail completed. The system now has enough implementation structure to expose approval-sensitive technical decisions."
        : "Scaffold completed. The PRD threshold has been reached and the remaining user choice is mostly about quality depth and approval-sensitive direction.";

    const nextBestStep = input.nextRecommendedCommand
      ? `The next best step is ${input.nextRecommendedCommand}.`
      : "No further automatic steps are available. Review the checkpoint summary and approve pending decisions.";

    const requiresApproval = pauseDecision.requiresHumanApproval ||
      approvals.some((a) => a.requiresApproval && a.status === "review");

    return {
      checkpoint,
      mission,
      summary,
      artifacts: input.artifactsCreated,
      approvals,
      humanNextStep,
      pauseDecision,
      whatWasCompleted,
      whatWasLearned,
      whatRemainsOpen,
      nextBestStep,
      requiresApproval
    };
  }

  generateCheckpointSummary(
    checkpoint: AutopilotCheckpoint,
    mission: AutopilotMission,
    artifactsCreated: string[],
    confidence: ConfidenceAssessment,
    mode: AutopilotMode
  ): string {
    const definition = this.checkpointPolicy.getCheckpointDefinition(checkpoint);

    const lines: string[] = [
      `## Checkpoint: ${definition.label}`,
      "",
      definition.description,
      "",
      `**Mission:** ${mission}`,
      `**Confidence:** ${confidence.level} (${confidence.decision})`,
      `**Mode:** ${mode}`,
      ""
    ];

    if (artifactsCreated.length > 0) {
      lines.push("### Artifacts Created");
      for (const artifact of artifactsCreated) {
        lines.push(`- ${artifact}`);
      }
      lines.push("");
    }

    if (confidence.reasons.length > 0) {
      lines.push("### Confidence Signals");
      for (const reason of confidence.reasons) {
        lines.push(`- ${reason}`);
      }
      lines.push("");
    }

    if (!confidence.assumptionSafe) {
      lines.push("> **Warning:** The system has low confidence. Assumptions may not be safe.");
      lines.push("");
    }

    return lines.join("\n");
  }
}
