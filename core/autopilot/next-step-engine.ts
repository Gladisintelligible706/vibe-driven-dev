import type { VddPublicCommand } from "../router/engine.js";
import type { AutopilotMission, AutopilotCheckpoint, AutopilotStep } from "./conductor.js";
import type { ConfidenceAssessment } from "./confidence-engine.js";

export type SpecialistAgent =
  | "orchestrator"
  | "planner"
  | "researcher"
  | "architect"
  | "detailer"
  | "qa-guardian"
  | "handoff-manager"
  | "onboarding-guide";

export interface NextStepRecommendation {
  command: VddPublicCommand;
  mission: AutopilotMission;
  reason: string;
  specialistAgent: SpecialistAgent;
  isBlocking: boolean;
  expectedArtifacts: string[];
  estimatedComplexity: "low" | "medium" | "high";
}

export interface MissionPlan {
  mission: AutopilotMission;
  steps: NextStepRecommendation[];
  currentStepIndex: number;
  checkpointBefore: AutopilotCheckpoint;
  checkpointAfter: AutopilotCheckpoint;
  summary: string;
  canAutoContinue: boolean;
}

export interface NextStepEngineInput {
  currentStage: "init" | "plan" | "research" | "blueprint" | "detail" | "scaffold" | "qa" | "handoff";
  currentStatus: "idle" | "active" | "halted" | "failed" | "handoff-ready" | "completed";
  confidence: ConfidenceAssessment;
  artifactsPresent: string[];
  hasBlockers: boolean;
  mode: "guided" | "autopilot" | "expert";
}

const STAGE_ORDER: NextStepEngineInput["currentStage"][] = [
  "init", "plan", "research", "blueprint", "detail", "scaffold", "qa", "handoff"
];

const STAGE_COMMAND_MAP: Record<string, VddPublicCommand> = {
  init: "/vibe.init",
  plan: "/vibe.plan",
  research: "/vibe.research",
  blueprint: "/vibe.blueprint",
  detail: "/vibe.detail",
  scaffold: "/vibe.scaffold",
  qa: "/vibe.qa",
  handoff: "/vibe.handoff-to-spec"
};

const STAGE_AGENT_MAP: Record<string, SpecialistAgent> = {
  init: "orchestrator",
  plan: "planner",
  research: "researcher",
  blueprint: "architect",
  detail: "detailer",
  scaffold: "orchestrator",
  qa: "qa-guardian",
  handoff: "handoff-manager"
};

const STAGE_ARTIFACTS_MAP: Record<string, string[]> = {
  plan: ["problem-statement.md", "scope.md", "success-definition.md"],
  research: ["research-summary.md", "risk-register.md", "assumptions-log.md"],
  blueprint: ["architecture-baseline.md", "system-boundaries.md", "analytics-outline.md"],
  detail: ["technical-detail.md", "validation-plan.md", "execution-notes.md"],
  scaffold: ["PRD.md", "Feature-Breakdown.md", "Implementation-Plan.md"],
  qa: ["qa-report.md", "go-no-go.md"],
  handoff: ["spec-handoff.md", "execution-entry-summary.md"]
};

type StageName = NextStepEngineInput["currentStage"];

function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as StageName);
}

function getNextStage(currentStage: string): StageName | null {
  const idx = getStageIndex(currentStage);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[idx + 1] ?? null;
}

function inferMissionFromStage(stage: string): AutopilotMission {
  switch (stage) {
    case "init":
    case "plan":
      return "build-planning-package";
    case "research":
      return "build-planning-package";
    case "blueprint":
    case "detail":
      return "lock-technical-direction";
    case "scaffold":
      return "build-prd-package";
    case "qa":
    case "handoff":
      return "prepare-execution-handoff";
    default:
      return "capture-intent";
  }
}

function inferCheckpointFromStage(stage: string): AutopilotCheckpoint {
  switch (stage) {
    case "init":
      return "intent-captured";
    case "plan":
    case "research":
      return "planning-package-complete";
    case "blueprint":
      return "technical-strategy-locked";
    case "detail":
      return "detail-package-complete";
    case "scaffold":
      return "prd-threshold-reached";
    default:
      return "intent-captured";
  }
}

function estimateComplexity(stage: string): "low" | "medium" | "high" {
  switch (stage) {
    case "init":
    case "plan":
      return "low";
    case "research":
    case "qa":
      return "medium";
    case "blueprint":
    case "detail":
    case "scaffold":
    case "handoff":
      return "high";
    default:
      return "medium";
  }
}

