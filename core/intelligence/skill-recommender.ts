import fs from "fs-extra";
import path from "node:path";
import type { InstallTargetId } from "../install/target-types.js";
import type { ProjectState } from "../router/engine.js";

export type SkillRecommendationCategory =
  | "planning"
  | "design"
  | "frontend"
  | "backend"
  | "auth"
  | "database"
  | "testing"
  | "debugging"
  | "performance"
  | "security"
  | "MCP"
  | "docs"
  | "deployment"
  | "AI integration"
  | "product polish";

export interface SkillRecommendationProjectInput {
  projectType?: "saas" | "internal-tool" | "mvp" | "content-site" | "wrapper-app";
  currentStage?: string | undefined;
  platform?: string | undefined;
  targetUser?: string | undefined;
  successDefinition?: string | undefined;
  stackHints?: string[] | undefined;
  artifacts?: string[] | undefined;
  hasAiFeatures?: boolean | undefined;
  needsAuth?: boolean | undefined;
  needsDatabase?: boolean | undefined;
  frontendHeavy?: boolean | undefined;
  backendHeavy?: boolean | undefined;
  needsTesting?: boolean | undefined;
  performanceSensitive?: boolean | undefined;
  securitySensitive?: boolean | undefined;
  designSensitive?: boolean | undefined;
  needsExecutionDiscipline?: boolean | undefined;
  handoffReady?: boolean | undefined;
}

export interface SkillRecommendationInput {
  project: SkillRecommendationProjectInput;
  runtimeTarget: InstallTargetId | "unknown";
  installedSkills?: string[] | undefined;
  category?: string | undefined;
  gap?: string | undefined;
  bundle?: string | undefined;
  top?: number | undefined;
  mode?: "recommend" | "explain" | "install" | undefined;
}

export interface SkillCatalogEntry {
  id: string;
  name: string;
  owner: string;
  repo: string;
  summary: string;
  categories: SkillRecommendationCategory[];
  runtimeSupport: Array<InstallTargetId | "generic">;
  stackTags: string[];
  installCountSignal: number;
  sourceQualitySignal: number;
  installCommand: string;
  sourceType?: "ecosystem-skill" | "major-capability";
}

export interface CapabilityBundleManifest {
  id: string;
  title: string;
  summary: string;
  primaryAgent: string;
  projectTypes: Array<NonNullable<SkillRecommendationProjectInput["projectType"]>>;
  recommendedStages: string[];
  categories: SkillRecommendationCategory[];
  capabilities: string[];
}

export interface SpecialistCapabilityProfile {
  agent: string;
  ownsStages: string[];
  ownsCategories: SkillRecommendationCategory[];
  internalSkills: string[];
  externalCapabilities: string[];
  escalatesTo: string[];
  summary: string;
}

export interface CapabilityBundleRecommendation {
  bundle: CapabilityBundleManifest;
  why: string[];
  matchedCapabilities: string[];
}

export interface SpecialistRecommendation {
  agent: string;
  summary: string;
  why: string[];
  internalSkills: string[];
  externalCapabilities: string[];
  suggestedBundleIds: string[];
}

export interface RankedSkillRecommendation {
  skill: SkillCatalogEntry;
  score: number;
  breakdown: {
    projectFit: number;
    runtimeCompatibility: number;
    stackFit: number;
    installSignal: number;
    sourceQuality: number;
    overlapPenalty: number;
  };
  why: string[];
  installCommand: string;
}

export interface SkillRecommendationResult {
  mode: "recommend" | "explain" | "install";
  detectedRuntime: InstallTargetId | "unknown";
  projectNeeds: string[];
  selectedBundle?: string | undefined;
  recommendedBundles: CapabilityBundleRecommendation[];
  recommendedSpecialists: SpecialistRecommendation[];
  recommendations: RankedSkillRecommendation[];
  installPlan: string[];
  summary: string;
  whatThisImproves: string[];
}

