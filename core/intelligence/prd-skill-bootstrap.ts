/**
 * PRD Skill Bootstrap — Phased Orchestration
 *
 * Installs PRD-specific skills from the open skills ecosystem in
 * carefully staged phases BEFORE the VDD engine enters PRD writing.
 *
 * Phase structure (per prd-skill-stack.md architecture):
 *   Phase A — PRD Foundation:
 *     github/awesome-copilot --skill prd  (lead discovery)
 *     mattpocock/skills --skill write-a-prd  (drafting support)
 *
 *   Phase B — PRD Refinement (after first draft):
 *     deanpeters/product-manager-skills --skill prd-development  (PM review)
 *     github/awesome-copilot --skill breakdown-feature-prd  (feature split)
 *
 *   Phase C — PRD to Execution (after PRD is stable):
 *     mattpocock/skills --skill prd-to-plan  (plan conversion)
 *     mattpocock/skills --skill prd-to-issues  (issue conversion)
 *
 * Quality gates are enforced between phases so the orchestrator
 * never rushes ahead before the PRD has earned the transition.
 */

import type { InstallTargetId } from "../install/target-types.js";
import type { ProjectState } from "../router/engine.js";
import {
  detectAgentRuntime,
  type RuntimeDetectionResult
} from "./agent-runtime-detector.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PrdPhase = "A" | "B" | "C";

export interface PrdSkillEntry {
  id: string;
  name: string;
  owner: string;
  repo: string;
  installCommand: string;
  reason: string;
  priority: "essential" | "recommended" | "optional";
  phase: PrdPhase;
  role:
    | "lead-discovery"
    | "drafting-support"
    | "pm-refinement"
    | "feature-breakdown"
    | "plan-conversion"
    | "issue-conversion";
}

export interface PrdQualityGate {
  id: string;
  label: string;
  requiredFields: string[];
  passed: boolean;
  missingFields: string[];
}

export interface PrdPhaseResult {
  phase: PrdPhase;
  skillsInstalled: PrdSkillEntry[];
  installCommands: string[];
  qualityGate: PrdQualityGate;
  artifactsExpected: string[];
  ready: boolean;
}

export interface PrdBootstrapResult {
  ready: boolean;
  currentPhase: PrdPhase;
  runtime: RuntimeDetectionResult;
  phases: PrdPhaseResult[];
  allSkillsToInstall: PrdSkillEntry[];
  allInstallCommands: string[];
  skippedSkills: PrdSkillEntry[];
  summary: string;
  nextSteps: string[];
  qualityGates: PrdQualityGate[];
}

// ─── Canonical PRD Skills (phased) ──────────────────────────────────────────

const PRD_SKILLS: PrdSkillEntry[] = [
  // Phase A — Foundation
  {
    id: "github/awesome-copilot-prd",
    name: "prd",
    owner: "github",
    repo: "awesome-copilot",
    installCommand: "npx skills add github/awesome-copilot --skill prd",
    reason:
      "Lead PRD discovery skill — forces problem clarification, success metrics, constraints, non-goals, and structured drafting.",
    priority: "essential",
    phase: "A",
    role: "lead-discovery"
  },
  {
    id: "mattpocock/write-a-prd",
    name: "write-a-prd",
    owner: "mattpocock",
    repo: "skills",
    installCommand: "npx skills add mattpocock/skills --skill write-a-prd",
    reason:
      "Drafting support skill — transforms clarified input into a complete, structured PRD draft.",
    priority: "essential",
    phase: "A",
    role: "drafting-support"
  },
  // Phase B — Refinement
  {
    id: "deanpeters/prd-development",
    name: "prd-development",
    owner: "deanpeters",
    repo: "product-manager-skills",
    installCommand:
      "npx skills add deanpeters/product-manager-skills --skill prd-development",
    reason:
      "PM refinement skill — strengthens product framing, prioritization, acceptance criteria, and market context.",
    priority: "recommended",
    phase: "B",
    role: "pm-refinement"
  },
  {
    id: "github/awesome-copilot-breakdown-feature-prd",
    name: "breakdown-feature-prd",
    owner: "github",
    repo: "awesome-copilot",
    installCommand:
      "npx skills add github/awesome-copilot --skill breakdown-feature-prd",
    reason:
      "Feature breakdown skill — splits the PRD into feature units with clear hierarchy and relationships.",
    priority: "recommended",
    phase: "B",
    role: "feature-breakdown"
  },
  // Phase C — Execution Conversion
  {
    id: "mattpocock/prd-to-plan",
    name: "prd-to-plan",
    owner: "mattpocock",
    repo: "skills",
    installCommand: "npx skills add mattpocock/skills --skill prd-to-plan",
    reason:
      "Plan conversion skill — translates PRD content into a concrete execution plan with phases and milestones.",
    priority: "essential",
    phase: "C",
    role: "plan-conversion"
  },
  {
    id: "mattpocock/prd-to-issues",
    name: "prd-to-issues",
    owner: "mattpocock",
    repo: "skills",
    installCommand: "npx skills add mattpocock/skills --skill prd-to-issues",
    reason:
      "Issue conversion skill — converts PRD into actionable GitHub-style issues for execution.",
    priority: "optional",
    phase: "C",
    role: "issue-conversion"
  }
];

