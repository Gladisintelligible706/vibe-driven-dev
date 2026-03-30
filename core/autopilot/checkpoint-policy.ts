import type { AutopilotCheckpoint, AutopilotMission, CheckpointApprovalType } from "./conductor.js";
import type { ConfidenceLevel, ConfidenceDecision } from "./confidence-engine.js";

export type PauseReason =
  | "high-impact-decision"
  | "confidence-low"
  | "contradictory-info"
  | "quality-gate-failed"
  | "user-takeover"
  | "security-ambiguity"
  | "event-architecture-ambiguity"
  | "stack-disputed"
  | "provider-disputed"
  | "blocking-uncertainty"
  | "none";

export type AutoContinueVerdict = "continue" | "pause" | "stop";

export interface CheckpointCondition {
  checkpoint: AutopilotCheckpoint;
  label: string;
  description: string;
  requiredApprovals: CheckpointApprovalType[];
  autoContinueThreshold: ConfidenceLevel;
  alwaysPause: boolean;
}

export interface PauseDecision {
  verdict: AutoContinueVerdict;
  reasons: PauseReason[];
  explanation: string;
  suggestedAction: string;
  requiresHumanApproval: boolean;
  approvalTypes: CheckpointApprovalType[];
}

export interface CheckpointPolicyInput {
  checkpoint: AutopilotCheckpoint;
  mission: AutopilotMission;
  confidence: ConfidenceLevel;
  confidenceDecision: ConfidenceDecision;
  hasStackApproval: boolean;
  hasProviderApproval: boolean;
  hasEventApproval: boolean;
  hasModelEscalationApproval: boolean;
  hasBlockers: boolean;
  hasWarnings: boolean;
  warningsCount: number;
  hasQualityGateFailure: boolean;
  artifactsCreated: string[];
  contradictions: string[];
  mode: "guided" | "autopilot" | "expert";
}

const CHECKPOINT_DEFINITIONS: CheckpointCondition[] = [
  {
    checkpoint: "intent-captured",
    label: "Intent Captured",
    description: "The project idea, target user, and core problem are clear enough.",
    requiredApprovals: [],
    autoContinueThreshold: "medium",
    alwaysPause: false
  },
  {
    checkpoint: "planning-package-complete",
    label: "Planning Package Complete",
    description: "The project has been scoped, researched, and risks identified.",
    requiredApprovals: [],
    autoContinueThreshold: "medium",
    alwaysPause: false
  },
  {
    checkpoint: "technical-strategy-locked",
    label: "Technical Strategy Locked",
    description: "The stack, provider, and major architecture direction are stable.",
    requiredApprovals: ["stack", "provider"],
    autoContinueThreshold: "high",
    alwaysPause: true
  },
  {
    checkpoint: "detail-package-complete",
    label: "Detail Package Complete",
    description: "Implementation structure is ready for scaffold.",
    requiredApprovals: ["stack", "provider"],
    autoContinueThreshold: "high",
    alwaysPause: false
  },
  {
    checkpoint: "prd-threshold-reached",
    label: "PRD Threshold Reached",
    description: "The PRD is strong enough to enter execution.",
    requiredApprovals: ["stack", "provider", "model-escalation"],
    autoContinueThreshold: "high",
    alwaysPause: true
  }
];

function getCheckpointDefinition(checkpoint: AutopilotCheckpoint): CheckpointCondition {
  return CHECKPOINT_DEFINITIONS.find((c) => c.checkpoint === checkpoint) ?? CHECKPOINT_DEFINITIONS[0]!;
}

function confidenceMeetsThreshold(
  level: ConfidenceLevel,
  threshold: ConfidenceLevel
): boolean {
  const order: ConfidenceLevel[] = ["low", "medium", "high"];
  return order.indexOf(level) >= order.indexOf(threshold);
}

function collectPauseReasons(input: CheckpointPolicyInput): PauseReason[] {
  const reasons: PauseReason[] = [];

  if (input.hasBlockers) {
    reasons.push("high-impact-decision");
  }

  if (input.confidence === "low") {
    reasons.push("confidence-low");
  }

  if (input.contradictions.length > 0) {
    reasons.push("contradictory-info");
  }

  if (input.hasQualityGateFailure) {
    reasons.push("quality-gate-failed");
  }

  if (input.confidenceDecision === "ask") {
    reasons.push("blocking-uncertainty");
  }

  // Check for missing approvals
  const definition = getCheckpointDefinition(input.checkpoint);

  if (definition.requiredApprovals.includes("stack") && !input.hasStackApproval && input.mode !== "expert") {
    reasons.push("stack-disputed");
  }

  if (definition.requiredApprovals.includes("provider") && !input.hasProviderApproval && input.mode !== "expert") {
    reasons.push("provider-disputed");
  }

  if (definition.requiredApprovals.includes("events") && !input.hasEventApproval) {
    reasons.push("event-architecture-ambiguity");
  }

  if (definition.requiredApprovals.includes("model-escalation") && !input.hasModelEscalationApproval) {
    reasons.push("high-impact-decision");
  }

  if (input.hasWarnings && input.warningsCount > 3) {
    reasons.push("security-ambiguity");
  }

  return reasons;
}