const CATALOG: SkillCatalogEntry[] = [
  {
    id: "vercel-labs/find-skills",
    name: "find-skills",
    owner: "vercel-labs",
    repo: "skills",
    summary: "Discover installable skills and uncover missing capability gaps faster.",
    categories: ["planning", "docs", "product polish"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["discovery", "workflow"],
    installCountSignal: 15,
    sourceQualitySignal: 10,
    installCommand: "npx skills add vercel-labs/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "openai/next-best-practices",
    name: "next-best-practices",
    owner: "openai",
    repo: "skills",
    summary: "Improve Next.js architecture, App Router usage, and deployment safety.",
    categories: ["frontend", "performance", "deployment"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["next", "react", "frontend"],
    installCountSignal: 13,
    sourceQualitySignal: 10,
    installCommand: "npx skills add openai/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "vercel-labs/systematic-debugging",
    name: "systematic-debugging",
    owner: "vercel-labs",
    repo: "skills",
    summary: "Apply disciplined debugging workflows to isolate failures and regressions.",
    categories: ["debugging", "testing", "backend"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["debugging", "quality", "workflow"],
    installCountSignal: 14,
    sourceQualitySignal: 9,
    installCommand: "npx skills add vercel-labs/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "vercel-labs/test-driven-development",
    name: "test-driven-development",
    owner: "vercel-labs",
    repo: "skills",
    summary: "Strengthen test-first implementation and regression safety.",
    categories: ["testing", "frontend", "backend"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["testing", "quality", "workflow"],
    installCountSignal: 13,
    sourceQualitySignal: 9,
    installCommand: "npx skills add vercel-labs/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "better-auth/better-auth-best-practices",
    name: "better-auth-best-practices",
    owner: "better-auth",
    repo: "skills",
    summary: "Improve authentication decisions, session handling, and auth implementation safety.",
    categories: ["auth", "security", "backend"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["auth", "security", "backend"],
    installCountSignal: 11,
    sourceQualitySignal: 8,
    installCommand: "npx skills add better-auth/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "vercel-labs/webapp-testing",
    name: "webapp-testing",
    owner: "vercel-labs",
    repo: "skills",
    summary: "Increase confidence in UI-heavy apps with deterministic web app testing flows.",
    categories: ["testing", "frontend", "product polish"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["testing", "frontend", "react", "next"],
    installCountSignal: 12,
    sourceQualitySignal: 9,
    installCommand: "npx skills add vercel-labs/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "openai/mcp-builder",
    name: "mcp-builder",
    owner: "openai",
    repo: "skills",
    summary: "Design, implement, and test MCP servers for tool-rich AI products.",
    categories: ["MCP", "AI integration", "backend"],
    runtimeSupport: ["claude-code", "codex", "opencode", "gemini-cli", "generic"],
    stackTags: ["mcp", "ai", "integration", "backend"],
    installCountSignal: 12,
    sourceQualitySignal: 10,
    installCommand: "npx skills add openai/skills",
    sourceType: "ecosystem-skill"
  },
  {
    id: "shadcn/shadcn",
    name: "shadcn",
    owner: "shadcn",
    repo: "skills",
    summary: "Accelerate component composition and improve UI system consistency.",
    categories: ["frontend", "design", "product polish"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["shadcn", "tailwind", "react", "frontend", "design"],
    installCountSignal: 14,
    sourceQualitySignal: 8,
    installCommand: "npx skills add shadcn/shadcn",
    sourceType: "ecosystem-skill"
  },
  {
    id: "github/spec-kit",
    name: "spec-kit",
    owner: "github",
    repo: "spec-kit",
    summary: "Structured execution system that turns grounded specs into implementation plans, tasks, and gated delivery.",
    categories: ["planning", "docs", "testing"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["workflow", "spec", "execution", "handoff"],
    installCountSignal: 12,
    sourceQualitySignal: 10,
    installCommand: "uv tool install specify-cli --from git+https://github.com/github/spec-kit.git",
    sourceType: "major-capability"
  },
  {
    id: "pbakaus/impeccable",
    name: "impeccable",
    owner: "pbakaus",
    repo: "impeccable",
    summary: "Design specialist capability for stronger visual direction, frontend polish, and more intentional UI output.",
    categories: ["design", "frontend", "product polish"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["design", "frontend", "ui", "polish", "visual"],
    installCountSignal: 11,
    sourceQualitySignal: 9,
    installCommand: "npx skills add pbakaus/impeccable",
    sourceType: "major-capability"
  },
  {
    id: "github/awesome-copilot-prd",
    name: "prd",
    owner: "github",
    repo: "awesome-copilot",
    summary: "Product Requirements Document skill that guides structured PRD creation with sections for goals, requirements, constraints, and acceptance criteria.",
    categories: ["planning", "docs"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["prd", "planning", "requirements", "product"],
    installCountSignal: 10,
    sourceQualitySignal: 9,
    installCommand: "npx skills add github/awesome-copilot --skill prd",
    sourceType: "ecosystem-skill"
  },
  {
    id: "github/awesome-copilot-breakdown-feature-prd",
    name: "breakdown-feature-prd",
    owner: "github",
    repo: "awesome-copilot",
    summary: "Breaks down a feature into a structured PRD with user stories, technical specs, and implementation boundaries.",
    categories: ["planning", "docs"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "gemini-cli", "generic"],
    stackTags: ["prd", "feature-breakdown", "planning", "user-stories"],
    installCountSignal: 9,
    sourceQualitySignal: 9,
    installCommand: "npx skills add github/awesome-copilot --skill breakdown-feature-prd",
    sourceType: "ecosystem-skill"
  },
  {
    id: "mattpocock/write-a-prd",
    name: "write-a-prd",
    owner: "mattpocock",
    repo: "skills",
    summary: "Writes a high-quality PRD from a project idea, transforming vague concepts into structured, actionable requirements.",
    categories: ["planning", "docs"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["prd", "planning", "requirements", "writing"],
    installCountSignal: 12,
    sourceQualitySignal: 10,
    installCommand: "npx skills add mattpocock/skills --skill write-a-prd",
    sourceType: "ecosystem-skill"
  },
  {
    id: "mattpocock/prd-to-issues",
    name: "prd-to-issues",
    owner: "mattpocock",
    repo: "skills",
    summary: "Converts a PRD into actionable GitHub issues with clear scopes, dependencies, and acceptance criteria.",
    categories: ["planning", "docs", "testing"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["prd", "issues", "project-management", "planning", "handoff"],
    installCountSignal: 10,
    sourceQualitySignal: 10,
    installCommand: "npx skills add mattpocock/skills --skill prd-to-issues",
    sourceType: "ecosystem-skill"
  },
  {
    id: "mattpocock/prd-to-plan",
    name: "prd-to-plan",
    owner: "mattpocock",
    repo: "skills",
    summary: "Transforms a PRD into an implementation plan with phases, milestones, and technical decisions.",
    categories: ["planning", "docs"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["prd", "planning", "implementation-plan", "milestones"],
    installCountSignal: 10,
    sourceQualitySignal: 10,
    installCommand: "npx skills add mattpocock/skills --skill prd-to-plan",
    sourceType: "ecosystem-skill"
  },
  {
    id: "deanpeters/prd-development",
    name: "prd-development",
    owner: "deanpeters",
    repo: "product-manager-skills",
    summary: "Product management skill for developing comprehensive PRDs with market context, user personas, and success metrics.",
    categories: ["planning", "docs", "product polish"],
    runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic"],
    stackTags: ["prd", "product-management", "planning", "personas", "metrics"],
    installCountSignal: 8,
    sourceQualitySignal: 9,
    installCommand: "npx skills add deanpeters/product-manager-skills --skill prd-development",
    sourceType: "ecosystem-skill"
  }
];

const DEFAULT_BUNDLES: CapabilityBundleManifest[] = [
  {
    id: "mvp-core",
    title: "MVP Core",
    summary: "Core delivery hardening for fast-moving MVP work.",
    primaryAgent: "planner",
    projectTypes: ["mvp", "saas", "wrapper-app"],
    recommendedStages: ["init", "plan", "research", "blueprint"],
    categories: ["planning", "debugging", "testing"],
    capabilities: ["find-skills", "systematic-debugging", "test-driven-development"]
  },
  {
    id: "frontend-polish",
    title: "Frontend Polish",
    summary: "Design-sensitive bundle for UI-heavy products that need stronger visual quality and frontend testing confidence.",
    primaryAgent: "architect",
    projectTypes: ["saas", "wrapper-app", "content-site", "mvp"],
    recommendedStages: ["blueprint", "detail", "scaffold"],
    categories: ["design", "frontend", "product polish"],
    capabilities: ["impeccable", "shadcn", "webapp-testing"]
  },
  {
    id: "ai-wrapper",
    title: "AI Wrapper",
    summary: "Capability set for AI-heavy wrapper apps that need tool integration discipline and testing confidence.",
    primaryAgent: "architect",
    projectTypes: ["wrapper-app", "saas"],
    recommendedStages: ["plan", "research", "blueprint", "detail"],
    categories: ["AI integration", "MCP", "testing"],
    capabilities: ["find-skills", "mcp-builder", "systematic-debugging"]
  },
  {
    id: "auth-safe-app",
    title: "Auth Safe App",
    summary: "Bundle for apps that rely on accounts, sessions, and security-sensitive flows.",
    primaryAgent: "detailer",
    projectTypes: ["saas", "internal-tool", "wrapper-app"],
    recommendedStages: ["blueprint", "detail", "scaffold", "qa"],
    categories: ["auth", "security", "testing"],
    capabilities: ["better-auth-best-practices", "webapp-testing", "systematic-debugging"]
  },
  {
    id: "mcp-app",
    title: "MCP App",
    summary: "Bundle for tool-connected apps that depend on MCP or agent-facing integration surfaces.",
    primaryAgent: "architect",
    projectTypes: ["wrapper-app", "saas", "internal-tool"],
    recommendedStages: ["research", "blueprint", "detail", "qa"],
    categories: ["MCP", "AI integration", "backend"],
    capabilities: ["mcp-builder", "systematic-debugging", "test-driven-development"]
  },
  {
    id: "execution-handoff",
    title: "Execution Handoff",
    summary: "Structured implementation bundle for projects ready to move into disciplined execution.",
    primaryAgent: "handoff-manager",
    projectTypes: ["saas", "wrapper-app", "internal-tool", "mvp"],
    recommendedStages: ["detail", "scaffold", "qa", "handoff"],
    categories: ["planning", "docs", "testing"],
    capabilities: ["spec-kit", "systematic-debugging", "test-driven-development"]
  }
];

const DEFAULT_PROFILES: SpecialistCapabilityProfile[] = [
  {
    agent: "planner",
    ownsStages: ["init", "plan"],
    ownsCategories: ["planning"],
    internalSkills: ["vibe-plan", "assumptions-manager"],
    externalCapabilities: ["find-skills"],
    escalatesTo: ["researcher", "architect"],
    summary: "Owns product framing, scope shaping, and measurable planning truth."
  },
  {
    agent: "researcher",
    ownsStages: ["plan", "research"],
    ownsCategories: ["debugging", "docs", "security"],
    internalSkills: ["vibe-research"],
    externalCapabilities: ["find-skills", "systematic-debugging"],
    escalatesTo: ["architect", "qa-guardian"],
    summary: "Owns risk discovery, alternatives, and evidence gathering before major design decisions."
  },
  {
    agent: "architect",
    ownsStages: ["research", "blueprint", "detail"],
    ownsCategories: ["frontend", "backend", "design", "AI integration", "MCP", "deployment", "performance"],
    internalSkills: ["vibe-blueprint", "stack-advisor", "ai-provider-selector", "decision-ledger"],
    externalCapabilities: ["impeccable", "mcp-builder", "next-best-practices", "shadcn"],
    escalatesTo: ["detailer", "qa-guardian"],
    summary: "Owns system boundaries, stack decisions, provider choices, and design-sensitive architecture direction."
  },
  {
    agent: "detailer",
    ownsStages: ["blueprint", "detail", "scaffold"],
    ownsCategories: ["auth", "database", "testing", "performance", "security"],
    internalSkills: ["vibe-detail"],
    externalCapabilities: ["better-auth-best-practices", "webapp-testing", "test-driven-development", "systematic-debugging"],
    escalatesTo: ["architect", "qa-guardian"],
    summary: "Owns execution-ready detail, validation planning, and targeted hardening before scaffold and QA."
  },
  {
    agent: "qa-guardian",
    ownsStages: ["scaffold", "qa"],
    ownsCategories: ["testing", "debugging", "security", "performance"],
    internalSkills: ["vibe-qa"],
    externalCapabilities: ["systematic-debugging", "test-driven-development", "webapp-testing"],
    escalatesTo: ["handoff-manager"],
    summary: "Owns quality gates, readiness checks, and confidence before downstream execution handoff."
  },
  {
    agent: "handoff-manager",
    ownsStages: ["qa", "handoff"],
    ownsCategories: ["planning", "docs", "testing"],
    internalSkills: ["vibe-handoff-to-spec", "decision-ledger"],
    externalCapabilities: ["spec-kit"],
    escalatesTo: [],
    summary: "Owns truthful execution packaging and structured transfer into Spec-Kit-style downstream execution."
  }
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function containsAny(haystack: string, needles: string[]): boolean {
  const normalizedHaystack = normalize(haystack);
  return needles.some((needle) => normalizedHaystack.includes(normalize(needle)));
}

function inferProjectNeeds(input: SkillRecommendationProjectInput): string[] {
  const needs = new Set<string>();
  const combined = [
    input.platform,
    input.targetUser,
    input.successDefinition,
    ...(input.stackHints ?? []),
    ...(input.artifacts ?? [])
  ]
    .filter(Boolean)
    .join(" ");

  if (input.hasAiFeatures || containsAny(combined, ["ai", "llm", "agent", "assistant", "copilot", "mcp"])) {
    needs.add("AI integration");
    needs.add("MCP");
  }

  if (input.needsAuth || containsAny(combined, ["auth", "login", "session", "rbac"])) {
    needs.add("auth");
    needs.add("security");
  }

  if (input.needsDatabase || containsAny(combined, ["database", "postgres", "db", "supabase"])) {
    needs.add("database");
    needs.add("backend");
  }

  if (input.frontendHeavy || containsAny(combined, ["react", "next", "frontend", "ui", "design"])) {
    needs.add("frontend");
    needs.add("design");
    needs.add("product polish");
  }

  if (input.backendHeavy || containsAny(combined, ["backend", "api", "server", "worker"])) {
    needs.add("backend");
  }

  if (input.needsTesting || containsAny(combined, ["test", "qa", "playwright", "vitest", "coverage"])) {
    needs.add("testing");
    needs.add("debugging");
  }

  if (input.performanceSensitive || containsAny(combined, ["performance", "latency", "fast"])) {
    needs.add("performance");
  }

  if (input.securitySensitive) {
    needs.add("security");
  }

  if (input.projectType === "saas" || input.projectType === "wrapper-app") {
    needs.add("frontend");
    needs.add("backend");
    needs.add("testing");
  }

  if (needs.size === 0) {
    needs.add("planning");
    needs.add("debugging");
    needs.add("testing");
  }

  return [...needs];
}

function loadBundlesFromDisk(projectRoot: string): CapabilityBundleManifest[] {
  const bundlesDir = path.join(projectRoot, "core", "capabilities", "bundles");

  if (!fs.existsSync(bundlesDir)) {
    return DEFAULT_BUNDLES;
  }

  const manifests = fs
    .readdirSync(bundlesDir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => fs.readJsonSync(path.join(bundlesDir, entry)) as CapabilityBundleManifest);

  return manifests.length > 0 ? manifests : DEFAULT_BUNDLES;
}

function loadProfilesFromDisk(projectRoot: string): SpecialistCapabilityProfile[] {
  const profilesDir = path.join(projectRoot, "core", "capabilities", "profiles");

  if (!fs.existsSync(profilesDir)) {
    return DEFAULT_PROFILES;
  }

  const manifests = fs
    .readdirSync(profilesDir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => fs.readJsonSync(path.join(profilesDir, entry)) as SpecialistCapabilityProfile);

  return manifests.length > 0 ? manifests : DEFAULT_PROFILES;
}

function scoreProjectFit(skill: SkillCatalogEntry, needs: string[], category?: string, gap?: string): number {
  let score = 0;
  const normalizedCategory = category ? normalize(category) : null;
  const normalizedGap = gap ? normalize(gap) : null;

  for (const need of needs) {
    if (skill.categories.some((candidate) => normalize(candidate) === normalize(need))) {
      score += 6;
    }
  }

  if (needs.includes("auth") && skill.categories.includes("auth")) {
    score += 4;
  }

  if (needs.includes("security") && skill.categories.includes("security")) {
    score += 3;
  }

  if (needs.includes("AI integration") && skill.categories.includes("AI integration")) {
    score += 3;
  }

  if (normalizedCategory && skill.categories.some((candidate) => normalize(candidate) === normalizedCategory)) {
    score += 8;
  }

  if (
    normalizedGap &&
    (skill.categories.some((candidate) => normalize(candidate) === normalizedGap) ||
      containsAny(skill.summary, [normalizedGap]) ||
      skill.stackTags.some((tag) => normalize(tag) === normalizedGap))
  ) {
    score += 8;
  }

  return Math.min(score, 30);
}

function scoreRuntimeCompatibility(skill: SkillCatalogEntry, runtimeTarget: InstallTargetId | "unknown"): number {
  if (runtimeTarget === "unknown") {
    return 10;
  }

  if (skill.runtimeSupport.includes(runtimeTarget)) {
    return 20;
  }

  if (skill.runtimeSupport.includes("generic")) {
    return 8;
  }

  return 2;
}

function scoreStackFit(skill: SkillCatalogEntry, input: SkillRecommendationProjectInput): number {
  const combined = [
    input.platform,
    input.targetUser,
    input.successDefinition,
    ...(input.stackHints ?? []),
    ...(input.artifacts ?? [])
  ]
    .filter(Boolean)
    .join(" ");

  let score = 0;

  for (const tag of skill.stackTags) {
    if (containsAny(combined, [tag])) {
      score += 5;
    }
  }

  if (input.projectType === "wrapper-app" && skill.categories.includes("AI integration")) {
    score += 5;
  }

  return Math.min(score, 15);
}

function scoreOverlapPenalty(skill: SkillCatalogEntry, installedSkills: string[]): number {
  const normalizedInstalled = installedSkills.map(normalize);

  if (
    normalizedInstalled.includes(normalize(skill.name)) ||
    normalizedInstalled.includes(normalize(skill.id))
  ) {
    return 10;
  }

  if (
    skill.categories.some((category) =>
      normalizedInstalled.some((installed) => installed.includes(normalize(category)))
    )
  ) {
    return 4;
  }

  return 0;
}

function scoreBundleFit(
  bundle: CapabilityBundleManifest,
  project: SkillRecommendationProjectInput,
  needs: string[]
): number {
  let score = 0;
  const currentStage = project.currentStage;

  if (project.projectType && bundle.projectTypes.includes(project.projectType)) {
    score += 12;
  }

  if (currentStage && bundle.recommendedStages.some((stage) => normalize(stage) === normalize(currentStage))) {
    score += 10;
  }

  for (const need of needs) {
    if (bundle.categories.some((category) => normalize(category) === normalize(need))) {
      score += 4;
    }
  }

  if (bundle.id === "frontend-polish" && project.designSensitive) {
    score += 8;
  }

  if (bundle.id === "execution-handoff" && (project.needsExecutionDiscipline || project.handoffReady)) {
    score += 10;
  }

  if (bundle.id === "ai-wrapper" && project.hasAiFeatures) {
    score += 6;
  }

  if (bundle.id === "auth-safe-app" && project.needsAuth) {
    score += 6;
  }

  if (bundle.id === "mcp-app" && needs.includes("MCP")) {
    score += 6;
  }

  return score;
}

function buildBundleExplanation(
  bundle: CapabilityBundleManifest,
  project: SkillRecommendationProjectInput,
  needs: string[]
): string[] {
  const why = [bundle.summary];
  const currentStage = project.currentStage;

  const matchingNeeds = needs.filter((need) =>
    bundle.categories.some((category) => normalize(category) === normalize(need))
  );

  if (matchingNeeds.length > 0) {
    why.push(`Matches current project gaps in ${matchingNeeds.join(", ")}.`);
  }

  if (currentStage && bundle.recommendedStages.some((stage) => normalize(stage) === normalize(currentStage))) {
    why.push(`Fits the current workflow stage: ${currentStage}.`);
  }

  return why;
}

function buildExplanation(
  skill: SkillCatalogEntry,
  needs: string[],
  runtimeTarget: InstallTargetId | "unknown"
): string[] {
  const explanations: string[] = [];
  const matchingNeeds = needs.filter((need) =>
    skill.categories.some((category) => normalize(category) === normalize(need))
  );

  if (matchingNeeds.length > 0) {
    explanations.push(`Matches current project needs in ${matchingNeeds.join(", ")}.`);
  }

  if (runtimeTarget !== "unknown" && skill.runtimeSupport.includes(runtimeTarget)) {
    explanations.push(`Fits the current runtime target: ${runtimeTarget}.`);
  }

  explanations.push(skill.summary);
  return explanations;
}

export class SkillRecommender {
  constructor(private readonly bundleRoot: string = process.cwd()) {}

  detectRuntimeTarget(projectRoot: string): InstallTargetId | "unknown" {
    const checks: Array<[InstallTargetId, string[]]> = [
      ["claude-code", [".claude/agents", ".claude/skills"]],
      ["codex", [".codex/skills"]],
      ["cursor", [".cursor/rules"]],
      ["windsurf", [".windsurf/rules"]],
      ["opencode", ["opencode.json", "opencode.jsonc"]],
      ["gemini-cli", [".gemini/commands", ".gemini/extensions"]]
    ];

    for (const [target, candidates] of checks) {
      if (candidates.some((candidate) => fs.existsSync(path.join(projectRoot, candidate)))) {
        return target;
      }
    }

    return "unknown";
  }

  buildProjectInput(
    projectRoot: string,
    state: ProjectState | null
  ): SkillRecommendationProjectInput {
    const packageJsonPath = path.join(projectRoot, "package.json");
    const packageJson = fs.existsSync(packageJsonPath)
      ? (fs.readJsonSync(packageJsonPath) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        })
      : null;

    const dependencyNames = Object.keys({
      ...(packageJson?.dependencies ?? {}),
      ...(packageJson?.devDependencies ?? {})
    }).map(normalize);

    const stackHints = new Set<string>(state?.artifacts ?? []);

    const includeHints = (condition: boolean, hints: string[]): void => {
      if (!condition) {
        return;
      }
      for (const hint of hints) {
        stackHints.add(hint);
      }
    };

    const hasAiFeatures =
      dependencyNames.some((entry) =>
        ["openai", "anthropic", "google", "gemini", "langchain", "ai"].some((needle) =>
          entry.includes(needle)
        )
      ) || containsAny(state?.successDefinition ?? "", ["ai", "agent", "copilot", "assistant", "llm"]);
    const needsAuth =
      dependencyNames.some((entry) =>
        ["auth", "clerk", "better-auth", "auth0", "next-auth"].some((needle) =>
          entry.includes(needle)
        )
      ) || containsAny(state?.successDefinition ?? "", ["auth", "login", "session", "rbac"]);
    const needsDatabase =
      dependencyNames.some((entry) =>
        ["prisma", "drizzle", "postgres", "pg", "mysql", "sqlite", "supabase", "mongoose", "mongodb"].some((needle) =>
          entry.includes(needle)
        )
      ) || containsAny(state?.successDefinition ?? "", ["database", "db", "postgres", "supabase"]);
    const frontendHeavy = dependencyNames.some((entry) =>
      ["next", "react", "vite", "tailwind", "shadcn"].some((needle) => entry.includes(needle))
    );
    const backendHeavy =
      dependencyNames.some((entry) =>
        ["express", "fastify", "nestjs", "hono", "server"].some((needle) => entry.includes(needle))
      ) || needsDatabase;
    const hasTestingDeps = dependencyNames.some((entry) =>
      ["vitest", "jest", "playwright", "cypress", "testing-library"].some((needle) =>
        entry.includes(needle)
      )
    );
    const needsTesting =
      !hasTestingDeps ||
      containsAny(state?.successDefinition ?? "", ["test", "qa", "coverage", "regression"]);
    const performanceSensitive = containsAny(
      [state?.successDefinition, state?.platform].filter(Boolean).join(" "),
      ["performance", "latency", "fast", "realtime", "scale"]
    );
    const securitySensitive = needsAuth || containsAny(state?.successDefinition ?? "", ["security", "compliance", "sensitive"]);
    const designSensitive =
      frontendHeavy ||
      containsAny(
        [state?.successDefinition, state?.targetUser].filter(Boolean).join(" "),
        ["design", "landing page", "dashboard", "marketing", "polish", "visual", "brand"]
      );
    const needsExecutionDiscipline =
      ["detail", "scaffold", "qa", "handoff"].includes(state?.stage ?? "") ||
      (state?.artifacts ?? []).some((artifact) =>
        ["prd", "structure", "logic", "dependencies", "technical-detail"].some((needle) =>
          normalize(artifact).includes(needle)
        )
      );

    includeHints(frontendHeavy, ["frontend", "react"]);
    includeHints(dependencyNames.some((entry) => entry.includes("next")), ["next"]);
    includeHints(needsAuth, ["auth"]);
    includeHints(needsDatabase, ["database", "backend"]);
    includeHints(hasTestingDeps, ["testing"]);
    includeHints(hasAiFeatures, ["ai"]);
    includeHints(dependencyNames.some((entry) => entry.includes("mcp")), ["mcp"]);
    includeHints(dependencyNames.some((entry) => entry.includes("tailwind")), ["design"]);

    let projectType: SkillRecommendationProjectInput["projectType"] = state?.platform?.toLowerCase().includes("content")
      ? "content-site"
      : "mvp";
    if (hasAiFeatures && frontendHeavy) {
      projectType = "wrapper-app";
    } else if (frontendHeavy && (needsAuth || needsDatabase)) {
      projectType = "saas";
    } else if (backendHeavy && !frontendHeavy) {
      projectType = "internal-tool";
    }

    return {
      projectType,
      currentStage: state?.stage,
      platform: state?.platform,
      targetUser: state?.targetUser,
      successDefinition: state?.successDefinition,
      stackHints: [...stackHints],
      artifacts: state?.artifacts ?? [],
      hasAiFeatures,
      needsAuth,
      needsDatabase,
      frontendHeavy,
      backendHeavy,
      needsTesting,
      performanceSensitive,
      securitySensitive,
      designSensitive,
      needsExecutionDiscipline,
      handoffReady: state?.handoff.ready ?? false
    };
  }

  recommend(input: SkillRecommendationInput): SkillRecommendationResult {
    const installedSkills = input.installedSkills ?? [];
    const needs = inferProjectNeeds(input.project);
    const mode = input.mode ?? (input.gap || input.category ? "explain" : "recommend");
    const normalizedCategory = input.category ? normalize(input.category) : null;
    const normalizedGap = input.gap ? normalize(input.gap) : null;
    const normalizedBundle = input.bundle ? normalize(input.bundle) : null;
    const bundles = loadBundlesFromDisk(this.bundleRoot);
    const profiles = loadProfilesFromDisk(this.bundleRoot);
    const bundleRecommendations = bundles
      .map((bundle) => ({
        bundle,
        score: scoreBundleFit(bundle, input.project, needs),
        why: buildBundleExplanation(bundle, input.project, needs),
        matchedCapabilities: bundle.capabilities.filter((capability) =>
          CATALOG.some((entry) => normalize(entry.name) === normalize(capability))
        )
      }))
      .filter((entry) => (normalizedBundle ? normalize(entry.bundle.id) === normalizedBundle : entry.score > 0))
      .sort((left, right) => right.score - left.score || left.bundle.title.localeCompare(right.bundle.title))
      .slice(0, normalizedBundle ? 1 : 3);
    const topBundleCapabilities =
      bundleRecommendations.length > 0
        ? new Set(bundleRecommendations[0]?.bundle.capabilities.map(normalize))
        : null;

    const selectedBundleCapabilities =
      bundleRecommendations.length > 0 && normalizedBundle
        ? new Set(bundleRecommendations[0]?.bundle.capabilities.map(normalize))
        : null;

    const ranked = CATALOG.map((skill) => {
      const breakdown = {
        projectFit: scoreProjectFit(skill, needs, input.category, input.gap),
        runtimeCompatibility: scoreRuntimeCompatibility(skill, input.runtimeTarget),
        stackFit: scoreStackFit(skill, input.project),
        installSignal: skill.installCountSignal,
        sourceQuality: skill.sourceQualitySignal,
        overlapPenalty: scoreOverlapPenalty(skill, installedSkills)
      };

      const score =
        breakdown.projectFit +
        breakdown.runtimeCompatibility +
        breakdown.stackFit +
        breakdown.installSignal +
        breakdown.sourceQuality -
        breakdown.overlapPenalty +
        (topBundleCapabilities?.has(normalize(skill.name)) ? 8 : 0);

      return {
        skill,
        score: Math.max(0, Math.min(100, score)),
        breakdown,
        why: buildExplanation(skill, needs, input.runtimeTarget),
        installCommand: skill.installCommand
      };
    })
      .filter((entry) => {
        if (selectedBundleCapabilities && !selectedBundleCapabilities.has(normalize(entry.skill.name))) {
          return false;
        }

        if (!normalizedCategory && !normalizedGap) {
          return true;
        }

        const matchesCategory =
          normalizedCategory !== null &&
          entry.skill.categories.some((category) => normalize(category) === normalizedCategory);
        const matchesGap =
          normalizedGap !== null &&
          (entry.skill.categories.some((category) => normalize(category) === normalizedGap) ||
            entry.skill.stackTags.some((tag) => normalize(tag) === normalizedGap) ||
            containsAny(entry.skill.summary, [normalizedGap]));

        return matchesCategory || matchesGap;
      })
      .filter((entry) => entry.breakdown.overlapPenalty < 10)
      .sort((left, right) => right.score - left.score || left.skill.name.localeCompare(right.skill.name));

    const top = Math.max(1, Math.min(input.top ?? 5, 10));
    const recommendations = ranked.slice(0, top);
    const installPlan = [...new Set(recommendations.map((entry) => entry.installCommand))];
    const recommendedSpecialists = bundleRecommendations
      .map((entry) => {
        const profile = profiles.find((candidate) => candidate.agent === entry.bundle.primaryAgent);
        if (!profile) {
          return null;
        }

        return {
          agent: profile.agent,
          summary: profile.summary,
          why: [
            `Owns the ${entry.bundle.title} bundle.`,
            ...entry.why
          ],
          internalSkills: profile.internalSkills,
          externalCapabilities: profile.externalCapabilities.filter((capability) =>
            entry.bundle.capabilities.some((candidate) => normalize(candidate) === normalize(capability))
          ),
          suggestedBundleIds: [entry.bundle.id]
        } satisfies SpecialistRecommendation;
      })
      .filter((entry): entry is SpecialistRecommendation => entry !== null);

    return {
      mode,
      detectedRuntime: input.runtimeTarget,
      projectNeeds: needs,
      selectedBundle: bundleRecommendations[0]?.bundle.id,
      recommendedBundles: bundleRecommendations.map(({ bundle, why, matchedCapabilities }) => ({
        bundle,
        why,
        matchedCapabilities
      })),
      recommendedSpecialists,
      recommendations,
      installPlan,
      summary:
        bundleRecommendations.length > 0
          ? `Your project looks like it needs stronger support in ${needs.slice(0, 4).join(", ")}. The best bundle right now is ${bundleRecommendations[0]?.bundle.title}.`
          : needs.length > 0
          ? `Your project looks like it needs stronger support in ${needs.slice(0, 4).join(", ")}.`
          : "Your project would benefit from additional coding-agent capabilities.",
      whatThisImproves: [...new Set([
        ...bundleRecommendations.map((entry) => entry.bundle.summary),
        ...recommendations.map((entry) => entry.skill.summary)
      ])]
    };
  }
}
