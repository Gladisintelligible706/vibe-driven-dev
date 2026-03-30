import type { OnboardingAssessment, OnboardingSeed } from "../intelligence/onboarding-engine.js";

export type ConfidenceDecision = "ask" | "continue" | "checkpoint";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface ConfidenceSignal {
  name: string;
  present: boolean;
  weight: number;
  description: string;
}

export interface AssumptionRisk {
  assumption: string;
  risk: "low" | "medium" | "high";
  canRevisit: boolean;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  decision: ConfidenceDecision;
  reasons: string[];
  assumptionSafe: boolean;
  canContinuePlanningPackage: boolean;
  canContinueBlueprint: boolean;
  score: number;
  maxScore: number;
  signals: ConfidenceSignal[];
  assumptionRisks: AssumptionRisk[];
  blockingUncertainties: string[];
}

export interface ConfidenceInput {
  onboarding: OnboardingAssessment;
}

function scoreSeedWithSignals(seed: OnboardingSeed): {
  score: number;
  maxScore: number;
  signals: ConfidenceSignal[];
} {
  const signals: ConfidenceSignal[] = [
    {
      name: "problem-statement",
      present: seed.problemStatement.trim().length >= 40,
      weight: 2,
      description: `Problem statement is ${seed.problemStatement.trim().length >= 40 ? "strong" : "weak"} (${seed.problemStatement.trim().length} chars).`
    },
    {
      name: "target-user",
      present: (seed.targetUser?.trim().length ?? 0) >= 8,
      weight: 1,
      description: `Target user is ${seed.targetUser ? "defined" : "missing"}.`
    },
    {
      name: "success-definition",
      present: (seed.successDefinition?.trim().length ?? 0) >= 24,
      weight: 1,
      description: `Success definition is ${seed.successDefinition && seed.successDefinition.trim().length >= 24 ? "clear" : "unclear"}.`
    },
    {
      name: "constraints",
      present: seed.constraints.length > 0,
      weight: 1,
      description: seed.constraints.length > 0
        ? `${seed.constraints.length} constraint(s) defined.`
        : "No constraints defined."
    },
    {
      name: "delivery-preference",
      present: seed.deliveryPreference === "foundation",
      weight: 1,
      description: `Delivery preference: ${seed.deliveryPreference}.`
    },
    {
      name: "ai-clarity",
      present: seed.hasAiFeatures || seed.projectType === "saas" || seed.projectType === "wrapper-app",
      weight: 1,
      description: seed.hasAiFeatures
        ? "AI features are part of the project."
        : "No AI features declared."
    },
    {
      name: "project-type",
      present: seed.projectType !== "mvp",
      weight: 1,
      description: `Project type: ${seed.projectType}.`
    },
    {
      name: "platform",
      present: (seed.platform?.trim().length ?? 0) > 0,
      weight: 0.5,
      description: `Platform: ${seed.platform ?? "not specified"}.`
    }
  ];

  const score = signals.reduce((acc, s) => acc + (s.present ? s.weight : 0), 0);
  const maxScore = signals.reduce((acc, s) => acc + s.weight, 0);

  return { score, maxScore, signals };
}

function buildAssumptionRisks(seed: OnboardingSeed): AssumptionRisk[] {
  const risks: AssumptionRisk[] = [];

  if (seed.projectType === "mvp") {
    risks.push({
      assumption: "Project type defaulted to MVP",
      risk: "medium",
      canRevisit: true
    });
  }

  if (!seed.targetUser) {
    risks.push({
      assumption: "Target user is unspecified",
      risk: "high",
      canRevisit: true
    });
  }

  if (seed.problemStatement.trim().length < 40) {
    risks.push({
      assumption: "Problem statement is too brief for confident planning",
      risk: "high",
      canRevisit: true
    });
  }

  if (!seed.successDefinition || seed.successDefinition.trim().length < 24) {
    risks.push({
      assumption: "Success definition is unclear",
      risk: "medium",
      canRevisit: true
    });
  }

  if (seed.deliveryPreference === "mvp") {
    risks.push({
      assumption: "MVP bias may skip important foundation work",
      risk: "low",
      canRevisit: true
    });
  }

  if (seed.constraints.length === 0) {
    risks.push({
      assumption: "No constraints defined — system assumes no deadline pressure",
      risk: "low",
      canRevisit: true
    });
  }

  return risks;
}

function buildBlockingUncertainties(seed: OnboardingSeed, signals: ConfidenceSignal[]): string[] {
  const blocking: string[] = [];

  const problemSignal = signals.find((s) => s.name === "problem-statement");
  if (problemSignal && !problemSignal.present) {
    blocking.push("Problem statement is too vague to begin planning.");
  }

  const userSignal = signals.find((s) => s.name === "target-user");
  if (userSignal && !userSignal.present) {
    blocking.push("Target user is undefined. Planning cannot proceed safely.");
  }

  if (seed.projectType === "mvp" && seed.problemStatement.trim().length < 60) {
    blocking.push("Project type is ambiguous. More detail is needed to select a stack.");
  }

  return blocking;
}

export class ConfidenceEngine {
  assess(input: ConfidenceInput): ConfidenceAssessment {
    const { onboarding } = input;
    const { score, maxScore, signals } = scoreSeedWithSignals(onboarding.seed);
    const assumptionRisks = buildAssumptionRisks(onboarding.seed);
    const blockingUncertainties = buildBlockingUncertainties(onboarding.seed, signals);
    const reasons: string[] = [];

    if (!onboarding.canInitializeState) {
      reasons.push("Intent capture is still incomplete.");
      return {
        level: "low",
        decision: "ask",
        reasons,
        assumptionSafe: false,
        canContinuePlanningPackage: false,
        canContinueBlueprint: false,
        score,
        maxScore,
        signals,
        assumptionRisks,
        blockingUncertainties
      };
    }

    if (score >= 5) {
      reasons.push("Intent capture is strong enough for the planning package.");
    }

    if (onboarding.canAutoRunBlueprint) {
      reasons.push("The idea is specific enough to continue into blueprint with a checkpointed summary.");
    }

    // Check for high-risk assumptions
    const highRiskAssumptions = assumptionRisks.filter((r) => r.risk === "high");
    const assumptionSafe = highRiskAssumptions.length === 0;

    if (!assumptionSafe) {
      reasons.push(`${highRiskAssumptions.length} high-risk assumption(s) detected.`);
    }

    if (onboarding.canAutoRunBlueprint) {
      return {
        level: "high",
        decision: assumptionSafe ? "checkpoint" : "continue",
        reasons,
        assumptionSafe,
        canContinuePlanningPackage: true,
        canContinueBlueprint: true,
        score,
        maxScore,
        signals,
        assumptionRisks,
        blockingUncertainties
      };
    }

    if (onboarding.canAutoRunEarlyJourney) {
      return {
        level: "medium",
        decision: "continue",
        reasons,
        assumptionSafe,
        canContinuePlanningPackage: true,
        canContinueBlueprint: false,
        score,
        maxScore,
        signals,
        assumptionRisks,
        blockingUncertainties
      };
    }

    reasons.push("The system should initialize state but not continue beyond a single guided checkpoint.");
    return {
      level: "medium",
      decision: "checkpoint",
      reasons,
      assumptionSafe,
      canContinuePlanningPackage: false,
      canContinueBlueprint: false,
      score,
      maxScore,
      signals,
      assumptionRisks,
      blockingUncertainties
    };
  }
}
