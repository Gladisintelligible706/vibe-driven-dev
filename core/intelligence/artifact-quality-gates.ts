/**
 * Artifact Quality Gates
 *
 * Defines and evaluates quality gates for each layer of the post-PRD
 * artifact expansion. After each layer is generated, a quality pass
 * runs to verify:
 *
 *   1. Required artifacts exist
 *   2. Artifacts have required sections
 *   3. No contradictions between artifacts in the layer
 *   4. Upstream artifacts are referenced correctly
 *   5. Artifacts are specific enough for execution
 *
 * The evaluation loop follows the agentic-eval pattern:
 *   Generate → Evaluate → Critique → Refine
 *
 * Source: post-prd-artifact-expansion.md architecture document.
 */

import type { ArtifactLayer } from "./artifact-layer-planner.js";
import {
  getArtifactsForLayer,
  type ArtifactDefinition
} from "./artifact-layer-planner.js";
import type { ProjectState } from "../router/engine.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GateCheck {
  id: string;
  label: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
  artifactName?: string | undefined;
}

export interface LayerGateResult {
  layer: ArtifactLayer;
  passed: boolean;
  canContinue: boolean;
  checks: GateCheck[];
  missingArtifacts: string[];
  weakArtifacts: string[];
  contradictions: string[];
  summary: string;
}

export interface RefinementQuestion {
  artifactName: string;
  question: string;
  severity: "must-fix" | "should-fix" | "nice-to-have";
}

// ─── Refinement Question Templates ───────────────────────────────────────────

const REFINEMENT_QUESTIONS: RefinementQuestion[] = [
  {
    artifactName: "*",
    question: "Is this artifact grounded in the PRD?",
    severity: "must-fix"
  },
  {
    artifactName: "*",
    question: "Does it contradict another artifact?",
    severity: "must-fix"
  },
  {
    artifactName: "*",
    question: "Is it too vague for execution?",
    severity: "should-fix"
  },
  {
    artifactName: "*",
    question: "Does it hide major assumptions?",
    severity: "must-fix"
  },
  {
    artifactName: "*",
    question: "Does it omit non-goals or constraints?",
    severity: "should-fix"
  },
  {
    artifactName: "*",
    question: "Is it specific enough to guide implementation?",
    severity: "should-fix"
  },
  {
    artifactName: "*",
    question: "Does it create a misleading sense of certainty?",
    severity: "must-fix"
  },
  {
    artifactName: "Scope.md",
    question: "Are in-scope and out-of-scope items clearly separated?",
    severity: "must-fix"
  },
  {
    artifactName: "Open-Questions.md",
    question: "Are unresolved choices explicitly listed with impact assessment?",
    severity: "should-fix"
  },
  {
    artifactName: "Logic.md",
    question: "Are state transitions and edge cases described?",
    severity: "should-fix"
  },
  {
    artifactName: "Stack-Decision.md",
    question: "Are rejected alternatives documented with rationale?",
    severity: "must-fix"
  },
  {
    artifactName: "Architecture.md",
    question: "Are component boundaries and data flow clear?",
    severity: "must-fix"
  },
  {
    artifactName: "Dependencies.md",
    question: "Are risks and constraints for each dependency listed?",
    severity: "should-fix"
  },
  {
    artifactName: "Implementation-Plan.md",
    question: "Are cut lines defined for scope reduction?",
    severity: "should-fix"
  },
  {
    artifactName: "Risk-Register.md",
    question: "Are risks prioritized by likelihood and impact?",
    severity: "should-fix"
  },
  {
    artifactName: "anti-hallucination.md",
    question: "Are verification requirements specific and actionable?",
    severity: "must-fix"
  }
];

// ─── Gate Check Builders ─────────────────────────────────────────────────────

