/**
 * Post-PRD Expansion Orchestrator
 *
 * The main intelligence module for expanding a completed PRD into the full
 * execution-readiness artifact package (18 artifacts across 3 layers).
 *
 * This orchestrator:
 *   1. Verifies PRD readiness (entry conditions)
 *   2. Installs post-PRD skills (breakdown-feature-prd, prd-to-plan, etc.)
 *   3. Builds the expansion plan (3 ordered layers)
 *   4. Generates artifacts layer by layer
 *   5. Runs quality gates after each layer
 *   6. Detects high-impact decisions that need user approval
 *   7. Produces a completion summary
 *
 * Autopilot behavior:
 *   - Continues automatically when PRD is stable and no contradictions found
 *   - Pauses at high-impact decision points (stack, AI provider, events, execution)
 *   - Pauses when quality gates fail or contradictions emerge
 *
 * Source: post-prd-artifact-expansion.md architecture document.
 */

import type { ProjectState } from "../router/engine.js";
import type { RuntimeDetectionResult } from "./agent-runtime-detector.js";
import { detectAgentRuntime } from "./agent-runtime-detector.js";
import {
  buildExpansionPlan,
  getArtifactsForLayer,
  renderExpansionPlanSummary,
  type ArtifactDefinition,
  type ArtifactLayer,
  type ExpansionPlan,
  type LayerPlan
} from "./artifact-layer-planner.js";
import {
  evaluateLayerGate,
  evaluateExpansionCompletion,
  detectHighImpactDecisions,
  getRefinementQuestions,
  type LayerGateResult,
  type HighImpactDecision,
  type RefinementQuestion
} from "./artifact-quality-gates.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExpansionReadiness = "ready" | "prd-not-ready" | "blocked";

export interface ExpansionReadinessCheck {
  readiness: ExpansionReadiness;
  reasons: string[];
  prdExists: boolean;
  prdStable: boolean;
  projectContextSufficient: boolean;
}

export interface PostPrdSkillEntry {
  name: string;
  owner: string;
  repo: string;
  installCommand: string;
  reason: string;
  phase: "install-now" | "install-after-draft" | "install-after-stable";
  role: string;
}

export interface LayerExpansionResult {
  layer: ArtifactLayer;
  layerLabel: string;
  artifactsGenerated: string[];
  artifactsSkipped: string[];
  gateResult: LayerGateResult;
  refinementQuestions: RefinementQuestion[];
  highImpactDecisions: HighImpactDecision[];
  requiresPause: boolean;
  pauseReasons: string[];
  summary: string;
}

export interface PostPrdExpansionResult {
  ready: boolean;
  readiness: ExpansionReadinessCheck;
  runtime: RuntimeDetectionResult;
  expansionPlan: ExpansionPlan;
  postPrdSkills: PostPrdSkillEntry[];
  postPrdSkillCommands: string[];
  layers: LayerExpansionResult[];
  allArtifactsGenerated: string[];
  completionGate: {
    complete: boolean;
    summary: string;
    highImpactDecisions: HighImpactDecision[];
  } | null;
  autopilotStatus: "continue" | "pause";
  pauseReasons: string[];
  userSummary: string;
  nextSteps: string[];
}

// ─── Post-PRD Skills ────────────────────────────────────────────────────────

