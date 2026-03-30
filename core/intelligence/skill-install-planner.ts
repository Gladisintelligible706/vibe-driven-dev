/**
 * Skill Install Planner
 *
 * Builds phased install plans from scored skill recommendations.
 *
 * Instead of dumping everything at once, this module classifies
 * skills into phases based on the current VDD stage and project needs:
 *   Phase A — install now (immediate value)
 *   Phase B — install at scaffold/implementation
 *   Phase C — install later (mature phase)
 *
 * It also enforces installation safety limits and writes the
 * Skill-Install-Plan.md and Skill-Roadmap.md artifacts.
 */

import type { RankedSkillRecommendation, SkillRecommendationResult } from "./skill-recommender.js";
import type { RuntimeDetectionResult } from "./agent-runtime-detector.js";

export type InstallPhase = "A" | "B" | "C";

export interface PhasedSkillEntry {
  skillId: string;
  skillName: string;
  phase: InstallPhase;
  installCommand: string;
  score: number;
  why: string[];
  categories: string[];
}

export interface PhasedInstallPlan {
  phaseA: PhasedSkillEntry[];
  phaseB: PhasedSkillEntry[];
  phaseC: PhasedSkillEntry[];
  totalCandidateCount: number;
  autoInstallCount: number;
  deferredCount: number;
  detectedRuntime: string;
  installScope: "project" | "global";
  installCommands: string[];
  summary: string;
  /** find-skills prerequisite install command */
  findSkillsInstallCommand?: string | undefined;
  /** Discovery queries used to search the ecosystem */
  discoveryQueries?: string[] | undefined;
}

export interface InstallPlanArtifacts {
  installPlanMd: string;
  roadmapMd: string;
  recommendationsMd: string;
}

// Which categories are Phase A (immediate value)?
const PHASE_A_CATEGORIES = new Set([
  "debugging",
  "testing",
  "planning",
  "docs"
]);

// Which categories are Phase B (scaffold/implementation)?
const PHASE_B_CATEGORIES = new Set([
  "auth",
  "design",
  "MCP",
  "deployment",
  "security",
  "frontend",
  "backend",
  "AI integration"
]);

// Which categories are Phase C (mature phase)?
const PHASE_C_CATEGORIES = new Set([
  "performance",
  "product polish",
  "database"
]);

// Categories that get boosted to Phase A when the project explicitly needs them
const URGENT_GAP_BOOST = new Set([
  "auth",
  "security",
  "MCP",
  "AI integration"
]);

function classifyPhase(
  skill: RankedSkillRecommendation,
  currentStage: string | undefined,
  urgentGaps: Set<string>
): InstallPhase {
  const categories = skill.skill.categories;

  // If the skill directly addresses an urgent gap and has a strong score, Phase A
  if (categories.some((cat) => urgentGaps.has(cat) && skill.score >= 50)) {
    return "A";
  }

  // If all categories are Phase A material, install now
  if (categories.every((cat) => PHASE_A_CATEGORIES.has(cat))) {
    return "A";
  }

  // If the project is already at scaffold or later, more things become Phase A
  if (
    currentStage &&
    ["scaffold", "qa", "handoff"].includes(currentStage) &&
    categories.some((cat) => PHASE_B_CATEGORIES.has(cat))
  ) {
    return "A";
  }

  // If mostly Phase B categories, defer to scaffold
  if (categories.some((cat) => PHASE_B_CATEGORIES.has(cat))) {
    return "B";
  }

  // Otherwise Phase C
  return "C";
}

function buildInstallCommand(
  skillId: string,
  runtime: RuntimeDetectionResult
): string {
  const parts = ["npx skills add"];

  // Extract owner/repo from id format "owner/skill-name"
  const slashIndex = skillId.indexOf("/");
  if (slashIndex > 0) {
    parts.push(skillId.substring(0, slashIndex) + "/skills");
    parts.push(`--skill ${skillId.substring(slashIndex + 1)}`);
  } else {
    parts.push(skillId);
  }

  if (runtime.agentArg && runtime.confidence !== "none") {
    parts.push(`--agent ${runtime.agentArg}`);
  }

  parts.push("-y");

  return parts.join(" ");
}

