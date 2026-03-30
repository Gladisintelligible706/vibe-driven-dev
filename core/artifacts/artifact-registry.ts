/**
 * ArtifactRegistry — Minimal Functional Implementation
 *
 * This registry tracks all known artifact contracts in VDD.
 * It maps artifact names to their metadata: which stage produces them,
 * what trust level they hold, and whether they are required or optional.
 *
 * Per the Core Constitution:
 *   - Artifacts not in the registry must not be treated as authoritative.
 *   - Trust level is explicit, not implied.
 *   - Stage association is mandatory for every registered artifact.
 */

export type ArtifactTrustLevel = "trusted" | "unverified" | "learning-only" | "archived";
export type VddStage =
  | "init"
  | "plan"
  | "research"
  | "blueprint"
  | "detail"
  | "scaffold"
  | "qa"
  | "handoff";

export interface ArtifactContract {
  /** Canonical file name of the artifact */
  name: string;
  /** Human-readable description of what this artifact represents */
  description: string;
  /** The VDD stage that produces this artifact */
  producedByStage: VddStage;
  /** Whether this artifact is required for the stage to be complete */
  required: boolean;
  /** Trust classification of this artifact */
  trustLevel: ArtifactTrustLevel;
}

const registry = new Map<string, ArtifactContract>();

/**
 * Register an artifact contract.
 * Overwrites any existing registration with the same name.
 */
export function registerArtifact(contract: ArtifactContract): void {
  registry.set(contract.name, contract);
}

/**
 * Retrieve a single artifact contract by name.
 * Returns undefined if the artifact is not registered.
 */
export function getArtifact(name: string): ArtifactContract | undefined {
  return registry.get(name);
}

/**
 * List all registered artifact contracts.
 */
export function listArtifacts(): ArtifactContract[] {
  return Array.from(registry.values());
}

/**
 * List all artifacts required for a specific stage to be considered complete.
 */
export function getRequiredArtifactsForStage(stage: VddStage): ArtifactContract[] {
  return Array.from(registry.values()).filter(
    (a) => a.producedByStage === stage && a.required
  );
}

/**
 * Check whether a named artifact is registered and at what trust level.
 * Returns null if the artifact is not registered.
 */
export function checkArtifactTrust(name: string): ArtifactTrustLevel | null {
  return registry.get(name)?.trustLevel ?? null;
}

/**
 * Clear all registered artifacts.
 * Intended for use in tests only.
 */
export function clearRegistry(): void {
  registry.clear();
}

// ─── Bootstrap: Register All Core VDD Artifact Contracts ─────────────────────

const CORE_ARTIFACTS: ArtifactContract[] = [
  // init stage
  {
    name: "project-state.json",
    description: "Authoritative VDD project state",
    producedByStage: "init",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "assumptions-log.md",
    description: "Running log of project assumptions",
    producedByStage: "init",
    required: false,
    trustLevel: "trusted",
  },

  // plan stage
  {
    name: "problem-statement.md",
    description: "Structured problem framing",
    producedByStage: "plan",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "scope.md",
    description: "Project scope boundaries",
    producedByStage: "plan",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "success-definition.md",
    description: "Measurable success criteria",
    producedByStage: "plan",
    required: true,
    trustLevel: "trusted",
  },

  // research stage
  {
    name: "research-summary.md",
    description: "Consolidated research insights",
    producedByStage: "research",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "risk-register.md",
    description: "Identified risks and mitigations",
    producedByStage: "research",
    required: true,
    trustLevel: "trusted",
  },

  // blueprint stage
  {
    name: "architecture-baseline.md",
    description: "High-level system architecture",
    producedByStage: "blueprint",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "system-boundaries.md",
    description: "System component boundaries and responsibilities",
    producedByStage: "blueprint",
    required: true,
    trustLevel: "trusted",
  },

  // detail stage
  {
    name: "technical-detail.md",
    description: "Execution-ready technical constraints",
    producedByStage: "detail",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "validation-plan.md",
    description: "Test and validation strategy",
    producedByStage: "detail",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "execution-notes.md",
    description: "Warnings and caveats for implementation",
    producedByStage: "detail",
    required: false,
    trustLevel: "trusted",
  },

  // scaffold stage
  {
    name: "PRD.full.md",
    description: "Full-depth Product Requirements Document generated with strong-model acceptance",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "PRD.draft.md",
    description: "Draft Product Requirements Document generated without stronger-model escalation",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "PRD.md",
    description: "Legacy Product Requirements Document artifact name",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },
  {
    name: "Logic.md",
    description: "Core business and interaction logic",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Structure.md",
    description: "Conceptual repository structure",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Dependencies.md",
    description: "Technology and dependency strategy",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Memory.md",
    description: "Persistent agent grounding context",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "anti-hallucination.md",
    description: "Agent reliability guardrails",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "repo.md",
    description: "Repository identity and conventions",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },
  {
    name: "Design.md",
    description: "Visual and UX direction",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },

  // qa stage
  {
    name: "qa-report.md",
    description: "Quality assurance findings",
    producedByStage: "qa",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "go-no-go.md",
    description: "Handoff readiness decision",
    producedByStage: "qa",
    required: true,
    trustLevel: "trusted",
  },

  // handoff stage
  {
    name: "spec-handoff.md",
    description: "Final handoff package for Spec-Kit",
    producedByStage: "handoff",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "execution-entry-summary.md",
    description: "Execution entry point summary",
    producedByStage: "handoff",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "initial-decisions.json",
    description: "Key decisions for downstream execution",
    producedByStage: "handoff",
    required: true,
    trustLevel: "trusted",
  },

  // ── Post-PRD Expansion Artifacts ──────────────────────────────────────────
  // These are generated after PRD completion as part of the execution-readiness
  // package. They share the scaffold stage because expansion runs after PRD.

  // Layer 1 — Lock the execution truth
  {
    name: "Open-Questions.md",
    description: "All unresolved choices, blocked assumptions, and decisions waiting on input",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Stack-Decision.md",
    description: "Selected stack, rejected alternatives, rationale, and revisit conditions",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "AI-Provider-Decision.md",
    description: "AI provider and model choice, rationale, alternatives, and revisit triggers",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },

  // Layer 2 — Design the system shape
  {
    name: "Architecture.md",
    description: "Major components, boundaries, data flow, external systems, and responsibility split",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "ADR-0001-initial-decisions.md",
    description: "Architecture Decision Record capturing key decisions with context and trade-offs",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Event-Architecture.md",
    description: "Event-driven patterns, async flows, ordering, idempotency, and correlation",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },

  // Layer 3 — Prepare execution and quality
  {
    name: "Test-Strategy.md",
    description: "Testing pyramid: unit, integration, E2E coverage plan and deferral decisions",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Implementation-Plan.md",
    description: "Execution phases, order of implementation, dependencies, and cut lines",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Execution-Issues.md",
    description: "Discrete work units with issue-ready descriptions, priorities, and dependencies",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Runbook.md",
    description: "Core operational steps: setup, reset, seed, recovery, and error handling",
    producedByStage: "scaffold",
    required: true,
    trustLevel: "trusted",
  },
  {
    name: "Post-PRD-Expansion.md",
    description: "Summary of the post-PRD expansion process: layers completed, gates passed, decisions pending",
    producedByStage: "scaffold",
    required: false,
    trustLevel: "trusted",
  },
];

// Register all core contracts on module load
for (const contract of CORE_ARTIFACTS) {
  registerArtifact(contract);
}
