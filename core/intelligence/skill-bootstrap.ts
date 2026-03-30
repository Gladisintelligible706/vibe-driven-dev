/**
 * Skill Bootstrap Orchestrator
 *
 * The main intelligence module for the auto-skill-bootstrap flow.
 * Coordinates:
 *   1. Runtime detection (agent-runtime-detector.ts)
 *   2. find-skills installation via Skills CLI (find-skills-executor.ts)
 *   3. Project profile building (from skill-recommender.ts)
 *   4. Discovery plan generation (skill-discovery.ts)
 *   5. Live ecosystem discovery via find-skills CLI (find-skills-executor.ts)
 *   6. Skill recommendation (skill-recommender.ts) — merged catalog + CLI results
 *   7. Phased install planning (skill-install-planner.ts)
 *   8. Phase A skill installation via Skills CLI (find-skills-executor.ts)
 *   9. Artifact generation (Skill-Install-Plan.md, Skill-Roadmap.md, Skill-Recommendations.md)
 *
 * Trigger condition: user intent is captured, project type is identified,
 * runtime is detected, and enough gaps justify external skill discovery.
 *
 * This module executes real CLI commands when in "ready" state:
 * - installs find-skills first
 * - runs discovery queries against the ecosystem
 * - installs Phase A skills automatically
 * In "blocked" or "deferred" states, it produces advisory output only.
 */

import fs from "fs-extra";
import path from "node:path";
import {
  SkillRecommender,
  type SkillRecommendationResult,
  type SkillRecommendationProjectInput
} from "./skill-recommender.js";
import {
  detectAgentRuntime,
  type RuntimeDetectionResult
} from "./agent-runtime-detector.js";
import {
  generateDiscoveryPlan,
  type DiscoveryPlan
} from "./skill-discovery.js";
import {
  buildPhasedInstallPlan,
  generateInstallPlanArtifacts,
  type PhasedInstallPlan,
  type InstallPlanArtifacts
} from "./skill-install-planner.js";
import {
  installFindSkills,
  runDiscoveryQueries,
  deduplicateSkills,
  installSkills,
  buildFindSkillsInstallCommand,
  type FindSkillsInstallResult,
  type FindSkillsSearchResult,
  type DiscoveredSkill,
  type SkillInstallResult
} from "./find-skills-executor.js";
import type { ProjectState } from "../router/engine.js";

export type BootstrapReadiness = "ready" | "deferred" | "blocked";

export interface BootstrapReadinessCheck {
  readiness: BootstrapReadiness;
  reasons: string[];
  userIntentCaptured: boolean;
  projectTypeIdentified: boolean;
  runtimeDetected: boolean;
  gapsVisible: boolean;
  confidenceScore: number;
}

export interface SkillBootstrapResult {
  readiness: BootstrapReadinessCheck;
  runtime: RuntimeDetectionResult;
  projectInput: SkillRecommendationProjectInput;
  discoveryPlan: DiscoveryPlan;
  recommendationResult: SkillRecommendationResult;
  installPlan: PhasedInstallPlan;
  artifacts: InstallPlanArtifacts;
  userSummary: string;
  nextSteps: string[];
  // find-skills CLI integration results
  findSkillsInstall?: FindSkillsInstallResult | undefined;
  discoveryResults?: FindSkillsSearchResult[] | undefined;
  ecosystemSkills?: DiscoveredSkill[] | undefined;
  installResults?: SkillInstallResult[] | undefined;
}

const MIN_CONFIDENCE_THRESHOLD = 0.5;