export class CheckpointPolicy {
  evaluate(input: CheckpointPolicyInput): PauseDecision {
    const definition = getCheckpointDefinition(input.checkpoint);
    const reasons = collectPauseReasons(input);

    // Expert mode: almost never pause unless there are blockers
    if (input.mode === "expert") {
      if (input.hasBlockers || input.hasQualityGateFailure) {
        return {
          verdict: "stop",
          reasons: reasons.length > 0 ? reasons : ["high-impact-decision"],
          explanation: "Expert mode paused due to a hard blocker that cannot be bypassed.",
          suggestedAction: "Resolve the blocker manually, then continue.",
          requiresHumanApproval: true,
          approvalTypes: definition.requiredApprovals
        };
      }

      return {
        verdict: "continue",
        reasons: ["none"],
        explanation: "Expert mode continues without approval gates.",
        suggestedAction: "Continue to next step.",
        requiresHumanApproval: false,
        approvalTypes: []
      };
    }

    // Always-pause checkpoints
    if (definition.alwaysPause) {
      return {
        verdict: "pause",
        reasons: reasons.length > 0 ? reasons : ["high-impact-decision"],
        explanation: `Checkpoint "${definition.label}" always requires review before continuing.`,
        suggestedAction: definition.description,
        requiresHumanApproval: true,
        approvalTypes: definition.requiredApprovals
      };
    }

    // Hard blockers: always stop
    if (input.hasBlockers || input.hasQualityGateFailure) {
      return {
        verdict: "stop",
        reasons,
        explanation: "Hard blockers or quality gate failures require resolution before continuing.",
        suggestedAction: "Review blockers and quality gate results, then retry.",
        requiresHumanApproval: true,
        approvalTypes: definition.requiredApprovals
      };
    }

    // Blocking uncertainty: pause and ask
    if (input.confidenceDecision === "ask") {
      return {
        verdict: "pause",
        reasons,
        explanation: "The system does not have enough confidence to continue safely.",
        suggestedAction: "Answer the next question to unblock progress.",
        requiresHumanApproval: true,
        approvalTypes: []
      };
    }

    // Confidence below threshold
    if (!confidenceMeetsThreshold(input.confidence, definition.autoContinueThreshold)) {
      return {
        verdict: "pause",
        reasons,
        explanation: `Confidence "${input.confidence}" is below the "${definition.autoContinueThreshold}" threshold for this checkpoint.`,
        suggestedAction: "Review the current state and provide additional input.",
        requiresHumanApproval: true,
        approvalTypes: definition.requiredApprovals
      };
    }

    // Contradictions detected
    if (input.contradictions.length > 0) {
      return {
        verdict: "pause",
        reasons,
        explanation: "The system detected contradictory information that needs resolution.",
        suggestedAction: `Resolve contradictions: ${input.contradictions.join("; ")}`,
        requiresHumanApproval: true,
        approvalTypes: []
      };
    }

    // Missing required approvals (guided mode)
    const missingApprovals = definition.requiredApprovals.filter((approval) => {
      switch (approval) {
        case "stack":
          return !input.hasStackApproval;
        case "provider":
          return !input.hasProviderApproval;
        case "events":
          return !input.hasEventApproval;
        case "model-escalation":
          return !input.hasModelEscalationApproval;
        default:
          return false;
      }
    });

    if (missingApprovals.length > 0 && input.mode === "guided") {
      return {
        verdict: "pause",
        reasons,
        explanation: `Missing required approvals: ${missingApprovals.join(", ")}.`,
        suggestedAction: "Review and approve the pending decisions.",
        requiresHumanApproval: true,
        approvalTypes: missingApprovals
      };
    }

    // All clear: continue
    return {
      verdict: "continue",
      reasons: ["none"],
      explanation: "All checkpoint conditions are met. Safe to continue.",
      suggestedAction: "Continue to next mission step.",
      requiresHumanApproval: false,
      approvalTypes: []
    };
  }

  getCheckpointDefinition(checkpoint: AutopilotCheckpoint): CheckpointCondition {
    return getCheckpointDefinition(checkpoint);
  }

  getAllCheckpoints(): CheckpointCondition[] {
    return [...CHECKPOINT_DEFINITIONS];
  }
}