// ─── Quality Gates ───────────────────────────────────────────────────────────

function buildGate1(state: ProjectState | null): PrdQualityGate {
  const requiredFields = [
    "problemStatement",
    "targetUser",
    "successDefinition"
  ] as const;

  const missingFields = requiredFields.filter((f) => !state?.[f]);

  return {
    id: "gate-1-core-problem",
    label: "Core Problem Gate",
    requiredFields: [...requiredFields],
    passed: missingFields.length === 0,
    missingFields
  };
}

function buildGate2(prdContent: string): PrdQualityGate {
  const indicators = [
    { field: "scope / in-scope", pattern: /scope|in scope|out of scope/i },
    { field: "non-goals", pattern: /non[- ]?goal|exclusion/i },
    { field: "constraints", pattern: /constraint|limitation|boundary/i }
  ];

  const missingFields = indicators
    .filter((i) => !i.pattern.test(prdContent))
    .map((i) => i.field);

  return {
    id: "gate-2-scope",
    label: "Scope Gate",
    requiredFields: indicators.map((i) => i.field),
    passed: missingFields.length === 0,
    missingFields
  };
}

function buildGate3(prdContent: string): PrdQualityGate {
  const indicators = [
    { field: "success criteria", pattern: /success criteria|success metric|KPI/i },
    { field: "acceptance criteria", pattern: /acceptance criteria/i },
    { field: "validation", pattern: /validat|measur/i }
  ];

  const missingFields = indicators
    .filter((i) => !i.pattern.test(prdContent))
    .map((i) => i.field);

  return {
    id: "gate-3-success",
    label: "Success Gate",
    requiredFields: indicators.map((i) => i.field),
    passed: missingFields.length === 0,
    missingFields
  };
}

function buildGate4(prdContent: string): PrdQualityGate {
  const indicators = [
    { field: "technical assumptions", pattern: /technical|architecture|assumption/i },
    { field: "integration", pattern: /integration|API|third.party/i },
    { field: "security / privacy", pattern: /security|privacy|auth/i }
  ];

  const missingFields = indicators
    .filter((i) => !i.pattern.test(prdContent))
    .map((i) => i.field);

  return {
    id: "gate-4-technical-bridge",
    label: "Technical Bridge Gate",
    requiredFields: indicators.map((i) => i.field),
    passed: missingFields.length === 0,
    missingFields
  };
}

function buildGate5(
  artifactsCreated: string[]
): PrdQualityGate {
  const required = ["Feature-Breakdown.md", "Implementation-Plan.md", "Execution-Issues.md"];
  const missingFields = required.filter(
    (a) => !artifactsCreated.includes(a)
  );

  return {
    id: "gate-5-execution",
    label: "Execution Gate",
    requiredFields: required,
    passed: missingFields.length === 0,
    missingFields
  };
}

/**
 * Run quality gate checks.
 *
 * If `prdContent` is provided, full content-based gates (2-4) are evaluated.
 * Otherwise only the state-based Gate 1 is evaluated.
 */
