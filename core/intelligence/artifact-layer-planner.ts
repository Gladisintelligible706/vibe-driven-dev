/**
 * Artifact Layer Planner
 *
 * Defines the ordered expansion of post-PRD artifacts into three layers.
 * Each artifact is assigned to a layer based on its dependency depth:
 *
 *   Layer 1 — Lock the execution truth
 *     Scope.md, Open-Questions.md, Logic.md, Stack-Decision.md, AI-Provider-Decision.md
 *
 *   Layer 2 — Design the system shape
 *     Architecture.md, ADR-0001-initial-decisions.md, Dependencies.md,
 *     Event-Architecture.md (conditional), repo.md
 *
 *   Layer 3 — Prepare execution and quality
 *     Validation-Plan.md, Test-Strategy.md, Implementation-Plan.md,
 *     Execution-Issues.md, Risk-Register.md, Memory.md,
 *     anti-hallucination.md, Runbook.md
 *
 * No artifact in a deeper layer should be treated as final if an artifact
 * in a shallower layer is still unstable.
 *
 * Source: post-prd-artifact-expansion.md architecture document.
 */

import type { ProjectState } from "../router/engine.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ArtifactLayer = 1 | 2 | 3;

export type ArtifactPriority = "required" | "recommended" | "conditional";

export interface ArtifactDefinition {
  /** Canonical file name */
  name: string;
  /** Human-readable purpose */
  description: string;
  /** Which layer this artifact belongs to */
  layer: ArtifactLayer;
  /** Ordering within the layer (lower = earlier) */
  orderInLayer: number;
  /** Whether this artifact is always needed */
  priority: ArtifactPriority;
  /** Upstream artifact names that should be stable before this one */
  dependsOn: string[];
  /** Condition function: true means this artifact should be generated */
  condition: (state: ProjectState | null, prdContent: string) => boolean;
  /** What this artifact must contain (used for quality gate checks) */
  requiredSections: string[];
  /** Brief generation hint for the agent */
  generationHint: string;
}

export interface LayerPlan {
  layer: ArtifactLayer;
  label: string;
  description: string;
  artifacts: ArtifactDefinition[];
  totalCount: number;
}

export interface ExpansionPlan {
  layers: LayerPlan[];
  totalArtifacts: number;
  conditionalArtifacts: ArtifactDefinition[];
  alwaysRequired: ArtifactDefinition[];
  estimatedRounds: number;
}

// ─── Artifact Definitions ────────────────────────────────────────────────────