const POST_PRD_SKILLS: PostPrdSkillEntry[] = [
  {
    name: "breakdown-feature-prd",
    owner: "github",
    repo: "awesome-copilot",
    installCommand: "npx skills add github/awesome-copilot --skill breakdown-feature-prd",
    reason: "Splits the PRD into feature structure — helps Scope.md and Logic.md generation.",
    phase: "install-now",
    role: "feature-breakdown"
  },
  {
    name: "prd-to-plan",
    owner: "mattpocock",
    repo: "skills",
    installCommand: "npx skills add mattpocock/skills --skill prd-to-plan",
    reason: "Converts PRD into implementation planning — helps Implementation-Plan.md generation.",
    phase: "install-now",
    role: "plan-conversion"
  },
  {
    name: "prd-to-issues",
    owner: "mattpocock",
    repo: "skills",
    installCommand: "npx skills add mattpocock/skills --skill prd-to-issues",
    reason: "Converts PRD into actionable work units — helps Execution-Issues.md generation.",
    phase: "install-now",
    role: "issue-conversion"
  },
  {
    name: "prd-development",
    owner: "deanpeters",
    repo: "product-manager-skills",
    installCommand: "npx skills add deanpeters/product-manager-skills --skill prd-development",
    reason: "PM refinement pass — strengthens product framing during artifact generation.",
    phase: "install-now",
    role: "pm-refinement"
  },
  {
    name: "agentic-eval",
    owner: "github",
    repo: "awesome-copilot",
    installCommand: "npx skills add github/awesome-copilot --skill agentic-eval",
    reason: "Generate → Evaluate → Critique → Refine loop — used for quality passes between layers.",
    phase: "install-now",
    role: "quality-loop"
  }
];

// ─── Entry Conditions ────────────────────────────────────────────────────────

/**
 * Check if the project is ready for post-PRD artifact expansion.
 */
export function checkExpansionReadiness(
  state: ProjectState | null,
  prdContent: string
): ExpansionReadinessCheck {
  const reasons: string[] = [];

  // Check PRD existence
  const prdExists = prdContent.trim().length > 200;
  if (!prdExists) {
    reasons.push("PRD.md does not exist or is too short (< 200 characters).");
  }

  // Check PRD stability signals
  const prdStable =
    prdExists &&
    /scope|in scope|out of scope/i.test(prdContent) &&
    /success|metric|criteria/i.test(prdContent) &&
    /constraint|limitation|assumption/i.test(prdContent);

  if (!prdStable && prdExists) {
    reasons.push(
      "PRD may not be stable enough — missing scope, success criteria, or constraints sections."
    );
  }

  // Check project context
  const projectContextSufficient = Boolean(
    state?.problemStatement && state?.targetUser
  );
  if (!projectContextSufficient) {
    reasons.push("Project context is insufficient — problem statement or target user missing.");
  }

  const readiness: ExpansionReadiness =
    prdStable && projectContextSufficient
      ? "ready"
      : !prdExists
      ? "prd-not-ready"
      : "blocked";

  return {
    readiness,
    reasons,
    prdExists,
    prdStable,
    projectContextSufficient
  };
}

// ─── Skill Command Builder ───────────────────────────────────────────────────

function buildSkillCommands(
  runtime: RuntimeDetectionResult
): string[] {
  return POST_PRD_SKILLS.map((skill) => {
    let cmd = skill.installCommand;
    if (runtime.agentArg && runtime.confidence !== "none") {
      if (!cmd.includes("--agent")) {
        cmd = `${cmd} --agent ${runtime.agentArg}`;
      }
    }
    if (!cmd.includes("-y")) {
      cmd = `${cmd} -y`;
    }
    return cmd;
  });
}

// ─── User-Facing Summary Builder ─────────────────────────────────────────────

function buildUserSummary(result: PostPrdExpansionResult): string {
  if (!result.ready) {
    return [
      "Post-PRD expansion cannot start yet.",
      "",
      ...result.readiness.reasons.map((r) => `- ${r}`),
      "",
      "Resolve these issues before continuing the expansion."
    ].join("\n");
  }

  const layerSummaries = result.layers.map((l) => {
    const status = l.requiresPause
      ? "PAUSED"
      : l.gateResult.passed
      ? "PASSED"
      : "NEEDS REVIEW";
    return `  Layer ${l.layer} (${l.layerLabel}): ${status} — ${l.artifactsGenerated.length} artifact(s) generated`;
  });

  const totalGenerated = result.allArtifactsGenerated.length;
  const totalPlanned = result.expansionPlan.totalArtifacts;
  const paused = result.autopilotStatus === "pause";

  return [
    `Post-PRD expansion ${paused ? "paused" : "progress"}.`,
    "",
    `Artifacts generated: ${totalGenerated} / ${totalPlanned}`,
    "",
    "Layer status:",
    ...layerSummaries,
    "",
    paused
      ? `Paused because: ${result.pauseReasons.join("; ")}`
      : "All layers completed quality gates.",
    "",
    result.completionGate?.summary ?? ""
  ].join("\n");
}

