/**
 * Intent Confidence Scorer
 *
 * Measures whether the popup flow has gathered enough information
 * to proceed into the VDD workflow. Uses a weighted scoring model
 * based on the architecture document's confidence threshold concept.
 */

import type { ExtractedSignals } from "./intent-capture-engine.js";

// ─── Types ─────────────────────────────────────────────────────

export type ConfidenceTier = "low" | "medium" | "high" | "blocking";

export interface ConfidenceDimension {
  name: string;
  label: string;
  present: boolean;
  weight: number;
  score: number;
  detail: string;
}

export interface ConfidenceResult {
  tier: ConfidenceTier;
  score: number;
  maxScore: number;
  ratio: number;
  dimensions: ConfidenceDimension[];
  missingCritical: string[];
  assumptions: string[];
  shouldContinue: boolean;
  shouldStop: boolean;
  shouldAskOneMore: boolean;
  summary: string;
}

// ─── Dimension Definitions ─────────────────────────────────────

interface DimensionConfig {
  name: string;
  label: string;
  weight: number;
  evaluate: (signals: ExtractedSignals) => { present: boolean; detail: string };
}

const DIMENSIONS: DimensionConfig[] = [
  {
    name: "project-type",
    label: "Project type clarity",
    weight: 1.5,
    evaluate: (s) => ({
      present: s.projectType !== "unknown",
      detail: s.projectType !== "unknown"
        ? `Project type: ${s.projectType}`
        : "Project type is still unclear",
    }),
  },
  {
    name: "target-user",
    label: "Target user identified",
    weight: 1.5,
    evaluate: (s) => ({
      present: s.targetUser !== "unknown",
      detail: s.targetUser !== "unknown"
        ? `Target user: ${s.targetUser}`
        : "No target user identified yet",
    }),
  },
  {
    name: "core-problem",
    label: "Core problem understood",
    weight: 2.0,
    evaluate: (s) => ({
      present: s.coreProblem.trim().length >= 30,
      detail: s.coreProblem.trim().length >= 30
        ? `Problem: ${s.coreProblem.slice(0, 80)}...`
        : `Problem description too brief (${s.coreProblem.trim().length} chars, need 30+)`,
    }),
  },
  {
    name: "product-shape",
    label: "Product shape clear",
    weight: 1.0,
    evaluate: (s) => ({
      present: s.productShape !== "unknown",
      detail: s.productShape !== "unknown"
        ? `Product shape: ${s.productShape}`
        : "Product shape not yet determined",
    }),
  },
  {
    name: "ai-clarity",
    label: "AI role clarity",
    weight: 1.0,
    evaluate: (s) => ({
      present: !s.hasAiFeatures || s.aiRole !== "none",
      detail: s.hasAiFeatures
        ? (s.aiRole !== "none"
          ? `AI role: ${s.aiRole}`
          : "AI is involved but its exact role is unclear")
        : "No AI features detected — that's fine",
    }),
  },
  {
    name: "delivery-preference",
    label: "Delivery preference known",
    weight: 0.5,
    evaluate: (s) => ({
      present: s.deliveryPreference !== "unknown",
      detail: s.deliveryPreference !== "unknown"
        ? `Delivery preference: ${s.deliveryPreference}`
        : "Speed vs quality preference not yet clear",
    }),
  },
  {
    name: "platform",
    label: "Platform direction",
    weight: 0.5,
    evaluate: (s) => ({
      present: s.platform !== "unknown",
      detail: s.platform !== "unknown"
        ? `Platform: ${s.platform}`
        : "Platform not yet specified",
    }),
  },
];

// ─── Scoring ───────────────────────────────────────────────────

function scoreDimensions(signals: ExtractedSignals): ConfidenceDimension[] {
  return DIMENSIONS.map((dim) => {
    const { present, detail } = dim.evaluate(signals);
    return {
      name: dim.name,
      label: dim.label,
      present,
      weight: dim.weight,
      score: present ? dim.weight : 0,
      detail,
    };
  });
}

function findMissingCritical(dimensions: ConfidenceDimension[]): string[] {
  return dimensions
    .filter((d) => !d.present && d.weight >= 1.5)
    .map((d) => d.label);
}