function computeReadiness(
  state: ProjectState | null,
  runtime: RuntimeDetectionResult
): BootstrapReadinessCheck {
  const reasons: string[] = [];
  let confidenceScore = 0;

  // Check user intent capture
  const userIntentCaptured =
    Boolean(state?.problemStatement) &&
    Boolean(state?.targetUser) &&
    Boolean(state?.successDefinition);

  if (userIntentCaptured) {
    confidenceScore += 0.3;
  } else {
    reasons.push("User intent is not fully captured yet.");
  }

  // Check project type identification
  const projectTypeIdentified = Boolean(state?.projectType);
  if (projectTypeIdentified) {
    confidenceScore += 0.2;
  } else {
    reasons.push("Project type has not been identified.");
  }

  // Check runtime detection
  const runtimeDetected = runtime.confidence !== "none" && runtime.runtime !== "unknown";
  if (runtimeDetected) {
    confidenceScore += 0.25;
  } else {
    reasons.push("Agent runtime could not be detected. Using generic fallback.");
    // Partial credit for fallback
    confidenceScore += 0.1;
  }

  // Check visible gaps
  const gapsVisible =
    state?.hasAiFeatures === true ||
    state?.projectType === "saas" ||
    state?.projectType === "wrapper-app" ||
    state?.projectType === "internal-tool";

  if (gapsVisible) {
    confidenceScore += 0.25;
  } else {
    reasons.push("Not enough gap signals to justify skill discovery.");
  }

  // Clamp
  confidenceScore = Math.min(confidenceScore, 1.0);

  let readiness: BootstrapReadiness;
  if (confidenceScore >= MIN_CONFIDENCE_THRESHOLD && (userIntentCaptured || projectTypeIdentified)) {
    readiness = "ready";
  } else if (confidenceScore >= 0.3) {
    readiness = "deferred";
    reasons.push("Confidence is below threshold. Skill bootstrap will run later.");
  } else {
    readiness = "blocked";
    reasons.push("Insufficient project context for skill bootstrap.");
  }

  return {
    readiness,
    reasons,
    userIntentCaptured,
    projectTypeIdentified,
    runtimeDetected,
    gapsVisible,
    confidenceScore
  };
}