/**
 * Build a phased install plan from scored skill recommendations.
 *
 * Limits automatic installation to MAX_AUTO_INSTALL_COUNT (default 3)
 * and defers everything else into a staged roadmap.
 *
 * find-skills is installed as a prerequisite before any other skill.
 */
export function buildPhasedInstallPlan(
  recommendationResult: SkillRecommendationResult,
  runtime: RuntimeDetectionResult,
  currentStage?: string | undefined,
  maxAutoInstall: number = 3,
  findSkillsInstallCommand?: string | undefined,
  discoveryQueries?: string[] | undefined
): PhasedInstallPlan {
  const urgentGaps = new Set<string>();

  // Boost auth, security, MCP, and AI gaps to urgent if the project clearly needs them
  for (const need of recommendationResult.projectNeeds) {
    if (URGENT_GAP_BOOST.has(need)) {
      urgentGaps.add(need);
    }
  }

  const allEntries: PhasedSkillEntry[] = recommendationResult.recommendations.map(
    (rec) => {
      const phase = classifyPhase(rec, currentStage, urgentGaps);
      return {
        skillId: rec.skill.id,
        skillName: rec.skill.name,
        phase,
        installCommand: buildInstallCommand(rec.skill.id, runtime),
        score: rec.score,
        why: rec.why,
        categories: rec.skill.categories
      };
    }
  );

  const phaseA = allEntries.filter((e) => e.phase === "A");
  const phaseB = allEntries.filter((e) => e.phase === "B");
  const phaseC = allEntries.filter((e) => e.phase === "C");

  // Limit Phase A to maxAutoInstall
  const limitedPhaseA = phaseA.slice(0, maxAutoInstall);
  const overflowToB = phaseA.slice(maxAutoInstall);

  const finalPhaseB = [...overflowToB, ...phaseB];
  const finalPhaseC = [...phaseC];

  const installCommands = [
    ...new Set(limitedPhaseA.map((e) => e.installCommand))
  ];

  return {
    phaseA: limitedPhaseA,
    phaseB: finalPhaseB,
    phaseC: finalPhaseC,
    totalCandidateCount: allEntries.length,
    autoInstallCount: limitedPhaseA.length,
    deferredCount: finalPhaseB.length + finalPhaseC.length,
    detectedRuntime: runtime.runtime,
    installScope: runtime.recommendedInstallScope,
    installCommands,
    summary:
      limitedPhaseA.length > 0
        ? `Installing ${limitedPhaseA.length} skills now. ${finalPhaseB.length} queued for scaffold, ${finalPhaseC.length} deferred for later.`
        : "No skills meet the auto-install threshold. All recommendations are in the roadmap.",
    findSkillsInstallCommand,
    discoveryQueries
  };
}