function buildAssumptions(signals: ExtractedSignals, dimensions: ConfidenceDimension[]): string[] {
  const assumptions: string[] = [];

  const missing = dimensions.filter((d) => !d.present);
  for (const dim of missing) {
    switch (dim.name) {
      case "project-type":
        assumptions.push("Assuming this is an MVP-type project since the type is unclear.");
        break;
      case "target-user":
        assumptions.push("Assuming a broad audience since no specific user was identified.");
        break;
      case "core-problem":
        assumptions.push("Problem statement is brief — the system will infer from context.");
        break;
      case "product-shape":
        assumptions.push("Defaulting to web app as the product surface.");
        break;
      case "ai-clarity":
        if (signals.hasAiFeatures) {
          assumptions.push("AI features are present but the exact role is unspecified. Treating as a helper.");
        }
        break;
      case "delivery-preference":
        assumptions.push("Defaulting to MVP delivery preference for speed.");
        break;
      case "platform":
        assumptions.push("Defaulting to web as the target platform.");
        break;
    }
  }

  return assumptions;
}

function determineTier(
  score: number,
  maxScore: number,
  missingCritical: string[],
  questionIndex: number,
  maxQuestions: number
): ConfidenceTier {
  const ratio = score / maxScore;

  // Blocking: critical dimensions are still missing and we have questions left
  if (missingCritical.length > 0 && questionIndex < maxQuestions - 2) {
    return "blocking";
  }

  // High: most dimensions covered
  if (ratio >= 0.75) {
    return "high";
  }

  // Medium: reasonable coverage, especially if we're near the budget
  if (ratio >= 0.5 || questionIndex >= maxQuestions - 1) {
    return "medium";
  }

  // Low: too much is still unknown
  return "low";
}

function buildSummary(tier: ConfidenceTier, missingCritical: string[], assumptions: string[]): string {
  switch (tier) {
    case "high":
      return "Intent confidence is high. The system has enough clarity to begin the VDD workflow.";
    case "medium":
      return `Intent confidence is medium. ${assumptions.length} assumption(s) will be made to proceed safely.`;
    case "blocking":
      return `Blocking uncertainty remains in: ${missingCritical.join(", ")}. One more focused question would help.`;
    case "low":
    default:
      return "Intent confidence is low. The system needs more information before proceeding.";
  }
}

// ─── Main Scorer ───────────────────────────────────────────────

export class IntentConfidenceScorer {
  /**
   * Score the current state of extracted signals against the
   * confidence threshold needed to proceed into VDD.
   */
  score(
    signals: ExtractedSignals,
    questionIndex: number,
    maxQuestions: number
  ): ConfidenceResult {
    const dimensions = scoreDimensions(signals);
    const score = dimensions.reduce((acc, d) => acc + d.score, 0);
    const maxScore = dimensions.reduce((acc, d) => acc + d.weight, 0);
    const ratio = maxScore > 0 ? score / maxScore : 0;
    const missingCritical = findMissingCritical(dimensions);
    const assumptions = buildAssumptions(signals, dimensions);
    const tier = determineTier(score, maxScore, missingCritical, questionIndex, maxQuestions);

    const shouldStop =
      tier === "high" ||
      questionIndex >= maxQuestions;

    const shouldContinue =
      tier === "low" ||
      tier === "blocking";

    const shouldAskOneMore =
      tier === "medium" &&
      questionIndex < maxQuestions - 1 &&
      missingCritical.length > 0;

    return {
      tier,
      score: Math.round(score * 100) / 100,
      maxScore: Math.round(maxScore * 100) / 100,
      ratio: Math.round(ratio * 100) / 100,
      dimensions,
      missingCritical,
      assumptions,
      shouldContinue,
      shouldStop,
      shouldAskOneMore,
      summary: buildSummary(tier, missingCritical, assumptions),
    };
  }

  /**
   * Quick check: is confidence high enough to stop?
   */
  isReady(signals: ExtractedSignals): boolean {
    const result = this.score(signals, 0, 5);
    return result.tier === "high";
  }
}