function buildUserSummary(result: {
  readiness: BootstrapReadinessCheck;
  runtime: RuntimeDetectionResult;
  installPlan: PhasedInstallPlan;
  recommendationResult: SkillRecommendationResult;
}): string {
  if (result.readiness.readiness === "blocked") {
    return "I need more information about your project before I can recommend skills. Let's keep working on the project setup.";
  }

  if (result.readiness.readiness === "deferred") {
    return "Your project is shaping up. I'll recommend the right coding-agent skills once the project profile is clearer.";
  }

  const runtimeName = result.runtime.runtime === "unknown" ? "generic mode" : result.runtime.runtime;
  const needs = result.recommendationResult.projectNeeds.slice(0, 4).join(", ");

  if (result.installPlan.phaseA.length === 0) {
    return [
      `I understand your project. It looks like it needs support in ${needs}.`,
      `I searched the skills ecosystem but the current recommendations don't meet the auto-install threshold.`,
      `You can run /vibe.skills to see the full shortlist.`
    ].join("\n");
  }

  const installedNames = result.installPlan.phaseA.map((e) => e.skillName).join(", ");
  const deferredCount = result.installPlan.deferredCount;

  return [
    `I understand the kind of project you want to build.`,
    `Before we go further, I'm equipping your coding agent (${runtimeName}) with the right skills.`,
    "",
    `First, I installed find-skills from the skills ecosystem so I can discover the best tools for your project.`,
    `Then I searched for skills matching your project needs and selected the strongest fits.`,
    "",
    `**Installing now:** ${installedNames}`,
    `**Why:** Your project needs stronger support in ${needs}.`,
    deferredCount > 0
      ? `**Queued for later:** ${deferredCount} additional skills are in the roadmap for when the project enters the next phase.`
      : "",
    "",
    `This keeps the setup focused and avoids clutter.`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildNextSteps(result: {
  readiness: BootstrapReadinessCheck;
  installPlan: PhasedInstallPlan;
}): string[] {
  if (result.readiness.readiness !== "ready") {
    return ["Continue building the project profile.", "Run /vibe.skills again after /vibe.init or /vibe.plan."];
  }

  const steps: string[] = [];

  if (result.installPlan.phaseA.length > 0) {
    steps.push("Review the installed skills in Skill-Recommendations.md.");
    steps.push("Continue with the current VDD workflow.");
  }

  if (result.installPlan.phaseB.length > 0) {
    steps.push(`When you reach the scaffold phase, ${result.installPlan.phaseB.length} more skills will be ready to install.`);
  }

  if (steps.length === 0) {
    steps.push("Continue with the current VDD workflow.");
  }

  return steps;
}

/**
 * Run the full auto-skill-bootstrap flow.
 *
 * This is the primary entry point. It:
 * - checks readiness (user intent, project type, runtime, gaps)
 * - detects the agent runtime
 * - builds the project profile
 * - generates discovery queries
 * - runs skill recommendation
 * - builds a phased install plan
 * - generates documentation artifacts
 * - returns a structured result with user-facing summary
 *
 * If readiness is "blocked" or "deferred", the result still contains
 * the readiness check and reasons, but install planning is skipped.
 */
export function runSkillBootstrap(
  projectRoot: string,
  state: ProjectState | null,
  args?: Record<string, string | boolean> | undefined
): SkillBootstrapResult {
  const explicitRuntime =
    typeof args?.runtime === "string"
      ? args.runtime
      : typeof args?.agent === "string"
      ? args.agent
      : undefined;

  const runtime = detectAgentRuntime(projectRoot, explicitRuntime);
  const readiness = computeReadiness(state, runtime);

  // Build minimal fallbacks when blocked/deferred
  if (readiness.readiness !== "ready") {
    const recommender = new SkillRecommender();
    const projectInput = recommender.buildProjectInput(projectRoot, state);
    const discoveryPlan = generateDiscoveryPlan(projectInput, state?.stage);
    const recommendationResult = recommender.recommend({
      runtimeTarget: runtime.runtime,
      top: 5,
      mode: "recommend",
      project: projectInput
    });
    const installPlan = buildPhasedInstallPlan(
      recommendationResult,
      runtime,
      state?.stage,
      undefined,
      buildFindSkillsInstallCommand(runtime),
      discoveryPlan.queries.map((q) => q.query)
    );
    const gapCategories = discoveryPlan.gapCategories;
    const artifacts = generateInstallPlanArtifacts(installPlan, recommendationResult, gapCategories);

    return {
      readiness,
      runtime,
      projectInput,
      discoveryPlan,
      recommendationResult,
      installPlan,
      artifacts,
      userSummary: buildUserSummary({
        readiness,
        runtime,
        installPlan,
        recommendationResult
      }),
      nextSteps: buildNextSteps({ readiness, installPlan })
    };
  }

  // Full flow for ready state
  // Step 1: Install find-skills first
  const findSkillsInstall = installFindSkills(runtime);

  // Step 2: Build project profile and discovery plan
  const recommender = new SkillRecommender();
  const projectInput = recommender.buildProjectInput(projectRoot, state);
  const discoveryPlan = generateDiscoveryPlan(projectInput, state?.stage);

  // Step 3: Run live ecosystem discovery via find-skills CLI
  const discoveryQueries = discoveryPlan.queries.map((q) => q.query);
  let discoveryResults: FindSkillsSearchResult[] = [];
  let ecosystemSkills: DiscoveredSkill[] = [];

  if (findSkillsInstall.success) {
    discoveryResults = runDiscoveryQueries(discoveryQueries);
    ecosystemSkills = deduplicateSkills(discoveryResults);
  }

  // Step 4: Run catalog-based recommendation with the detected runtime
  const recommendationResult = recommender.recommend({
    runtimeTarget: runtime.runtime,
    top: 8,
    mode: "recommend",
    project: projectInput
  });

  // Step 5: Build phased install plan
  const maxAutoInstall =
    typeof args?.["max-install"] === "string" && Number.isFinite(Number(args["max-install"]))
      ? Number(args["max-install"])
      : 3;

  const installPlan = buildPhasedInstallPlan(
    recommendationResult,
    runtime,
    state?.stage,
    maxAutoInstall,
    findSkillsInstall.success ? findSkillsInstall.command : undefined,
    discoveryQueries
  );

  // Step 6: Execute Phase A installs via CLI
  let installResults: SkillInstallResult[] = [];
  if (findSkillsInstall.success && installPlan.phaseA.length > 0) {
    const skillIdsToInstall = installPlan.phaseA.map((entry) => entry.skillId);
    installResults = installSkills(skillIdsToInstall, runtime);
  }

  const gapCategories = discoveryPlan.gapCategories;
  const artifacts = generateInstallPlanArtifacts(installPlan, recommendationResult, gapCategories);

  return {
    readiness,
    runtime,
    projectInput,
    discoveryPlan,
    recommendationResult,
    installPlan,
    artifacts,
    userSummary: buildUserSummary({
      readiness,
      runtime,
      installPlan,
      recommendationResult
    }),
    nextSteps: buildNextSteps({ readiness, installPlan }),
    findSkillsInstall,
    discoveryResults,
    ecosystemSkills,
    installResults
  };
}

/**
 * Write the generated artifacts to disk.
 *
 * Writes:
 * - Skill-Install-Plan.md
 * - Skill-Roadmap.md
 * - Skill-Recommendations.md
 *
 * Returns the list of file paths written.
 */
export function writeBootstrapArtifacts(
  projectRoot: string,
  artifacts: InstallPlanArtifacts
): string[] {
  const written: string[] = [];
  const files: Array<[string, string]> = [
    ["Skill-Install-Plan.md", artifacts.installPlanMd],
    ["Skill-Roadmap.md", artifacts.roadmapMd],
    ["Skill-Recommendations.md", artifacts.recommendationsMd]
  ];

  for (const [filename, content] of files) {
    const filePath = path.join(projectRoot, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    written.push(filePath);
  }

  return written;
}