function checkArtifactExists(
  artifact: ArtifactDefinition,
  generatedArtifacts: Map<string, string>
): GateCheck {
  const content = generatedArtifacts.get(artifact.name);
  const exists = Boolean(content && content.trim().length > 50);

  return {
    id: `exists-${artifact.name}`,
    label: `${artifact.name} exists`,
    passed: exists,
    severity: "error",
    message: exists
      ? `${artifact.name} was generated.`
      : `${artifact.name} is missing or too short.`,
    artifactName: artifact.name
  };
}

function checkRequiredSections(
  artifact: ArtifactDefinition,
  content: string
): GateCheck[] {
  const checks: GateCheck[] = [];
  const lowerContent = content.toLowerCase();

  for (const section of artifact.requiredSections) {
    const found = lowerContent.includes(section.toLowerCase());
    checks.push({
      id: `section-${artifact.name}-${section.replace(/\s+/g, "-")}`,
      label: `${artifact.name} has "${section}"`,
      passed: found,
      severity: found ? "info" : "warning",
      message: found
        ? `Section "${section}" found in ${artifact.name}.`
        : `Section "${section}" not clearly present in ${artifact.name}.`,
      artifactName: artifact.name
    });
  }

  return checks;
}

function checkMinimumLength(
  artifact: ArtifactDefinition,
  content: string
): GateCheck {
  const lineCount = content.split("\n").filter((l) => l.trim().length > 0).length;
  const passed = lineCount >= 10;

  return {
    id: `length-${artifact.name}`,
    label: `${artifact.name} has sufficient content`,
    passed,
    severity: passed ? "info" : "warning",
    message: passed
      ? `${artifact.name} has ${lineCount} non-empty lines.`
      : `${artifact.name} has only ${lineCount} non-empty lines — may be too shallow.`,
    artifactName: artifact.name
  };
}

function checkCrossReferences(
  artifact: ArtifactDefinition,
  content: string,
  generatedArtifacts: Map<string, string>
): GateCheck[] {
  const checks: GateCheck[] = [];
  const lowerContent = content.toLowerCase();

  for (const dep of artifact.dependsOn) {
    const depRef = dep.replace(/\.md$/i, "").toLowerCase();
    const referenced =
      lowerContent.includes(depRef) ||
      lowerContent.includes(dep.toLowerCase());

    if (generatedArtifacts.has(dep)) {
      checks.push({
        id: `xref-${artifact.name}-${dep}`,
        label: `${artifact.name} references ${dep}`,
        passed: referenced,
        severity: referenced ? "info" : "warning",
        message: referenced
          ? `${artifact.name} references upstream artifact ${dep}.`
          : `${artifact.name} does not reference its dependency ${dep}. Consider adding cross-references.`,
        artifactName: artifact.name
      });
    }
  }

  return checks;
}

function checkTbdMarkers(content: string): GateCheck {
  const tbdCount = (content.match(/\bTBD\b/gi) || []).length;
  const passed = tbdCount <= 3;

  return {
    id: "tbd-count",
    label: "TBD count is reasonable",
    passed,
    severity: passed ? "info" : "warning",
    message: passed
      ? `Found ${tbdCount} TBD markers — acceptable.`
      : `Found ${tbdCount} TBD markers — too many may indicate incomplete thinking.`,
    artifactName: undefined
  };
}

// ─── Cross-Artifact Contradiction Detection ──────────────────────────────────

interface ContradictionPair {
  artifactA: string;
  artifactB: string;
  reason: string;
}