function renderInstallPlanMd(plan: PhasedInstallPlan): string {
  const lines: string[] = [
    "# Skill Install Plan",
    "",
    `**Runtime:** ${plan.detectedRuntime}`,
    `**Scope:** ${plan.installScope}`,
    `**Candidates evaluated:** ${plan.totalCandidateCount}`,
    `**Auto-install now:** ${plan.autoInstallCount}`,
    `**Deferred:** ${plan.deferredCount}`,
    ""
  ];

  // Prerequisite: find-skills installation
  if (plan.findSkillsInstallCommand) {
    lines.push("---");
    lines.push("");
    lines.push("## Prerequisite: find-skills");
    lines.push("");
    lines.push("Before any skill can be discovered or installed, find-skills is installed from the open ecosystem:");
    lines.push("");
    lines.push("```bash");
    lines.push(plan.findSkillsInstallCommand);
    lines.push("```");
    lines.push("");
  }

  // Discovery queries used
  if (plan.discoveryQueries && plan.discoveryQueries.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Discovery Queries");
    lines.push("");
    lines.push("These queries were used to search the skills ecosystem via find-skills:");
    lines.push("");
    for (const query of plan.discoveryQueries) {
      lines.push(`- \`${query}\``);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Phase A — Install Now");
  lines.push("");

  if (plan.phaseA.length === 0) {
    lines.push("_No skills selected for immediate installation._");
  } else {
    for (const entry of plan.phaseA) {
      lines.push(`### ${entry.skillName}`);
      lines.push(`- **Score:** ${entry.score}`);
      lines.push(`- **Categories:** ${entry.categories.join(", ")}`);
      lines.push(`- **Command:** \`${entry.installCommand}\``);
      lines.push(`- **Why:** ${entry.why.join(" ")}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Phase B — Install at Scaffold");
  lines.push("");

  if (plan.phaseB.length === 0) {
    lines.push("_No skills queued for scaffold phase._");
  } else {
    for (const entry of plan.phaseB) {
      lines.push(`### ${entry.skillName}`);
      lines.push(`- **Score:** ${entry.score}`);
      lines.push(`- **Categories:** ${entry.categories.join(", ")}`);
      lines.push(`- **Command:** \`${entry.installCommand}\``);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Phase C — Defer for Later");
  lines.push("");

  if (plan.phaseC.length === 0) {
    lines.push("_No skills deferred._");
  } else {
    for (const entry of plan.phaseC) {
      lines.push(`### ${entry.skillName}`);
      lines.push(`- **Score:** ${entry.score}`);
      lines.push(`- **Categories:** ${entry.categories.join(", ")}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderRoadmapMd(plan: PhasedInstallPlan, gapCategories: string[]): string {
  const lines: string[] = [
    "# Skill Roadmap",
    "",
    "This roadmap shows which skills are queued for future installation at each VDD stage.",
    "",
    `**Project gaps identified:** ${gapCategories.join(", ")}`,
    "",
    "---",
    "",
    "## Scaffold Phase",
    "",
    "Install these when the project enters scaffold or early implementation:",
    ""
  ];

  if (plan.phaseB.length === 0) {
    lines.push("_No skills queued._");
  } else {
    for (const entry of plan.phaseB) {
      lines.push(`- **${entry.skillName}** — ${entry.categories.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Post-Scaffold / Mature Phase");
  lines.push("");
  lines.push("Consider these after the project has a working foundation:");
  lines.push("");

  if (plan.phaseC.length === 0) {
    lines.push("_No skills queued._");
  } else {
    for (const entry of plan.phaseC) {
      lines.push(`- **${entry.skillName}** — ${entry.categories.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("_This roadmap is generated by VDD auto-skill-bootstrap. Re-run `/vibe.skills` to refresh._");

  return lines.join("\n");
}

function renderRecommendationsMd(
  plan: PhasedInstallPlan,
  recommendationResult: SkillRecommendationResult
): string {
  const lines: string[] = [
    "# Skill Recommendations",
    "",
    recommendationResult.summary,
    "",
    `**Detected runtime:** ${plan.detectedRuntime}`,
    `**Project needs:** ${recommendationResult.projectNeeds.join(", ")}`,
    "",
    "---",
    "",
    "## What Was Installed Now",
    ""
  ];

  if (plan.phaseA.length === 0) {
    lines.push("_No skills were auto-installed._");
  } else {
    for (const entry of plan.phaseA) {
      lines.push(`- **${entry.skillName}** — ${entry.why.join(" ")}`);
    }
  }

  lines.push("");
  lines.push("## What These Skills Improve");
  lines.push("");

  for (const improvement of recommendationResult.whatThisImproves) {
    lines.push(`- ${improvement}`);
  }

  lines.push("");
  lines.push("## Queued for Later");
  lines.push("");

  const deferred = [...plan.phaseB, ...plan.phaseC];
  if (deferred.length === 0) {
    lines.push("_Nothing queued._");
  } else {
    for (const entry of deferred) {
      lines.push(`- **${entry.skillName}** (${entry.phase === "B" ? "at scaffold" : "later"}) — ${entry.categories.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("_Generated by VDD auto-skill-bootstrap._");

  return lines.join("\n");
}

/**
 * Generate all three documentation artifacts for the install plan.
 */
export function generateInstallPlanArtifacts(
  plan: PhasedInstallPlan,
  recommendationResult: SkillRecommendationResult,
  gapCategories: string[]
): InstallPlanArtifacts {
  return {
    installPlanMd: renderInstallPlanMd(plan),
    roadmapMd: renderRoadmapMd(plan, gapCategories),
    recommendationsMd: renderRecommendationsMd(plan, recommendationResult)
  };
}