const ARTIFACTS: ArtifactDefinition[] = [
  // ── Layer 1: Lock the execution truth ────────────────────────────────────
  {
    name: "Scope.md",
    description: "Explicit in-scope, out-of-scope, non-goals, and future work boundaries.",
    layer: 1,
    orderInLayer: 1,
    priority: "required",
    dependsOn: [],
    condition: () => true,
    requiredSections: ["in scope", "out of scope", "non-goals"],
    generationHint:
      "Extract scope boundaries from the PRD. Separate in-scope, out-of-scope, non-goals, and future work. Be explicit about what will NOT be built."
  },
  {
    name: "Open-Questions.md",
    description: "All unresolved choices, blocked assumptions, and decisions waiting on input.",
    layer: 1,
    orderInLayer: 2,
    priority: "required",
    dependsOn: [],
    condition: () => true,
    requiredSections: ["unresolved", "blocked", "waiting"],
    generationHint:
      "Scan the PRD for implicit assumptions, unanswered questions, and trade-offs not yet decided. List them explicitly with context and impact."
  },
  {
    name: "Logic.md",
    description: "Business logic, user flows, state transitions, and operational rules.",
    layer: 1,
    orderInLayer: 3,
    priority: "required",
    dependsOn: ["Scope.md"],
    condition: () => true,
    requiredSections: ["business logic", "user flow", "state"],
    generationHint:
      "Translate PRD requirements into clear business logic. Describe user flows, state transitions, and operational rules in plain language — more detailed than PRD, less technical than implementation."
  },
  {
    name: "Stack-Decision.md",
    description: "Selected stack, rejected alternatives, rationale, and revisit conditions.",
    layer: 1,
    orderInLayer: 4,
    priority: "required",
    dependsOn: ["Scope.md", "Logic.md"],
    condition: () => true,
    requiredSections: ["selected", "alternatives", "rationale", "revisit"],
    generationHint:
      "Document the technology stack choice with clear rationale. List rejected alternatives and why they lost. Define conditions that would trigger a revisit."
  },
  {
    name: "AI-Provider-Decision.md",
    description: "AI provider and model choice, rationale, alternatives, and revisit triggers.",
    layer: 1,
    orderInLayer: 5,
    priority: "conditional",
    dependsOn: ["Stack-Decision.md"],
    condition: (state) => Boolean(state?.hasAiFeatures),
    requiredSections: ["provider", "model", "rationale", "alternatives", "revisit"],
    generationHint:
      "If the product uses AI, document the provider and model choice. Explain why this fits the use case, what alternatives exist, and when to revisit the decision."
  },

  // ── Layer 2: Design the system shape ─────────────────────────────────────
  {
    name: "Architecture.md",
    description: "Major components, boundaries, data flow, external systems, and responsibility split.",
    layer: 2,
    orderInLayer: 1,
    priority: "required",
    dependsOn: ["Scope.md", "Logic.md", "Stack-Decision.md"],
    condition: () => true,
    requiredSections: ["components", "boundaries", "data flow", "external"],
    generationHint:
      "Describe the system architecture: major components, their boundaries, data flow between them, external system dependencies, and responsibility split. Use diagrams where helpful."
  },
  {
    name: "ADR-0001-initial-decisions.md",
    description: "Architecture Decision Record capturing key decisions with context and trade-offs.",
    layer: 2,
    orderInLayer: 2,
    priority: "required",
    dependsOn: ["Architecture.md", "Stack-Decision.md"],
    condition: () => true,
    requiredSections: ["decision", "context", "options", "choice", "tradeoffs"],
    generationHint:
      "Write the first Architecture Decision Record. Capture the most important technical decisions made so far, the context behind them, options considered, the choice made, and trade-offs accepted."
  },
  {
    name: "Dependencies.md",
    description: "Major libraries, services, why they are used, and known risks or constraints.",
    layer: 2,
    orderInLayer: 3,
    priority: "required",
    dependsOn: ["Stack-Decision.md", "Architecture.md"],
    condition: () => true,
    requiredSections: ["libraries", "services", "rationale", "risks"],
    generationHint:
      "List all major dependencies — libraries and external services. For each, explain why it was chosen and what risks or constraints it brings."
  },
  {
    name: "Event-Architecture.md",
    description: "Event-driven patterns, async flows, ordering, idempotency, and correlation.",
    layer: 2,
    orderInLayer: 4,
    priority: "conditional",
    dependsOn: ["Architecture.md"],
    condition: (state, prdContent) => {
      const text = `${state?.assumptions?.join(" ") ?? ""} ${prdContent}`.toLowerCase();
      return (
        /background|queue|worker|async|webhook|notification|event.driven/.test(text) ||
        Boolean(state?.hasAiFeatures && /generation|batch|job/.test(text))
      );
    },
    requiredSections: ["events", "consumers", "ordering", "idempotency"],
    generationHint:
      "If the system has async flows, webhooks, notifications, or background jobs, document the event architecture. Cover event types, consumers, ordering guarantees, and idempotency."
  },
  {
    name: "repo.md",
    description: "Repository layout, folder purpose, and structural conventions.",
    layer: 2,
    orderInLayer: 5,
    priority: "required",
    dependsOn: ["Architecture.md"],
    condition: () => true,
    requiredSections: ["layout", "folders", "conventions"],
    generationHint:
      "Describe the repository structure: what lives in each folder, naming conventions, where new files should go, and what structure should remain stable."
  },

  // ── Layer 3: Prepare execution and quality ───────────────────────────────
  {
    name: "Validation-Plan.md",
    description: "How success will be checked, what evidence counts, and what tests matter.",
    layer: 3,
    orderInLayer: 1,
    priority: "required",
    dependsOn: ["Logic.md", "Architecture.md"],
    condition: () => true,
    requiredSections: ["success criteria", "evidence", "experiments"],
    generationHint:
      "Define how the project's success will be validated. What experiments or tests will prove the product works? What evidence will count as pass/fail?"
  },
  {
    name: "Test-Strategy.md",
    description: "Testing pyramid: unit, integration, E2E coverage plan and deferral decisions.",
    layer: 3,
    orderInLayer: 2,
    priority: "required",
    dependsOn: ["Architecture.md", "Validation-Plan.md"],
    condition: () => true,
    requiredSections: ["unit", "integration", "e2e", "deferred"],
    generationHint:
      "Define the test strategy: what gets unit tests, what gets integration tests, what gets E2E coverage, and what is intentionally deferred. Be honest about trade-offs."
  },
  {
    name: "Implementation-Plan.md",
    description: "Execution phases, order of implementation, dependencies, and cut lines.",
    layer: 3,
    orderInLayer: 3,
    priority: "required",
    dependsOn: ["Architecture.md", "Dependencies.md", "ADR-0001-initial-decisions.md"],
    condition: () => true,
    requiredSections: ["phases", "order", "dependencies", "cut lines"],
    generationHint:
      "Convert the PRD and architecture into a concrete implementation plan. Define phases, the order of implementation, dependency relationships, and clear cut lines for scope reduction."
  },
  {
    name: "Execution-Issues.md",
    description: "Discrete work units with issue-ready descriptions, priorities, and dependencies.",
    layer: 3,
    orderInLayer: 4,
    priority: "required",
    dependsOn: ["Implementation-Plan.md"],
    condition: () => true,
    requiredSections: ["work units", "priorities", "dependencies"],
    generationHint:
      "Break the implementation plan into discrete, issue-ready work units. Each should have a clear description, priority, and dependency notes."
  },
  {
    name: "Risk-Register.md",
    description: "Technical, product, and dependency risks with mitigation direction.",
    layer: 3,
    orderInLayer: 5,
    priority: "required",
    dependsOn: ["Architecture.md", "Dependencies.md"],
    condition: () => true,
    requiredSections: ["technical risks", "product risks", "mitigation"],
    generationHint:
      "Identify and document all project risks: technical, product, dependency, and provider risks. For each, describe the risk, its likelihood, impact, and mitigation direction."
  },
  {
    name: "Memory.md",
    description: "Stable project truths and persistent context the agent should not lose.",
    layer: 3,
    orderInLayer: 6,
    priority: "required",
    dependsOn: ["Stack-Decision.md", "Architecture.md"],
    condition: () => true,
    requiredSections: ["stable truths", "assumptions", "context"],
    generationHint:
      "Extract the most stable, durable facts about this project that the coding agent must remember across sessions. This is operational memory, not documentation."
  },
  {
    name: "anti-hallucination.md",
    description: "Guardrails defining what the agent must not invent or assume without verification.",
    layer: 3,
    orderInLayer: 7,
    priority: "required",
    dependsOn: ["Dependencies.md", "Stack-Decision.md"],
    condition: () => true,
    requiredSections: ["do not invent", "TBD required", "verification needed"],
    generationHint:
      "Define explicit guardrails: what the coding agent must not invent, what must be marked TBD, and what requires verification before claiming. This protects against confident hallucination."
  },
  {
    name: "Runbook.md",
    description: "Core operational steps: setup, reset, seed, recovery, and error handling.",
    layer: 3,
    orderInLayer: 8,
    priority: "required",
    dependsOn: ["Architecture.md", "Dependencies.md"],
    condition: () => true,
    requiredSections: ["setup", "reset", "recovery", "error handling"],
    generationHint:
      "Document the operational runbook: how to set up locally, how to reset state, how to seed data, how to recover from common errors, and what permissions are needed."
  }
];