export function runPrdQualityGates(
  state: ProjectState | null,
  prdContent?: string,
  artifactsCreated?: string[]
): PrdQualityGate[] {
  return [
    buildGate1(state),
    ...(prdContent
      ? [buildGate2(prdContent), buildGate3(prdContent), buildGate4(prdContent)]
      : []),
    buildGate5(artifactsCreated ?? [])
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function appendAgentFlag(
  command: string,
  agentArg: string | undefined
): string {
  if (!agentArg) return command;
  if (command.includes("--agent")) return command;
  return `${command} --agent ${agentArg}`;
}

function appendScopeFlags(command: string): string {
  if (command.includes("-y")) return command;
  return `${command} -y`;
}

function skillsForPhase(phase: PrdPhase): PrdSkillEntry[] {
  return PRD_SKILLS.filter((s) => s.phase === phase);
}

// ─── Core Orchestration ─────────────────────────────────────────────────────

/**
 * Run a single PRD phase.
 *
 * Evaluates the quality gate for that phase, selects skills,
 * and returns the phase result.
 */
function runPhase(
  phase: PrdPhase,
  state: ProjectState | null,
  runtime: RuntimeDetectionResult,
  prdContent?: string,
  artifactsCreated?: string[]
): PrdPhaseResult {
  const agentArg = runtime.agentArg;
  const skills = skillsForPhase(phase);

  const installCommands = skills.map((s) => {
    let cmd = s.installCommand;
    cmd = appendAgentFlag(cmd, agentArg);
    cmd = appendScopeFlags(cmd);
    return cmd;
  });

  let gate: PrdQualityGate;
  let artifactsExpected: string[];

  switch (phase) {
    case "A":
      gate = buildGate1(state);
      artifactsExpected = ["PRD.md"];
      break;
    case "B":
      gate = prdContent
        ? foldGates([buildGate2(prdContent), buildGate3(prdContent)])
        : gateStub("gate-2-3-refinement", "Refinement Gate");
      artifactsExpected = ["Feature-Breakdown.md"];
      break;
    case "C":
      gate = buildGate5(artifactsCreated ?? []);
      artifactsExpected = ["Implementation-Plan.md", "Execution-Issues.md"];
      break;
  }

  return {
    phase,
    skillsInstalled: skills,
    installCommands,
    qualityGate: gate,
    artifactsExpected,
    ready: gate.passed
  };
}

function foldGates(gates: PrdQualityGate[]): PrdQualityGate {
  const allRequired = gates.flatMap((g) => g.requiredFields);
  const allMissing = gates.flatMap((g) => g.missingFields);
  return {
    id: gates.map((g) => g.id).join("+"),
    label: gates.map((g) => g.label).join(" + "),
    requiredFields: allRequired,
    passed: allMissing.length === 0,
    missingFields: allMissing
  };
}

function gateStub(id: string, label: string): PrdQualityGate {
  return {
    id,
    label,
    requiredFields: [],
    passed: false,
    missingFields: ["PRD content not yet available for validation"]
  };
}

// ─── User-Facing Summary ────────────────────────────────────────────────────

function buildUserSummary(result: PrdBootstrapResult): string {
  if (!result.ready) {
    return [
      "PRD skill bootstrap could not start — insufficient project context.",
      "The PRD will be generated using built-in VDD capabilities.",
      "",
      result.runtime.fallbackReason ?? ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const runtimeName =
    result.runtime.runtime === "unknown"
      ? "generic mode"
      : result.runtime.runtime;

  const phaseDescriptions = result.phases
    .filter((p) => p.skillsInstalled.length > 0)
    .map((p) => {
      const names = p.skillsInstalled.map((s) => s.name).join(", ");
      return `  Phase ${p.phase}: ${names}`;
    });

  return [
    `I'm preparing your coding agent (${runtimeName}) to produce a high-quality PRD.`,
    "",
    "PRD skill stack installation:",
    ...phaseDescriptions,
    "",
    "Installation order matters:",
    "  Phase A installs first — discovery + drafting",
    "  Phase B installs after first draft — PM review + feature breakdown",
    "  Phase C installs after PRD is stable — plan + issue conversion",
    "",
    "Phase A skills are being installed now. Phases B and C will activate",
    "automatically after their respective quality gates pass."
  ].join("\n");
}

function buildNextSteps(result: PrdBootstrapResult): string[] {
  if (!result.ready) {
    return [
      "Continue building the project profile.",
      "Run /vibe.skills-bootstrap after more context is available."
    ];
  }

  const steps: string[] = [
    "Phase A skills installed — ready for PRD discovery and drafting.",
    "The lead PRD skill will guide discovery: problem, success metrics, constraints.",
    "The drafting skill will generate the first complete PRD draft."
  ];

  const gate1 = result.qualityGates.find((g) => g.id === "gate-1-core-problem");
  if (gate1 && !gate1.passed) {
    steps.unshift(
      `Gate 1 blocked: missing ${gate1.missingFields.join(", ")}. Resolve before continuing.`
    );
  }

  return steps;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Run the full PRD skill bootstrap with phased installation.
 *
 * This is the primary entry point called by the engine at scaffold stage.
 * It installs Phase A skills immediately, and documents Phase B/C for
 * sequential activation after their quality gates pass.
 *
 * Returns a structured result the orchestrator can use to:
 * - announce what was installed
 * - report quality gate status
 * - hand off to PRD generation with the right skills active
 */
export function runPrdSkillBootstrap(
  projectRoot: string,
  state: ProjectState | null,
  args?: Record<string, string | boolean> | undefined
): PrdBootstrapResult {
  const explicitRuntime =
    typeof args?.runtime === "string"
      ? args.runtime
      : typeof args?.agent === "string"
      ? args.agent
      : undefined;

  const runtime = detectAgentRuntime(projectRoot, explicitRuntime);

  // Readiness check
  const hasProjectContext =
    Boolean(state?.problemStatement) || Boolean(state?.projectType);
  const ready = hasProjectContext && runtime.confidence !== "none";

  // Run all three phases
  const phases: PrdPhaseResult[] = (
    ["A", "B", "C"] as PrdPhase[]
  ).map((p) => runPhase(p, state, runtime));

  const allSkillsToInstall = PRD_SKILLS;
  const allInstallCommands = PRD_SKILLS.map((s) => {
    let cmd = s.installCommand;
    cmd = appendAgentFlag(cmd, runtime.agentArg);
    cmd = appendScopeFlags(cmd);
    return cmd;
  });

  // Gate 1 is evaluated immediately (state-based)
  const gate1 = buildGate1(state);
  const qualityGates: PrdQualityGate[] = [gate1];

  // Always start at Phase A; Phase B/C unlock after gate progression
  const currentPhase: PrdPhase = "A";

  const result: PrdBootstrapResult = {
    ready,
    currentPhase,
    runtime,
    phases,
    allSkillsToInstall,
    allInstallCommands,
    skippedSkills: ready ? [] : PRD_SKILLS,
    summary: "",
    nextSteps: [],
    qualityGates
  };

  result.summary = buildUserSummary(result);
  result.nextSteps = buildNextSteps(result);

  return result;
}

/**
 * Render the PRD bootstrap result as a Markdown artifact.
 */
export function renderPrdBootstrapMd(result: PrdBootstrapResult): string {
  const lines: string[] = [
    "# PRD Skill Bootstrap",
    "",
    `**Runtime:** ${result.runtime.runtime}`,
    `**Ready:** ${result.ready ? "Yes" : "No"}`,
    `**Current Phase:** ${result.currentPhase}`,
    "",
    "---",
    "",
    "## Phase A — PRD Foundation (Install First)",
    "",
    "Lead discovery + drafting support skills:",
    ""
  ];

  const phaseA = PRD_SKILLS.filter((s) => s.phase === "A");
  const phaseB = PRD_SKILLS.filter((s) => s.phase === "B");
  const phaseC = PRD_SKILLS.filter((s) => s.phase === "C");

  for (const skill of phaseA) {
    lines.push(`### ${skill.name} (${skill.role})`);
    lines.push(`- **Source:** ${skill.owner}/${skill.repo}`);
    lines.push(`- **Priority:** ${skill.priority}`);
    lines.push(`- **Reason:** ${skill.reason}`);
    lines.push(`- **Command:** \`${skill.installCommand}\``);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Phase B — PRD Refinement (After First Draft)");
  lines.push("");
  lines.push("PM review + feature breakdown skills:");
  lines.push("");

  for (const skill of phaseB) {
    lines.push(`### ${skill.name} (${skill.role})`);
    lines.push(`- **Source:** ${skill.owner}/${skill.repo}`);
    lines.push(`- **Priority:** ${skill.priority}`);
    lines.push(`- **Reason:** ${skill.reason}`);
    lines.push(`- **Command:** \`${skill.installCommand}\``);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Phase C — PRD to Execution (After PRD Is Stable)");
  lines.push("");
  lines.push("Plan + issue conversion skills:");
  lines.push("");

  for (const skill of phaseC) {
    lines.push(`### ${skill.name} (${skill.role})`);
    lines.push(`- **Source:** ${skill.owner}/${skill.repo}`);
    lines.push(`- **Priority:** ${skill.priority}`);
    lines.push(`- **Reason:** ${skill.reason}`);
    lines.push(`- **Command:** \`${skill.installCommand}\``);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Quality Gates");
  lines.push("");
  lines.push("The PRD stage is not done until these gates pass:");
  lines.push("");

  for (const gate of result.qualityGates) {
    const status = gate.passed ? "PASSED" : "BLOCKED";
    lines.push(`- **${gate.label}** — ${status}`);
    if (gate.missingFields.length > 0) {
      lines.push(`  Missing: ${gate.missingFields.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("## Expected Artifacts");
  lines.push("");
  lines.push("- PRD.md");
  lines.push("- Feature-Breakdown.md");
  lines.push("- Implementation-Plan.md");
  lines.push("- Execution-Issues.md");
  lines.push("- (Optional) Acceptance-Criteria.md");
  lines.push("- (Optional) Open-Questions.md");
  lines.push("- (Optional) Risk-Register.md");
  lines.push("");
  lines.push("_Generated by VDD PRD Skill Bootstrap._");

  return lines.join("\n");
}