function buildNextSteps(result: PostPrdExpansionResult): string[] {
  if (!result.ready) {
    return [
      "Ensure the PRD is complete and stable.",
      "Re-run the expansion after PRD quality gates pass."
    ];
  }

  if (result.autopilotStatus === "pause") {
    const steps: string[] = [];

    for (const decision of result.completionGate?.highImpactDecisions ?? []) {
      if (decision.requiresApproval) {
        steps.push(`Review and approve: ${decision.decision} — ${decision.reason}`);
      }
    }

    for (const layer of result.layers) {
      if (layer.gateResult.missingArtifacts.length > 0) {
        steps.push(
          `Generate missing artifacts in Layer ${layer.layer}: ${layer.gateResult.missingArtifacts.join(", ")}`
        );
      }
      if (layer.gateResult.weakArtifacts.length > 0) {
        steps.push(
          `Strengthen weak artifacts: ${layer.gateResult.weakArtifacts.join(", ")}`
        );
      }
    }

    if (steps.length === 0) {
      steps.push("Review the expansion results and approve high-impact decisions.");
    }

    return steps;
  }

  return [
    "All post-PRD artifacts are generated and passed quality gates.",
    "Review the execution readiness package.",
    "Proceed to implementation when ready."
  ];
}

// ─── Layer Expansion Logic ───────────────────────────────────────────────────

/**
 * Expand a single layer: generate artifacts and run quality gates.
 *
 * In a real implementation, this would call the coding agent to generate
 * each artifact. Here we define the contract and structure.
 */