// ─── Layer Labels ─────────────────────────────────────────────────────────────

const LAYER_META: Record<ArtifactLayer, { label: string; description: string }> = {
  1: {
    label: "Lock the Execution Truth",
    description:
      "These files lock down what is in and out, what is still unknown, how the system should behave, what technical direction is assumed, and what AI dependency choices exist. Without these, deeper design artifacts become fragile."
  },
  2: {
    label: "Design the System Shape",
    description:
      "These files depend on a stable problem frame and execution truth. They define system boundaries, architectural rationale, dependency choices, event modeling where needed, and repository structure conventions."
  },
  3: {
    label: "Prepare Execution and Quality",
    description:
      "These files should be based on stable scope, logic, architecture, and dependency choices. If generated too early, they become shallow or misleading."
  }
};

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Get all artifact definitions.
 */
export function getAllArtifactDefinitions(): ArtifactDefinition[] {
  return [...ARTIFACTS];
}

/**
 * Filter artifacts that should be generated based on project state and PRD content.
 */
export function resolveActiveArtifacts(
  state: ProjectState | null,
  prdContent: string
): ArtifactDefinition[] {
  return ARTIFACTS.filter((a) => a.condition(state, prdContent));
}

/**
 * Build the full expansion plan grouped by layers.
 */