function detectContradictions(
  layerArtifacts: ArtifactDefinition[],
  generatedArtifacts: Map<string, string>
): ContradictionPair[] {
  const contradictions: ContradictionPair[] = [];

  // Check Scope vs Logic: Logic shouldn't describe out-of-scope features
  const scopeContent = generatedArtifacts.get("Scope.md")?.toLowerCase() ?? "";
  const logicContent = generatedArtifacts.get("Logic.md")?.toLowerCase() ?? "";

  if (scopeContent && logicContent) {
    // Extract out-of-scope items
    const outOfScopeMatch = scopeContent.match(
      /out.of.scope[:\s]*([\s\S]*?)(?=\n#|\n##|$)/i
    );
    if (outOfScopeMatch && outOfScopeMatch[1]) {
      const outOfScopeText = outOfScopeMatch[1];
      // Simple heuristic: check if logic describes something marked out of scope
      const outOfScopeItems = outOfScopeText
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"))
        .map((l) => l.replace(/^[\s\-\*]+/, "").trim().toLowerCase())
        .filter((l) => l.length > 3);

      for (const item of outOfScopeItems) {
        if (logicContent.includes(item) && item.length > 10) {
          contradictions.push({
            artifactA: "Scope.md",
            artifactB: "Logic.md",
            reason: `Logic.md appears to describe "${item}" which is marked out-of-scope in Scope.md.`
          });
        }
      }
    }
  }

  // Check Stack-Decision vs Dependencies: Dependencies should align with stack
  const stackContent = generatedArtifacts.get("Stack-Decision.md")?.toLowerCase() ?? "";
  const depsContent = generatedArtifacts.get("Dependencies.md")?.toLowerCase() ?? "";

  if (stackContent && depsContent) {
    // Check for frameworks mentioned in stack but not in dependencies
    const frameworkPatterns = [
      /react/g, /next\.?js/g, /vue/g, /svelte/g,
      /express/g, /fastify/g, /nestjs/g,
      /prisma/g, /drizzle/g, /supabase/g, /firebase/g
    ];

    for (const pattern of frameworkPatterns) {
      const inStack = pattern.test(stackContent);
      pattern.lastIndex = 0; // reset
      const inDeps = pattern.test(depsContent);
      pattern.lastIndex = 0;

      if (inStack && !inDeps) {
        // Stack mentions something Dependencies doesn't — possible gap
        // This is a soft signal, not a hard contradiction
      }
    }
  }

  return contradictions;
}

// ─── High-Impact Decision Detection ──────────────────────────────────────────

export interface HighImpactDecision {
  artifactName: string;
  decision: string;
  requiresApproval: boolean;
  reason: string;
}

export function detectHighImpactDecisions(
  generatedArtifacts: Map<string, string>
): HighImpactDecision[] {
  const decisions: HighImpactDecision[] = [];

  // Stack lock point
  const stackContent = generatedArtifacts.get("Stack-Decision.md");
  if (stackContent) {
    const hasAlternatives = /alternatives|rejected|considered/i.test(stackContent);
    if (hasAlternatives) {
      decisions.push({
        artifactName: "Stack-Decision.md",
        decision: "Stack lock",
        requiresApproval: true,
        reason: "Multiple stack options were considered. The choice should be confirmed before deeper execution."
      });
    }
  }

  // AI provider lock point
  const providerContent = generatedArtifacts.get("AI-Provider-Decision.md");
  if (providerContent) {
    decisions.push({
      artifactName: "AI-Provider-Decision.md",
      decision: "AI provider lock",
      requiresApproval: true,
      reason: "AI provider and model choice affects cost, latency, and quality. Confirm before implementation."
    });
  }

  // Event architecture lock point
  const eventContent = generatedArtifacts.get("Event-Architecture.md");
  if (eventContent) {
    decisions.push({
      artifactName: "Event-Architecture.md",
      decision: "Event architecture lock",
      requiresApproval: true,
      reason: "Event-driven patterns are hard to change later. Confirm the event architecture before implementation."
    });
  }

  // Execution commitment point
  const implContent = generatedArtifacts.get("Implementation-Plan.md");
  if (implContent) {
    decisions.push({
      artifactName: "Implementation-Plan.md",
      decision: "Execution commitment",
      requiresApproval: true,
      reason: "The implementation plan defines phases and cut lines. Confirm before treating it as execution truth."
    });
  }

  return decisions;
}

// ─── Layer Gate Evaluation ───────────────────────────────────────────────────

/**
 * Run quality gates for a specific layer after it has been generated.
 */
export function evaluateLayerGate(
  layer: ArtifactLayer,
  state: ProjectState | null,
  prdContent: string,
  generatedArtifacts: Map<string, string>
): LayerGateResult {
  const layerArtifacts = getArtifactsForLayer(layer, state, prdContent);
  const checks: GateCheck[] = [];
  const missingArtifacts: string[] = [];
  const weakArtifacts: string[] = [];

  for (const artifact of layerArtifacts) {
    // Check existence
    const existCheck = checkArtifactExists(artifact, generatedArtifacts);
    checks.push(existCheck);

    if (!existCheck.passed) {
      missingArtifacts.push(artifact.name);
      continue;
    }

    const content = generatedArtifacts.get(artifact.name) ?? "";

    // Check required sections
    const sectionChecks = checkRequiredSections(artifact, content);
    checks.push(...sectionChecks);

    // Check minimum length
    const lengthCheck = checkMinimumLength(artifact, content);
    checks.push(lengthCheck);
    if (!lengthCheck.passed) {
      weakArtifacts.push(artifact.name);
    }

    // Check cross-references
    const xrefChecks = checkCrossReferences(artifact, content, generatedArtifacts);
    checks.push(...xrefChecks);

    // Check TBD markers
    const tbdCheck = checkTbdMarkers(content);
    checks.push(tbdCheck);
  }

  // Cross-artifact contradiction detection
  const contradictions = detectContradictions(layerArtifacts, generatedArtifacts);
  for (const c of contradictions) {
    checks.push({
      id: `contradiction-${c.artifactA}-${c.artifactB}`,
      label: `No contradiction between ${c.artifactA} and ${c.artifactB}`,
      passed: false,
      severity: "error",
      message: c.reason
    });
  }

  const errorCount = checks.filter((c) => !c.passed && c.severity === "error").length;
  const warningCount = checks.filter((c) => !c.passed && c.severity === "warning").length;
  const passed = errorCount === 0;
  const canContinue = errorCount === 0 && missingArtifacts.length === 0;

  const summary = passed
    ? `Layer ${layer} passed quality gates. ${warningCount} warning(s) to review.`
    : `Layer ${layer} has ${errorCount} error(s) and ${warningCount} warning(s). ${missingArtifacts.length} artifact(s) missing.`;

  return {
    layer,
    passed,
    canContinue,
    checks,
    missingArtifacts,
    weakArtifacts,
    contradictions: contradictions.map((c) => c.reason),
    summary
  };
}

/**
 * Get refinement questions applicable to a specific artifact.
 */
export function getRefinementQuestions(artifactName: string): RefinementQuestion[] {
  return REFINEMENT_QUESTIONS.filter(
    (q) => q.artifactName === "*" || q.artifactName === artifactName
  );
}

/**
 * Check if the full expansion (all layers) is complete and ready for handoff.
 */
export function evaluateExpansionCompletion(
  state: ProjectState | null,
  prdContent: string,
  generatedArtifacts: Map<string, string>
): {
  complete: boolean;
  gates: LayerGateResult[];
  summary: string;
  highImpactDecisions: HighImpactDecision[];
} {
  const gates: LayerGateResult[] = [];

  for (const layer of [1, 2, 3] as ArtifactLayer[]) {
    gates.push(evaluateLayerGate(layer, state, prdContent, generatedArtifacts));
  }

  const allPassed = gates.every((g) => g.passed);
  const highImpactDecisions = detectHighImpactDecisions(generatedArtifacts);
  const pendingApprovals = highImpactDecisions.filter((d) => d.requiresApproval);

  const complete = allPassed && pendingApprovals.length === 0;

  const summary = complete
    ? "All expansion layers passed quality gates. The project is ready for execution."
    : !allPassed
    ? `Some layers have quality gate failures. Review the gate results.`
    : `${pendingApprovals.length} high-impact decision(s) require approval before execution.`;

  return {
    complete,
    gates,
    summary,
    highImpactDecisions
  };
}