function expandLayer(
  layer: ArtifactLayer,
  layerPlan: LayerPlan,
  state: ProjectState | null,
  prdContent: string,
  generatedArtifacts: Map<string, string>
): LayerExpansionResult {
  const artifactsGenerated: string[] = [];
  const artifactsSkipped: string[] = [];
  const pauseReasons: string[] = [];

  // Generate each artifact in order
  for (const artifact of layerPlan.artifacts) {
    // In the real implementation, this is where the coding agent
    // would be invoked to generate the artifact content.
    // For now, we track that generation is needed.
    const existingContent = generatedArtifacts.get(artifact.name);

    if (existingContent && existingContent.trim().length > 50) {
      artifactsGenerated.push(artifact.name);
    } else {
      // Mark for generation — the actual generation happens externally
      artifactsSkipped.push(artifact.name);
    }
  }

  // Run quality gate
  const gateResult = evaluateLayerGate(layer, state, prdContent, generatedArtifacts);

  // Collect refinement questions for generated artifacts
  const refinementQuestions: RefinementQuestion[] = [];
  for (const name of artifactsGenerated) {
    refinementQuestions.push(...getRefinementQuestions(name));
  }

  // Detect high-impact decisions
  const highImpactDecisions = detectHighImpactDecisions(generatedArtifacts);
  const pendingDecisions = highImpactDecisions.filter(
    (d) =>
      d.requiresApproval &&
      layerPlan.artifacts.some((a) => a.name === d.artifactName)
  );

  if (pendingDecisions.length > 0) {
    pauseReasons.push(
      ...pendingDecisions.map(
        (d) => `${d.decision}: ${d.reason}`
      )
    );
  }

  if (!gateResult.canContinue) {
    pauseReasons.push(`Layer ${layer} quality gate failed: ${gateResult.summary}`);
  }

  const requiresPause = pauseReasons.length > 0;

  const summary = requiresPause
    ? `Layer ${layer} expansion paused. ${artifactsGenerated.length} generated, ${artifactsSkipped.length} pending. ${pauseReasons.length} issue(s).`
    : `Layer ${layer} expansion complete. ${artifactsGenerated.length} artifact(s) generated and passed quality gates.`;

  return {
    layer,
    layerLabel: layerPlan.label,
    artifactsGenerated,
    artifactsSkipped,
    gateResult,
    refinementQuestions: refinementQuestions.filter(
      (q) => q.severity === "must-fix" || q.severity === "should-fix"
    ),
    highImpactDecisions: pendingDecisions,
    requiresPause,
    pauseReasons,
    summary
  };
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Run the full post-PRD artifact expansion.
 *
 * This is the primary entry point. It:
 * - checks readiness (PRD exists, is stable, project context sufficient)
 * - detects the agent runtime
 * - builds the expansion plan (3 ordered layers)
 * - documents the post-PRD skill installation commands
 * - expands each layer in order
 * - runs quality gates after each layer
 * - detects high-impact decisions
 * - determines autopilot status (continue vs pause)
 * - produces a user-facing summary
 *
 * The actual artifact generation is done by the coding agent externally.
 * This module provides the orchestration contract: what to generate,
 * in what order, with what quality checks.
 */
export function runPostPrdExpansion(
  projectRoot: string,
  state: ProjectState | null,
  prdContent: string,
  args?: Record<string, string | boolean> | undefined
): PostPrdExpansionResult {
  // Step 1: Check readiness
  const readiness = checkExpansionReadiness(state, prdContent);

  // Step 2: Detect runtime
  const explicitRuntime =
    typeof args?.runtime === "string"
      ? args.runtime
      : typeof args?.agent === "string"
      ? args.agent
      : undefined;
  const runtime = detectAgentRuntime(projectRoot, explicitRuntime);

  // Step 3: Build expansion plan
  const expansionPlan = buildExpansionPlan(state, prdContent);

  // Step 4: Build post-PRD skill commands
  const postPrdSkillCommands = buildSkillCommands(runtime);

  // Step 5: If not ready, return early with advisory
  if (readiness.readiness !== "ready") {
    const result: PostPrdExpansionResult = {
      ready: false,
      readiness,
      runtime,
      expansionPlan,
      postPrdSkills: POST_PRD_SKILLS,
      postPrdSkillCommands,
      layers: [],
      allArtifactsGenerated: [],
      completionGate: null,
      autopilotStatus: "pause",
      pauseReasons: readiness.reasons,
      userSummary: "",
      nextSteps: []
    };
    result.userSummary = buildUserSummary(result);
    result.nextSteps = buildNextSteps(result);
    return result;
  }

  // Step 6: Expand layers
  const generatedArtifacts = new Map<string, string>();
  const layers: LayerExpansionResult[] = [];
  const allArtifactsGenerated: string[] = [];
  const allPauseReasons: string[] = [];

  for (const layerPlan of expansionPlan.layers) {
    if (layerPlan.totalCount === 0) continue;

    const layerResult = expandLayer(
      layerPlan.layer,
      layerPlan,
      state,
      prdContent,
      generatedArtifacts
    );

    layers.push(layerResult);
    allArtifactsGenerated.push(...layerResult.artifactsGenerated);
    allPauseReasons.push(...layerResult.pauseReasons);

    // If this layer requires a pause, stop here
    if (layerResult.requiresPause) {
      break;
    }
  }

  // Step 7: Evaluate full expansion completion
  const completionGate = evaluateExpansionCompletion(
    state,
    prdContent,
    generatedArtifacts
  );

  // Step 8: Determine autopilot status
  const autopilotStatus: "continue" | "pause" =
    allPauseReasons.length > 0 || !completionGate.complete ? "pause" : "continue";

  const result: PostPrdExpansionResult = {
    ready: true,
    readiness,
    runtime,
    expansionPlan,
    postPrdSkills: POST_PRD_SKILLS,
    postPrdSkillCommands,
    layers,
    allArtifactsGenerated,
    completionGate,
    autopilotStatus,
    pauseReasons: allPauseReasons,
    userSummary: "",
    nextSteps: []
  };

  result.userSummary = buildUserSummary(result);
  result.nextSteps = buildNextSteps(result);

  return result;
}

// ─── Rendering ───────────────────────────────────────────────────────────────

/**
 * Render the expansion result as a Markdown artifact.
 */
export function renderExpansionResultMd(result: PostPrdExpansionResult): string {
  const lines: string[] = [
    "# Post-PRD Artifact Expansion",
    "",
    `**Readiness:** ${result.readiness.readiness}`,
    `**Runtime:** ${result.runtime.runtime}`,
    `**Autopilot:** ${result.autopilotStatus}`,
    "",
    "---",
    "",
    "## Expansion Plan",
    "",
    renderExpansionPlanSummary(result.expansionPlan),
    "",
    "---",
    "",
    "## Post-PRD Skills",
    "",
    "These skills are installed after PRD completion to support artifact expansion:",
    ""
  ];

  for (const skill of result.postPrdSkills) {
    lines.push(`### ${skill.name}`);
    lines.push(`- **Role:** ${skill.role}`);
    lines.push(`- **Phase:** ${skill.phase}`);
    lines.push(`- **Reason:** ${skill.reason}`);
    lines.push(`- **Command:** \`${skill.installCommand}\``);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Layer Results");
  lines.push("");

  for (const layer of result.layers) {
    lines.push(`### Layer ${layer.layer}: ${layer.layerLabel}`);
    lines.push("");
    lines.push(`**Status:** ${layer.requiresPause ? "PAUSED" : "COMPLETE"}`);
    lines.push(`**Generated:** ${layer.artifactsGenerated.join(", ") || "none"}`);
    lines.push(`**Pending:** ${layer.artifactsSkipped.join(", ") || "none"}`);
    lines.push(`**Gate:** ${layer.gateResult.passed ? "PASSED" : "FAILED"}`);
    lines.push("");

    if (layer.pauseReasons.length > 0) {
      lines.push("**Pause reasons:**");
      for (const reason of layer.pauseReasons) {
        lines.push(`- ${reason}`);
      }
      lines.push("");
    }

    if (layer.highImpactDecisions.length > 0) {
      lines.push("**High-impact decisions:**");
      for (const d of layer.highImpactDecisions) {
        lines.push(`- **${d.decision}**: ${d.reason}`);
      }
      lines.push("");
    }

    // Show failed gate checks
    const failedChecks = layer.gateResult.checks.filter(
      (c) => !c.passed && c.severity === "error"
    );
    if (failedChecks.length > 0) {
      lines.push("**Failed checks:**");
      for (const check of failedChecks) {
        lines.push(`- ${check.label}: ${check.message}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // Completion summary
  if (result.completionGate) {
    lines.push("## Completion");
    lines.push("");
    lines.push(`**Complete:** ${result.completionGate.complete ? "Yes" : "No"}`);
    lines.push(`**Summary:** ${result.completionGate.summary}`);
    lines.push("");

    if (result.completionGate.highImpactDecisions.length > 0) {
      lines.push("**Decisions requiring approval:**");
      for (const d of result.completionGate.highImpactDecisions) {
        lines.push(`- **${d.decision}**: ${d.reason}`);
      }
      lines.push("");
    }
  }

  // Artifacts generated
  lines.push("## Artifacts Generated");
  lines.push("");
  for (const name of result.allArtifactsGenerated) {
    lines.push(`- ${name}`);
  }
  lines.push("");

  // Next steps
  if (result.nextSteps.length > 0) {
    lines.push("## Next Steps");
    lines.push("");
    for (const step of result.nextSteps) {
      lines.push(`- ${step}`);
    }
    lines.push("");
  }

  lines.push("_Generated by VDD Post-PRD Expansion Orchestrator._");

  return lines.join("\n");
}

/**
 * Render the expansion plan as a standalone Markdown artifact.
 */
export function renderExpansionPlanMd(
  state: ProjectState | null,
  prdContent: string
): string {
  const plan = buildExpansionPlan(state, prdContent);
  return renderExpansionPlanSummary(plan);
}