export function buildExpansionPlan(
  state: ProjectState | null,
  prdContent: string
): ExpansionPlan {
  const active = resolveActiveArtifacts(state, prdContent);

  const layers: LayerPlan[] = ([1, 2, 3] as ArtifactLayer[]).map((layerNum) => {
    const layerArtifacts = active
      .filter((a) => a.layer === layerNum)
      .sort((a, b) => a.orderInLayer - b.orderInLayer);

    return {
      layer: layerNum,
      label: LAYER_META[layerNum].label,
      description: LAYER_META[layerNum].description,
      artifacts: layerArtifacts,
      totalCount: layerArtifacts.length
    };
  });

  const conditionalArtifacts = active.filter((a) => a.priority === "conditional");
  const alwaysRequired = active.filter((a) => a.priority === "required");

  return {
    layers,
    totalArtifacts: active.length,
    conditionalArtifacts,
    alwaysRequired,
    estimatedRounds: 3 // one round per layer, plus quality pass
  };
}

/**
 * Get artifacts for a specific layer only.
 */
export function getArtifactsForLayer(
  layer: ArtifactLayer,
  state: ProjectState | null,
  prdContent: string
): ArtifactDefinition[] {
  return resolveActiveArtifacts(state, prdContent)
    .filter((a) => a.layer === layer)
    .sort((a, b) => a.orderInLayer - b.orderInLayer);
}

/**
 * Check if all dependencies for an artifact are satisfied by the set of completed artifacts.
 */
export function areDependenciesSatisfied(
  artifact: ArtifactDefinition,
  completedArtifacts: Set<string>
): boolean {
  return artifact.dependsOn.every((dep) => completedArtifacts.has(dep));
}

/**
 * Get the next artifact that should be generated given what's already completed.
 * Returns null if the current layer is complete and quality gate should run.
 */
export function getNextArtifact(
  layer: ArtifactLayer,
  state: ProjectState | null,
  prdContent: string,
  completedArtifacts: Set<string>
): ArtifactDefinition | "layer-complete" | null {
  const layerArtifacts = getArtifactsForLayer(layer, state, prdContent);

  for (const artifact of layerArtifacts) {
    if (completedArtifacts.has(artifact.name)) continue;
    if (areDependenciesSatisfied(artifact, completedArtifacts)) {
      return artifact;
    }
    // If dependencies not satisfied, check if they're from an earlier layer
    const unsatisfiedInSameLayer = artifact.dependsOn.filter(
      (dep) => !completedArtifacts.has(dep) && layerArtifacts.some((a) => a.name === dep)
    );
    if (unsatisfiedInSameLayer.length > 0) {
      // Another artifact in this layer must come first
      continue;
    }
    // Dependencies are from earlier layers (should already be done)
    return artifact;
  }

  // All artifacts in this layer are completed
  const allDone = layerArtifacts.every((a) => completedArtifacts.has(a.name));
  return allDone ? "layer-complete" : null;
}

/**
 * Build a human-readable summary of the expansion plan.
 */
export function renderExpansionPlanSummary(plan: ExpansionPlan): string {
  const lines: string[] = [
    "# Post-PRD Artifact Expansion Plan",
    "",
    `**Total artifacts:** ${plan.totalArtifacts}`,
    `**Always required:** ${plan.alwaysRequired.length}`,
    `**Conditional:** ${plan.conditionalArtifacts.length}`,
    `**Estimated quality passes:** ${plan.estimatedRounds}`,
    ""
  ];

  for (const layer of plan.layers) {
    if (layer.totalCount === 0) continue;

    lines.push("---");
    lines.push("");
    lines.push(`## Layer ${layer.layer}: ${layer.label}`);
    lines.push("");
    lines.push(layer.description);
    lines.push("");

    for (const artifact of layer.artifacts) {
      const deps =
        artifact.dependsOn.length > 0
          ? ` (depends on: ${artifact.dependsOn.join(", ")})`
          : "";
      const conditional = artifact.priority === "conditional" ? " [conditional]" : "";
      lines.push(`- **${artifact.name}**${conditional}${deps}`);
      lines.push(`  ${artifact.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