export class NextStepEngine {
  recommendNext(input: NextStepEngineInput): NextStepRecommendation | null {
    // If project is completed or failed, no next step
    if (input.currentStatus === "completed" || input.currentStatus === "failed") {
      return null;
    }

    // If handoff-ready, recommend handoff
    if (input.currentStatus === "handoff-ready") {
      return {
        command: "/vibe.handoff-to-spec",
        mission: "prepare-execution-handoff",
        reason: "Project is handoff-ready. Final packaging should proceed.",
        specialistAgent: "handoff-manager",
        isBlocking: false,
        expectedArtifacts: STAGE_ARTIFACTS_MAP.handoff ?? [],
        estimatedComplexity: "high"
      };
    }

    // If there are blockers and confidence is low, stay at current stage
    if (input.hasBlockers && input.confidence.level === "low") {
      const currentCommand = STAGE_COMMAND_MAP[input.currentStage] as VddPublicCommand;
      return {
        command: currentCommand ?? "/vibe.start",
        mission: "capture-intent",
        reason: "Blockers and low confidence require resolving the current stage before progressing.",
        specialistAgent: (STAGE_AGENT_MAP[input.currentStage] as SpecialistAgent) ?? "orchestrator",
        isBlocking: true,
        expectedArtifacts: [],
        estimatedComplexity: "low"
      };
    }

    // Get next stage
    const nextStage = getNextStage(input.currentStage);
    if (!nextStage) {
      return null;
    }

    const command = STAGE_COMMAND_MAP[nextStage] as VddPublicCommand;
    if (!command) {
      return null;
    }

    // Check if confidence allows progressing
    if (!input.confidence.canContinuePlanningPackage && nextStage === "plan") {
      return {
        command: "/vibe.start",
        mission: "capture-intent",
        reason: "Not enough confidence to enter planning. More onboarding needed.",
        specialistAgent: "onboarding-guide",
        isBlocking: true,
        expectedArtifacts: [],
        estimatedComplexity: "low"
      };
    }

    if (!input.confidence.canContinueBlueprint && (nextStage === "blueprint" || nextStage === "detail")) {
      // Fall back to the max stage confidence allows
      if (input.confidence.canContinuePlanningPackage) {
        return {
          command: "/vibe.research",
          mission: "build-planning-package",
          reason: "Confidence supports planning but not blueprint yet. Research should complete the planning package.",
          specialistAgent: "researcher",
          isBlocking: false,
          expectedArtifacts: STAGE_ARTIFACTS_MAP.research ?? [],
          estimatedComplexity: "medium"
        };
      }
    }

    return {
      command,
      mission: inferMissionFromStage(nextStage),
      reason: `Stage "${input.currentStage}" is complete. "${nextStage}" is the next canonical step.`,
      specialistAgent: (STAGE_AGENT_MAP[nextStage] as SpecialistAgent) ?? "orchestrator",
      isBlocking: false,
      expectedArtifacts: STAGE_ARTIFACTS_MAP[nextStage] ?? [],
      estimatedComplexity: estimateComplexity(nextStage)
    };
  }

  buildMissionPlan(input: NextStepEngineInput): MissionPlan {
    const mission = inferMissionFromStage(input.currentStage);
    const steps: NextStepRecommendation[] = [];
    const currentIdx = getStageIndex(input.currentStage);

    // Build steps from current stage forward (up to 3 steps)
    for (let i = currentIdx + 1; i < Math.min(currentIdx + 4, STAGE_ORDER.length); i++) {
      const stage = STAGE_ORDER[i];
      if (!stage) continue;

      const command = STAGE_COMMAND_MAP[stage] as VddPublicCommand;
      if (!command) continue;

      // Check if confidence allows this step
      if (stage === "blueprint" || stage === "detail") {
        if (!input.confidence.canContinueBlueprint) {
          break;
        }
      }

      steps.push({
        command,
        mission: inferMissionFromStage(stage),
        reason: `Progress to ${stage} stage.`,
        specialistAgent: (STAGE_AGENT_MAP[stage] as SpecialistAgent) ?? "orchestrator",
        isBlocking: false,
        expectedArtifacts: STAGE_ARTIFACTS_MAP[stage] ?? [],
        estimatedComplexity: estimateComplexity(stage)
      });
    }

    const checkpointBefore = inferCheckpointFromStage(input.currentStage);
    const lastStep = steps[steps.length - 1];
    const checkpointAfter = lastStep
      ? inferCheckpointFromStage(
          STAGE_ORDER.find((s) => STAGE_COMMAND_MAP[s] === lastStep.command) ?? "init"
        )
      : checkpointBefore;

    const canAutoContinue =
      input.mode === "autopilot" &&
      input.confidence.level !== "low" &&
      !input.hasBlockers &&
      steps.length > 0;

    const labels = steps.map((s) => s.command).join(" -> ");

    return {
      mission,
      steps,
      currentStepIndex: 0,
      checkpointBefore,
      checkpointAfter,
      summary: steps.length > 0
        ? `Autopilot mission "${mission}" can progress through: ${labels}.`
        : `Autopilot is at checkpoint "${checkpointBefore}" and should pause for review.`,
      canAutoContinue
    };
  }

  getExpectedArtifacts(stage: string): string[] {
    return STAGE_ARTIFACTS_MAP[stage] ?? [];
  }

  getSpecialistForStage(stage: string): SpecialistAgent {
    return (STAGE_AGENT_MAP[stage] as SpecialistAgent) ?? "orchestrator";
  }
}
