import { StackSelector, StackRecommendation } from "../intelligence/stack-selector.js";
import { ProviderSelector, ProviderRecommendation } from "../intelligence/provider-selector.js";
import { BootstrapPlanner, BootstrapPlan } from "../intelligence/bootstrap-planner.js";
import {
  SpecQualityEngine,
  type SpecQualityAssessment
} from "../intelligence/spec-quality-engine.js";
import {
  SkillRecommender,
  type SkillRecommendationResult
} from "../intelligence/skill-recommender.js";
import {
  EventTopologyAdvisor,
  type EventTopologyAdvice
} from "../intelligence/event-topology-advisor.js";
import {
  OnboardingEngine,
  type OnboardingAssessment
} from "../intelligence/onboarding-engine.js";
import {
  ModelEscalationAdvisor,
  type ModelEscalationAdvice
} from "../intelligence/model-escalation-advisor.js";
import {
  runSkillBootstrap,
  writeBootstrapArtifacts,
  type SkillBootstrapResult
} from "../intelligence/skill-bootstrap.js";
import {
  runPrdSkillBootstrap,
  renderPrdBootstrapMd,
  runPrdQualityGates,
  type PrdBootstrapResult,
  type PrdQualityGate
} from "../intelligence/prd-skill-bootstrap.js";
import {
  runPostPrdExpansion,
  type PostPrdExpansionResult
} from "../intelligence/post-prd-expansion.js";
import {
  buildExpansionPlan,
  type ExpansionPlan
} from "../intelligence/artifact-layer-planner.js";
import {
  AutopilotConductor,
  type StageCheckpointSummary
} from "../autopilot/conductor.js";
import { PopupFlowIntegration } from "../autopilot/popup-flow-integration.js";
import { resolveInstallTarget } from "../install/registry.js";

export type VddPublicCommand =
  | "/vibe.start"
  | "/vibe.spec-quality"
  | "/vibe.events"
  | "/vibe.init"
  | "/vibe.plan"
  | "/vibe.research"
  | "/vibe.blueprint"
  | "/vibe.detail"
  | "/vibe.scaffold"
  | "/vibe.qa"
  | "/vibe.next"
  | "/vibe.resume"
  | "/vibe.status"
  | "/vibe.skills"
  | "/vibe.skills-bootstrap"
  | "/vibe.assumptions"
  | "/vibe.decide"
  | "/vibe.handoff-to-spec";

export type VddStage =
  | "init"
  | "plan"
  | "research"
  | "blueprint"
  | "detail"
  | "scaffold"
  | "qa"
  | "handoff";

export type VddStatus =
  | "idle"
  | "active"
  | "halted"
  | "failed"
  | "handoff-ready"
  | "completed";

export type GateStatus = "pending" | "passed" | "warning" | "failed";

export interface ProjectState {
  projectId: string;
  stage: VddStage;
  status: VddStatus;
  platform?: string | undefined;
  projectType?: string | undefined;
  problemStatement?: string | undefined;
  targetUser?: string | undefined;
  successDefinition?: string | undefined;
  hasAiFeatures?: boolean | undefined;
  deliveryPreference?: "mvp" | "foundation" | undefined;
  assumptions: string[];
  decisions: string[];
  artifacts: string[];
  gates: {
    security: GateStatus;
    measurement: GateStatus;
    realityCheck: GateStatus;
  };
  handoff: {
    target: "spec-kit";
    ready: boolean;
  };
}

export interface RoutingContext {
  command: VddPublicCommand;
  state: ProjectState | null;
  args?: Record<string, string | boolean>;
  projectRoot?: string;
}

export interface RoutingResult {
  ok: boolean;
  command: VddPublicCommand;
  stageBefore: VddStage | null;
  stageAfter: VddStage | null;
  statusBefore: VddStatus | null;
  statusAfter: VddStatus | null;
  resolvedAgent: string | null;
  resolvedSkill: string | null;
  artifactsCreated: string[];
  warnings: string[];
  blockers: string[];
  nextRecommendedCommand: VddPublicCommand | null;
  humanNextStep?: string[] | undefined;
  checkpoint?: StageCheckpointSummary | undefined;
  message: string;
  delegation?: {
    currentOwner: string | null;
    recommendedAgent: string | null;
    nextCommandOwner: string | null;
    why: string[];
  } | undefined;
  intelligence?: {
    stack?: StackRecommendation;
    provider?: ProviderRecommendation;
    bootstrap?: BootstrapPlan;
    onboarding?: OnboardingAssessment;
    specQuality?: SpecQualityAssessment;
    skills?: SkillRecommendationResult;
    skillBootstrap?: SkillBootstrapResult;
    prdBootstrap?: PrdBootstrapResult;
    prdQualityGates?: PrdQualityGate[];
    events?: EventTopologyAdvice;
    modelEscalation?: ModelEscalationAdvice;
    postPrdExpansion?: PostPrdExpansionResult;
    expansionPlan?: ExpansionPlan;
    popupFlow?: {
      shouldStart: boolean;
      reason: string;
      maxQuestions: number;
      firstQuestion: {
        started: boolean;
        completed: boolean;
        currentQuestion: {
          id: string;
          text: string;
          category: string;
          choices: Array<{ label: string; value: string; description?: string }> | undefined;
          questionNumber: number;
          totalQuestions: number;
          progressLabel: string;
        } | null;
        message: string;
      } | null;
    };
  } | undefined;
}

const STAGE_ORDER: VddStage[] = [
  "init",
  "plan",
  "research",
  "blueprint",
  "detail",
  "scaffold",
  "qa",
  "handoff"
];

const STAGE_COMMAND_MAP: Partial<Record<VddStage, VddPublicCommand>> = {
  init: "/vibe.init",
  plan: "/vibe.plan",
  research: "/vibe.research",
  blueprint: "/vibe.blueprint",
  detail: "/vibe.detail",
  scaffold: "/vibe.scaffold",
  qa: "/vibe.qa",
  handoff: "/vibe.handoff-to-spec"
};

function inferProjectType(
  state: ProjectState | null
): "saas" | "internal-tool" | "mvp" | "content-site" | "wrapper-app" {
  if (
    state?.projectType === "saas" ||
    state?.projectType === "internal-tool" ||
    state?.projectType === "mvp" ||
    state?.projectType === "content-site" ||
    state?.projectType === "wrapper-app"
  ) {
    return state.projectType;
  }

  return "mvp";
}

function createInitialState(): ProjectState {
  return {
    projectId: "proj_local",
    stage: "init",
    status: "active",
    assumptions: [],
    decisions: [],
    artifacts: [],
    gates: {
      security: "pending",
      measurement: "pending",
      realityCheck: "pending"
    },
    handoff: {
      target: "spec-kit",
      ready: false
    }
  };
}

function nextStage(stage: VddStage): VddStage | null {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1] ?? null;
}

function recommendNext(stage: VddStage): VddPublicCommand | null {
  const next = nextStage(stage);
  if (!next) {
    return null;
  }
  return STAGE_COMMAND_MAP[next] ?? null;
}

function resolveAgent(command: VddPublicCommand): string | null {
  switch (command) {
    case "/vibe.init":
    case "/vibe.start":
    case "/vibe.spec-quality":
    case "/vibe.events":
    case "/vibe.next":
    case "/vibe.resume":
    case "/vibe.status":
    case "/vibe.skills":
    case "/vibe.skills-bootstrap":
      return "orchestrator";

    case "/vibe.plan":
      return "planner";

    case "/vibe.research":
      return "researcher";

    case "/vibe.blueprint":
      return "architect";

    case "/vibe.detail":
      return "detailer";

    case "/vibe.scaffold":
      return "orchestrator";

    case "/vibe.qa":
      return "qa-guardian";

    case "/vibe.handoff-to-spec":
      return "handoff-manager";

    case "/vibe.assumptions":
    case "/vibe.decide":
      return "orchestrator";

    default:
      return null;
  }
}

function createDelegationHint(
  currentOwner: string | null,
  nextCommand: VddPublicCommand | null,
  recommendedAgent: string | null,
  why: string[]
): NonNullable<RoutingResult["delegation"]> {
  return {
    currentOwner,
    recommendedAgent,
    nextCommandOwner: nextCommand ? resolveAgent(nextCommand) : null,
    why
  };
}

function resolveSkill(command: VddPublicCommand): string | null {
  switch (command) {
    case "/vibe.start":
      return "onboarding-guide";
    case "/vibe.init":
      return "vibe-init";
    case "/vibe.spec-quality":
      return "spec-quality-checker";
    case "/vibe.events":
      return "event-architecture-planner";
    case "/vibe.plan":
      return "vibe-plan";
    case "/vibe.research":
      return "vibe-research";
    case "/vibe.blueprint":
      return "vibe-blueprint";
    case "/vibe.detail":
      return "vibe-detail";
    case "/vibe.scaffold":
      return "vibe-scaffold";
    case "/vibe.qa":
      return "vibe-qa";
    case "/vibe.next":
      return "vibe-next";
    case "/vibe.resume":
      return "vibe-resume";
    case "/vibe.status":
      return "vibe-status";
    case "/vibe.skills":
      return "skill-recommender";
    case "/vibe.skills-bootstrap":
      return "skill-bootstrapper";
    case "/vibe.assumptions":
      return "assumptions-manager";
    case "/vibe.decide":
      return "decision-ledger";
    case "/vibe.handoff-to-spec":
      return "vibe-handoff-to-spec";
    default:
      return null;
  }
}

function commandToExpectedStage(command: VddPublicCommand): VddStage | null {
  switch (command) {
    case "/vibe.init":
      return "init";
    case "/vibe.plan":
      return "plan";
    case "/vibe.research":
      return "research";
    case "/vibe.blueprint":
      return "blueprint";
    case "/vibe.detail":
      return "detail";
    case "/vibe.scaffold":
      return "scaffold";
    case "/vibe.qa":
      return "qa";
    case "/vibe.handoff-to-spec":
      return "handoff";
    default:
      return null;
  }
}

function isReadOnlyCommand(command: VddPublicCommand): boolean {
  return (
    command === "/vibe.start" ||
    command === "/vibe.spec-quality" ||
    command === "/vibe.events" ||
    command === "/vibe.status" ||
    command === "/vibe.skills" ||
    command === "/vibe.skills-bootstrap" ||
    command === "/vibe.resume" ||
    command === "/vibe.assumptions"
  );
}

function buildOnboardingAssessment(
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): OnboardingAssessment {
  return new OnboardingEngine().assess({
    state,
    args
  });
}

function buildSpecQualityAssessment(
  projectRoot: string | undefined,
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): SpecQualityAssessment {
  return new SpecQualityEngine().assess({
    projectRoot: projectRoot ?? process.cwd(),
    state,
    args
  });
}

function validateTransition(
  command: VddPublicCommand,
  state: ProjectState | null
): { valid: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (command === "/vibe.init") {
    return { valid: true, blockers };
  }

  if (command === "/vibe.next" || command === "/vibe.decide" || isReadOnlyCommand(command)) {
    return { valid: true, blockers };
  }

  if (!state) {
    blockers.push("No project state is loaded. Run /vibe.init first.");
    return { valid: false, blockers };
  }

  if (state.status === "failed") {
    blockers.push("Project state is failed and requires recovery before continuing.");
    return { valid: false, blockers };
  }

  const expectedStage = commandToExpectedStage(command);
  if (!expectedStage) {
    blockers.push("Command is not mapped to a canonical stage.");
    return { valid: false, blockers };
  }

  const currentIndex = STAGE_ORDER.indexOf(state.stage);
  const expectedIndex = STAGE_ORDER.indexOf(expectedStage);

  if (expectedIndex === -1 || currentIndex === -1) {
    blockers.push("State machine indices could not be resolved.");
    return { valid: false, blockers };
  }

  if (expectedIndex > currentIndex + 1) {
    blockers.push(
      `Cannot jump from stage "${state.stage}" directly to "${expectedStage}".`
    );
  }

  if (expectedIndex <= currentIndex && command !== STAGE_COMMAND_MAP[state.stage]) {
    blockers.push(
      `Command "${command}" does not match the current stage "${state.stage}".`
    );
  }

  if (command === "/vibe.handoff-to-spec" && state.status !== "handoff-ready") {
    blockers.push("Project is not marked handoff-ready yet.");
  }

  return {
    valid: blockers.length === 0,
    blockers
  };
}

function simulateArtifacts(command: VddPublicCommand): string[] {
  switch (command) {
    case "/vibe.plan":
      return ["problem-statement.md", "scope.md", "success-definition.md"];
    case "/vibe.research":
      return ["research-summary.md", "risk-register.md", "assumptions-log.md"];
    case "/vibe.blueprint":
      return ["architecture-baseline.md", "system-boundaries.md", "analytics-outline.md"];
    case "/vibe.detail":
      return ["technical-detail.md", "validation-plan.md", "execution-notes.md"];
    case "/vibe.scaffold": {
      const planner = new BootstrapPlanner();
      // Default to high-complexity SaaS for initial scaffold if no input
      const baseFiles = planner.plan({
        projectType: "saas",
        hasAiFeatures: true,
        hasDesignHeavyUx: true,
        stackComplexity: "high"
      }).filesToGenerate;
      // PRD stage outputs (added by prd-orchestrator when active)
      const prdOutputs = [
        "PRD.md",
        "Feature-Breakdown.md",
        "Implementation-Plan.md",
        "Execution-Issues.md"
      ];
      // Post-PRD expansion artifacts (added by post-prd-expander)
      const expansionOutputs = [
        "Scope.md",
        "Open-Questions.md",
        "Logic.md",
        "Stack-Decision.md",
        "Architecture.md",
        "ADR-0001-initial-decisions.md",
        "Dependencies.md",
        "Validation-Plan.md",
        "Test-Strategy.md",
        "Risk-Register.md",
        "Memory.md",
        "anti-hallucination.md",
        "repo.md",
        "Runbook.md"
      ];
      return [...prdOutputs, ...expansionOutputs, ...baseFiles];
    }
    case "/vibe.qa":
      return ["qa-report.md", "go-no-go.md"];
    case "/vibe.handoff-to-spec":
      return ["spec-handoff.md", "execution-entry-summary.md", "initial-decisions.json"];
    default:
      return [];
  }
}

function inferRuntimeTarget(
  projectRoot: string | undefined,
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): SkillRecommendationResult["detectedRuntime"] {
  const runtimeArg =
    typeof args?.runtime === "string"
      ? args.runtime
      : typeof args?.target === "string"
      ? args.target
      : typeof args?.agent === "string"
      ? args.agent
      : undefined;

  if (runtimeArg) {
    return resolveInstallTarget(runtimeArg)?.id ?? "unknown";
  }

  if (projectRoot) {
    return new SkillRecommender().detectRuntimeTarget(projectRoot);
  }

  if (state?.platform) {
    return resolveInstallTarget(state.platform)?.id ?? "unknown";
  }

  return "unknown";
}

function buildSkillRecommendation(
  projectRoot: string | undefined,
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): SkillRecommendationResult {
  const top =
    typeof args?.top === "string" && Number.isFinite(Number(args.top))
      ? Number(args.top)
      : undefined;
  const mode =
    args?.install === true
      ? "install"
      : args?.explain === true || typeof args?.category === "string" || typeof args?.gap === "string"
      ? "explain"
      : "recommend";
  const recommender = new SkillRecommender();

  return recommender.recommend({
    runtimeTarget: inferRuntimeTarget(projectRoot, state, args),
    top,
    mode,
    bundle: typeof args?.bundle === "string" ? args.bundle : undefined,
    category: typeof args?.category === "string" ? args.category : undefined,
    gap: typeof args?.gap === "string" ? args.gap : undefined,
    installedSkills: [],
    project: recommender.buildProjectInput(projectRoot ?? process.cwd(), state)
  });
}

function readBooleanArg(
  args: Record<string, string | boolean> | undefined,
  key: string
): boolean | undefined {
  const value = args?.[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) {
      return true;
    }

    if (["false", "no", "0"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function buildEventTopologyAdvice(
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): EventTopologyAdvice {
  const successDefinition = state?.successDefinition?.toLowerCase() ?? "";
  const assumptions = state?.assumptions.join(" ").toLowerCase() ?? "";

  return new EventTopologyAdvisor().advise({
    backgroundJobs:
      readBooleanArg(args, "background-jobs") ??
      /background|queue|worker|async/.test(assumptions),
    notifications:
      readBooleanArg(args, "notifications") ??
      /notify|notification/.test(assumptions),
    webhooks:
      readBooleanArg(args, "webhooks") ??
      /webhook/.test(assumptions),
    auditLogging:
      readBooleanArg(args, "audit-logging") ??
      /audit/.test(assumptions),
    analyticsSideEffects:
      readBooleanArg(args, "analytics-side-effects") ??
      Boolean(state?.artifacts.includes("analytics-outline.md")),
    aiAsyncFlows:
      readBooleanArg(args, "ai-async-flows") ??
      /ai|generation|llm|prompt/.test(successDefinition),
    multiModuleConsumers:
      readBooleanArg(args, "multi-module-consumers") ??
      /multiple modules|fan-out|multi-consumer/.test(assumptions),
    externalIntegrations:
      readBooleanArg(args, "external-integrations") ??
      /integration|third-party|provider|external/.test(assumptions),
    eventualConsistencyAcceptable:
      readBooleanArg(args, "eventual-consistency-acceptable") ??
      /eventual consistency|async okay|deferred/.test(assumptions)
  });
}

function inferStackComplexity(
  state: ProjectState | null,
  args?: Record<string, string | boolean>
): "high" | "medium" | "low" {
  const explicit =
    typeof args?.["stack-complexity"] === "string" ? args["stack-complexity"] : undefined;

  if (explicit === "high" || explicit === "medium" || explicit === "low") {
    return explicit;
  }

  if (state?.projectType === "saas" || state?.projectType === "wrapper-app") {
    return "high";
  }

  if (state?.projectType === "internal-tool") {
    return "medium";
  }

  return "low";
}

function buildStackRecommendation(
  state: ProjectState | null
): StackRecommendation {
  const projectType = inferProjectType(state);
  return new StackSelector().evaluate({
    projectType,
    speedPriority: state?.deliveryPreference === "mvp" ? "high" : "medium",
    complexityTolerance:
      projectType === "saas" || projectType === "wrapper-app"
        ? "high"
        : projectType === "internal-tool"
        ? "medium"
        : "low",
    needsAuth:
      projectType === "saas" ||
      projectType === "internal-tool" ||
      projectType === "wrapper-app",
    needsDb: projectType !== "content-site"
  });
}

function buildProviderRecommendation(
  command: "/vibe.plan" | "/vibe.blueprint" | "/vibe.detail" | "/vibe.scaffold",
  state: ProjectState | null
): ProviderRecommendation | undefined {
  if (state?.hasAiFeatures !== true) {
    return undefined;
  }

  return new ProviderSelector().evaluate({
    reasoningQualityRequired:
      command === "/vibe.scaffold"
        ? "extreme"
        : command === "/vibe.detail"
        ? "high"
        : "moderate",
    writingQualityRequired: command === "/vibe.scaffold" ? "high" : "moderate",
    costSensitivity: state.deliveryPreference === "mvp" ? "medium" : "low",
    latencyTolerance: command === "/vibe.scaffold" ? "high" : "medium",
    structuredOutputRequired: true
  });
}

function buildModelEscalationAdvice(
  command: "/vibe.scaffold" | "/vibe.detail" | "/vibe.blueprint",
  state: ProjectState | null,
  artifacts: string[],
  args?: Record<string, string | boolean>
): ModelEscalationAdvice {
  const accepted =
    readBooleanArg(args, "accept-model-upgrade") ??
    readBooleanArg(args, "accept-escalation") ??
    readBooleanArg(args, "full-prd");
  return new ModelEscalationAdvisor().advise({
    command,
    projectType: state?.projectType,
    hasAiFeatures: state?.hasAiFeatures,
    artifacts,
    stackComplexity: inferStackComplexity(state),
    accepted
  });
}

function buildBootstrapPlan(
  state: ProjectState | null,
  args?: Record<string, string | boolean>,
  modelEscalationAdvice?: ModelEscalationAdvice
): BootstrapPlan {
  const projectType = inferProjectType(state);
  const hasAiFeatures = state?.hasAiFeatures ?? true;
  const stackComplexity = state ? inferStackComplexity(state) : "high";
  const explicitPrdDepth =
    typeof args?.["prd-depth"] === "string" ? args["prd-depth"].trim().toLowerCase() : undefined;
  const prdArtifact =
    explicitPrdDepth === "full"
      ? "PRD.full.md"
      : explicitPrdDepth === "draft"
      ? "PRD.draft.md"
      : modelEscalationAdvice?.prdArtifact ?? "PRD.full.md";

  return new BootstrapPlanner().plan({
    projectType,
    hasAiFeatures,
    hasDesignHeavyUx:
      state?.projectType === "saas" ||
      state?.projectType === "content-site" ||
      state?.projectType === "wrapper-app" ||
      !state?.projectType,
    stackComplexity,
    prdArtifact
  });
}

function buildHumanNextStep(
  command: VddPublicCommand,
  nextRecommendedCommand: VddPublicCommand | null,
  modelEscalationAdvice?: ModelEscalationAdvice
): string[] | undefined {
  if (
    command === "/vibe.scaffold" &&
    modelEscalationAdvice?.shouldRecommend &&
    modelEscalationAdvice.decision === "deferred"
  ) {
    return [
      "Switch model to Claude Opus 4.6 where available, Codex on GPT-5.4 or GPT-5.4 with xhigh reasoning, or Gemini 3.1 Pro.",
      "Re-run /vibe.scaffold --accept-model-upgrade to generate PRD.full.md.",
      "Otherwise continue to /vibe.qa with draft PRD truth only."
    ];
  }

  void nextRecommendedCommand;
  return undefined;
}

export class RouterEngine {
  run(context: RoutingContext): RoutingResult {
    const initialState = context.state;
    const stageBefore = initialState?.stage ?? null;
    const statusBefore = initialState?.status ?? null;

    const transition = validateTransition(context.command, initialState);
    if (!transition.valid) {
      const nextRecommendedCommand = stageBefore ? STAGE_COMMAND_MAP[stageBefore] ?? null : "/vibe.init";
      return {
        ok: false,
        command: context.command,
        stageBefore,
        stageAfter: stageBefore,
        statusBefore,
        statusAfter: statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: transition.blockers,
        nextRecommendedCommand,
        message: "Routing blocked by state or transition constraints.",
        delegation: createDelegationHint(
          resolveAgent(context.command),
          nextRecommendedCommand,
          null,
          ["The request is blocked until the workflow returns to a valid stage."]
        )
      };
    }

    if (context.command === "/vibe.init") {
      const created = createInitialState();

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: created.stage,
        statusBefore,
        statusAfter: created.status,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: [],
        nextRecommendedCommand: "/vibe.plan",
        message: "Project initialized successfully.",
        delegation: createDelegationHint(
          "orchestrator",
          "/vibe.plan",
          "planner",
          ["Initialization is complete. Planning is the next specialist-owned step."]
        ),
        intelligence: {
          stack: new StackSelector().evaluate({
            projectType: "saas",
            speedPriority: "high",
            complexityTolerance: "medium",
            needsAuth: true,
            needsDb: true
          })
        }
      };
    }

    if (context.command === "/vibe.start") {
      const onboarding = buildOnboardingAssessment(initialState, context.args);
      const nextRecommendedCommand = onboarding.canInitializeState
        ? initialState
          ? recommendNext(initialState.stage) ?? "/vibe.plan"
          : "/vibe.plan"
        : "/vibe.start";
      const recommendedAgent = onboarding.canInitializeState
        ? nextRecommendedCommand
          ? resolveAgent(nextRecommendedCommand)
          : "planner"
        : "onboarding-guide";

      // Initialize popup flow integration for intent capture
      const popupFlow = new PopupFlowIntegration({ maxQuestions: 5, language: "ar" });
      const popupFlowContext = onboarding.needsMoreAnswers
        ? (() => {
            const started = popupFlow.start();
            return {
              shouldStart: true,
              reason: "Project intent needs more clarity. The popup flow will ask adaptive questions one at a time.",
              maxQuestions: 5,
              firstQuestion: {
                started: started.started,
                completed: started.completed,
                currentQuestion: started.currentQuestion,
                message: started.message,
              },
            };
          })()
        : {
            shouldStart: false,
            reason: "Project intent is clear enough to proceed.",
            maxQuestions: 0,
            firstQuestion: null,
          };

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: onboarding.canInitializeState ? stageBefore ?? "init" : stageBefore,
        statusBefore,
        statusAfter: onboarding.canInitializeState ? "active" : statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: onboarding.needsMoreAnswers
          ? ["The system still needs a few onboarding answers before it should lock project truth."]
          : [],
        blockers: [],
        nextRecommendedCommand,
        message: onboarding.canInitializeState
          ? "Guided onboarding captured enough project intent to initialize or refresh the workflow."
          : "Guided onboarding has started and is collecting the remaining project intent.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          recommendedAgent,
          onboarding.canInitializeState
            ? [
                "The orchestrator translated the idea into a normalized project seed.",
                "planner should own the next structured workflow step."
              ]
            : [
                "The orchestrator is still in onboarding mode.",
                "onboarding-guide should continue the plain-language Q&A loop."
              ]
        ),
        intelligence: {
          onboarding,
          popupFlow: popupFlowContext
        }
      };
    }

    if (context.command === "/vibe.spec-quality") {
      const specQuality = buildSpecQualityAssessment(
        context.projectRoot,
        initialState,
        context.args
      );
      const nextRecommendedCommand = specQuality.shouldBlockProgress
        ? initialState
          ? "/vibe.plan"
          : "/vibe.init"
        : stageBefore
        ? recommendNext(stageBefore) ?? "/vibe.plan"
        : "/vibe.init";
      const recommendedAgent = specQuality.shouldBlockProgress
        ? initialState
          ? "planner"
          : "onboarding-guide"
        : nextRecommendedCommand
        ? resolveAgent(nextRecommendedCommand)
        : null;

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: stageBefore,
        statusBefore,
        statusAfter: statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: specQuality.warnings,
        blockers: specQuality.blockers,
        nextRecommendedCommand,
        message: "Spec quality assessment completed.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          recommendedAgent,
          specQuality.shouldBlockProgress
            ? [
                "The orchestrator ran a governance check before deeper execution.",
                `${recommendedAgent} should take the next step to repair clarity gaps.`
              ]
            : [
                "The orchestrator verified that project intent is strong enough to keep moving.",
                recommendedAgent
                  ? `${recommendedAgent} owns the next most logical workflow step.`
                  : "No specialist handoff is required immediately."
              ]
        ),
        intelligence: {
          specQuality
        }
      };
    }

    if (context.command === "/vibe.events") {
      const events = buildEventTopologyAdvice(initialState, context.args);
      const nextRecommendedCommand = !initialState
        ? "/vibe.init"
        : initialState.stage === "research"
        ? "/vibe.blueprint"
        : initialState.stage === "blueprint"
        ? "/vibe.detail"
        : recommendNext(initialState.stage);
      const recommendedAgent = events.relevance.requiresEventCatalog
        ? "detailer"
        : events.relevance.requiresEventArchitecture
        ? "architect"
        : nextRecommendedCommand
        ? resolveAgent(nextRecommendedCommand)
        : null;

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: stageBefore,
        statusBefore,
        statusAfter: statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: events.relevance.recommendedArtifacts,
        warnings: [events.relevance.summary],
        blockers: [],
        nextRecommendedCommand,
        message: "Event architecture advice prepared successfully.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          recommendedAgent,
          recommendedAgent
            ? [
                "The orchestrator evaluated event topology needs for the current project.",
                `${recommendedAgent} is the specialist best aligned to the next event-design decision.`
              ]
            : ["The orchestrator evaluated event topology needs for the current project."]
        ),
        intelligence: {
          events
        }
      };
    }

    if (context.command === "/vibe.skills") {
      const skills = buildSkillRecommendation(context.projectRoot, initialState, context.args);
      const nextRecommendedCommand = stageBefore ? recommendNext(stageBefore) : "/vibe.init";
      const recommendedAgent = skills.recommendedSpecialists[0]?.agent ?? null;

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: stageBefore,
        statusBefore,
        statusAfter: statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: [],
        nextRecommendedCommand,
        message: "Skill recommendations prepared successfully.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          recommendedAgent,
          recommendedAgent
            ? [
                "The orchestrator coordinated the recommendation pass.",
                `${recommendedAgent} is the specialist agent best aligned to the selected capability path.`
              ]
            : ["The orchestrator coordinated the recommendation pass."]
        ),
        intelligence: {
          skills
        }
      };
    }

    if (context.command === "/vibe.skills-bootstrap") {
      const projectRoot = context.projectRoot ?? process.cwd();
      const bootstrapResult = runSkillBootstrap(projectRoot, initialState, context.args);
      const nextRecommendedCommand = stageBefore ? recommendNext(stageBefore) : "/vibe.init";
      const recommendedAgent = bootstrapResult.recommendationResult.recommendedSpecialists[0]?.agent ?? null;

      // Write artifacts if bootstrap was ready or deferred (has something to document)
      const artifactsCreated: string[] = [];
      if (bootstrapResult.readiness.readiness === "ready" || bootstrapResult.readiness.readiness === "deferred") {
        const written = writeBootstrapArtifacts(projectRoot, bootstrapResult.artifacts);
        artifactsCreated.push(...written.map((p) => p.split("/").pop() ?? p));
      }

      const warnings: string[] = [];
      if (bootstrapResult.readiness.readiness === "blocked") {
        warnings.push("Skill bootstrap blocked: insufficient project context.");
      } else if (bootstrapResult.readiness.readiness === "deferred") {
        warnings.push("Skill bootstrap deferred: confidence below threshold. Recommendations provided without installation.");
      }
      warnings.push(...bootstrapResult.readiness.reasons);

      return {
        ok: true,
        command: context.command,
        stageBefore,
        stageAfter: stageBefore,
        statusBefore,
        statusAfter: statusBefore,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated,
        warnings,
        blockers: bootstrapResult.readiness.readiness === "blocked"
          ? ["Insufficient project context for skill bootstrap."]
          : [],
        nextRecommendedCommand,
        message: bootstrapResult.userSummary,
        humanNextStep: bootstrapResult.nextSteps,
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          recommendedAgent,
          recommendedAgent
            ? [
                "The orchestrator ran the auto-skill-bootstrap flow.",
                `${recommendedAgent} is the specialist best aligned to the installed capabilities.`
              ]
            : ["The orchestrator ran the auto-skill-bootstrap flow."]
        ),
        intelligence: {
          skillBootstrap: bootstrapResult,
          skills: bootstrapResult.recommendationResult
        }
      };
    }

    const state = initialState!;
    let artifactsCreated =
      context.command === "/vibe.scaffold"
        ? buildBootstrapPlan(initialState, context.args).filesToGenerate
        : simulateArtifacts(context.command);
    const warnings: string[] = [];
    let stackAdvice: StackRecommendation | undefined;
    let providerAdvice: ProviderRecommendation | undefined;
    let eventAdvice: EventTopologyAdvice | undefined;
    let modelEscalationAdvice: ModelEscalationAdvice | undefined;
    let prdBootstrapAdvice: PrdBootstrapResult | undefined;
    let postPrdExpansionAdvice: PostPrdExpansionResult | undefined;
    let expansionPlanAdvice: ExpansionPlan | undefined;
    let checkpoint: StageCheckpointSummary | undefined;

    if (context.command === "/vibe.blueprint" || context.command === "/vibe.detail") {
      stackAdvice = buildStackRecommendation(initialState);
      providerAdvice = buildProviderRecommendation(context.command, initialState);
      eventAdvice = buildEventTopologyAdvice(initialState, context.args);

      if (context.command === "/vibe.blueprint") {
        if (eventAdvice.relevance.requiresEventArchitecture) {
          artifactsCreated = Array.from(
            new Set([...artifactsCreated, "Event-Architecture.md"])
          );
          warnings.push(eventAdvice.relevance.summary);
        } else {
          warnings.push(
            "Event architecture is not justified yet. Keep event handling simple until more async pressure appears."
          );
        }
      }

      if (context.command === "/vibe.detail" && eventAdvice.relevance.requiresEventCatalog) {
        artifactsCreated = Array.from(
          new Set([...artifactsCreated, "Event-Catalog.md", "Event-Contracts.md"])
        );
        warnings.push(eventAdvice.relevance.summary);
      }
    }

    if (
      context.command === "/vibe.blueprint" ||
      context.command === "/vibe.detail" ||
      context.command === "/vibe.scaffold"
    ) {
      if (!stackAdvice) {
        stackAdvice = buildStackRecommendation(initialState);
      }

      if (!providerAdvice) {
        providerAdvice = buildProviderRecommendation(context.command, initialState);
      }

      modelEscalationAdvice = buildModelEscalationAdvice(
        context.command,
        initialState,
        artifactsCreated,
        context.args
      );

      if (context.command === "/vibe.scaffold" && modelEscalationAdvice.shouldRecommend) {
        artifactsCreated = buildBootstrapPlan(
          initialState,
          context.args,
          modelEscalationAdvice
        ).filesToGenerate;
        warnings.push(modelEscalationAdvice.summary);
        warnings.push(
          modelEscalationAdvice.decision === "accepted"
            ? "Model escalation was accepted. Scaffold will generate the deeper PRD artifact."
            : "Model escalation was not accepted yet. Scaffold will generate PRD.draft.md and keep the stronger-model path optional."
        );
        warnings.push(modelEscalationAdvice.handoffPrompt);
      }

      // PRD Skill Bootstrap: install PRD-specific skills before PRD writing
      if (context.command === "/vibe.scaffold") {
        prdBootstrapAdvice = runPrdSkillBootstrap(
          context.projectRoot ?? process.cwd(),
          initialState,
          context.args
        );

        if (prdBootstrapAdvice.ready) {
          artifactsCreated = Array.from(
            new Set([...artifactsCreated, "PRD-Skill-Bootstrap.md"])
          );

          // Report phased installation plan
          const phaseANames = prdBootstrapAdvice.phases[0]?.skillsInstalled.map(s => s.name).join(", ") ?? "";
          const phaseBNames = prdBootstrapAdvice.phases[1]?.skillsInstalled.map(s => s.name).join(", ") ?? "";
          const phaseCNames = prdBootstrapAdvice.phases[2]?.skillsInstalled.map(s => s.name).join(", ") ?? "";

          warnings.push(
            `PRD skill stack (phased):`,
            `  Phase A (install now): ${phaseANames}`,
            `  Phase B (after first draft): ${phaseBNames}`,
            `  Phase C (after PRD stable): ${phaseCNames}`
          );

          // Run quality gates based on project state
          const prdGates = runPrdQualityGates(initialState);
          for (const gate of prdGates) {
            if (!gate.passed) {
              warnings.push(
                `PRD ${gate.label}: BLOCKED — missing: ${gate.missingFields.join(", ")}`
              );
            }
          }

          // Post-PRD Expansion: build the full execution-readiness artifact plan
          // This runs AFTER PRD skill bootstrap to plan the remaining 18 artifacts
          const prdContent = ""; // In real use, read PRD.md from disk
          postPrdExpansionAdvice = runPostPrdExpansion(
            context.projectRoot ?? process.cwd(),
            initialState,
            prdContent,
            context.args
          );

          expansionPlanAdvice = buildExpansionPlan(initialState, prdContent);

          if (postPrdExpansionAdvice.ready) {
            // Add expansion artifacts to the scaffold output
            const expansionArtifactNames = expansionPlanAdvice.layers
              .flatMap((l) => l.artifacts.map((a) => a.name));
            artifactsCreated = Array.from(
              new Set([...artifactsCreated, ...expansionArtifactNames, "Post-PRD-Expansion.md"])
            );

            warnings.push(
              `Post-PRD expansion plan: ${expansionPlanAdvice.totalArtifacts} artifacts across ${expansionPlanAdvice.estimatedRounds} layers`,
              `  Layer 1 (execution truth): ${expansionPlanAdvice.layers[0]?.totalCount ?? 0} artifacts`,
              `  Layer 2 (system shape): ${expansionPlanAdvice.layers[1]?.totalCount ?? 0} artifacts`,
              `  Layer 3 (execution/quality): ${expansionPlanAdvice.layers[2]?.totalCount ?? 0} artifacts`
            );

            // Report autopilot status
            if (postPrdExpansionAdvice.autopilotStatus === "pause") {
              warnings.push(
                "Post-PRD expansion paused at decision checkpoint:",
                ...postPrdExpansionAdvice.pauseReasons.map((r) => `  - ${r}`)
              );
            }
          }
        }
      }

      checkpoint = new AutopilotConductor().summarizeStage({
        command: context.command,
        artifactsCreated,
        ...(stackAdvice ? { stack: stackAdvice } : {}),
        ...(providerAdvice ? { provider: providerAdvice } : {}),
        ...(eventAdvice ? { events: eventAdvice } : {}),
        ...(modelEscalationAdvice ? { modelEscalation: modelEscalationAdvice } : {}),
        nextRecommendedCommand: commandToExpectedStage(context.command)
          ? recommendNext(commandToExpectedStage(context.command)!)
          : null
      });
    }

    if (context.command === "/vibe.status") {
      const nextRecommendedCommand = recommendNext(state.stage);
      return {
        ok: true,
        command: context.command,
        stageBefore: state.stage,
        stageAfter: state.stage,
        statusBefore: state.status,
        statusAfter: state.status,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: [],
        nextRecommendedCommand,
        message: "Status inspected successfully.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          nextRecommendedCommand ? resolveAgent(nextRecommendedCommand) : null,
          nextRecommendedCommand
            ? [`${resolveAgent(nextRecommendedCommand)} owns the next specialist step.`]
            : ["No further stage progression is available from the current state."]
        )
      };
    }

    if (context.command === "/vibe.resume") {
      const nextRecommendedCommand = recommendNext(state.stage);
      return {
        ok: true,
        command: context.command,
        stageBefore: state.stage,
        stageAfter: state.stage,
        statusBefore: state.status,
        statusAfter: state.status,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: [],
        nextRecommendedCommand,
        message: "Project context resumed successfully.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          nextRecommendedCommand ? resolveAgent(nextRecommendedCommand) : null,
          nextRecommendedCommand
            ? [`${resolveAgent(nextRecommendedCommand)} is the next specialist likely to take ownership.`]
            : ["The project has no further automatic stage progression available."]
        )
      };
    }

    if (context.command === "/vibe.next") {
      const nextCommand =
        state.status === "handoff-ready"
          ? "/vibe.handoff-to-spec"
          : recommendNext(state.stage);

      return {
        ok: true,
        command: context.command,
        stageBefore: state.stage,
        stageAfter: state.stage,
        statusBefore: state.status,
        statusAfter: state.status,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated: [],
        warnings: [],
        blockers: [],
        nextRecommendedCommand: nextCommand,
        message: nextCommand
          ? `Next recommended command is ${nextCommand}.`
          : "No further stage transition is available.",
        delegation: createDelegationHint(
          "orchestrator",
          nextCommand,
          nextCommand ? resolveAgent(nextCommand) : null,
          nextCommand
            ? [`${resolveAgent(nextCommand)} owns the next workflow step.`]
            : ["No further stage progression is available from the current state."]
        )
      };
    }

    if (context.command === "/vibe.decide" || context.command === "/vibe.assumptions") {
      const nextRecommendedCommand = recommendNext(state.stage);
      return {
        ok: true,
        command: context.command,
        stageBefore: state.stage,
        stageAfter: state.stage,
        statusBefore: state.status,
        statusAfter: state.status,
        resolvedAgent: resolveAgent(context.command),
        resolvedSkill: resolveSkill(context.command),
        artifactsCreated,
        warnings: [],
        blockers: [],
        nextRecommendedCommand,
        message: "Cross-stage governance action completed.",
        delegation: createDelegationHint(
          "orchestrator",
          nextRecommendedCommand,
          nextRecommendedCommand ? resolveAgent(nextRecommendedCommand) : null,
          ["The orchestrator handled a governance action without changing specialist ownership."]
        )
      };
    }

    const targetStage = commandToExpectedStage(context.command);
    const statusAfter =
      context.command === "/vibe.qa"
        ? "handoff-ready"
        : context.command === "/vibe.handoff-to-spec"
        ? "completed"
        : "active";
    const nextRecommendedCommand =
      context.command === "/vibe.handoff-to-spec"
        ? null
        : context.command === "/vibe.qa"
        ? "/vibe.handoff-to-spec"
        : targetStage
        ? recommendNext(targetStage)
        : null;
    const humanNextStep = buildHumanNextStep(
      context.command,
      nextRecommendedCommand,
      modelEscalationAdvice
    );

    return {
      ok: true,
      command: context.command,
      stageBefore: state.stage,
      stageAfter: targetStage,
      statusBefore: state.status,
      statusAfter,
      resolvedAgent: resolveAgent(context.command),
      resolvedSkill: resolveSkill(context.command),
      artifactsCreated,
      warnings,
      blockers: [],
      nextRecommendedCommand,
      humanNextStep,
      checkpoint,
      message: "Routing completed successfully.",
      delegation: createDelegationHint(
        resolveAgent(context.command),
        nextRecommendedCommand,
        nextRecommendedCommand ? resolveAgent(nextRecommendedCommand) : null,
        nextRecommendedCommand
          ? [`${resolveAgent(nextRecommendedCommand)} owns the next stage after ${context.command}.`]
          : ["No further stage progression is available after this command."]
      ),
      intelligence: context.command === "/vibe.plan" ? {
        provider: new ProviderSelector().evaluate({
          reasoningQualityRequired: "high",
          writingQualityRequired: "high",
          costSensitivity: "medium",
          latencyTolerance: "medium",
          structuredOutputRequired: true
        })
      } : context.command === "/vibe.scaffold" ? {
        bootstrap: buildBootstrapPlan(initialState, context.args, modelEscalationAdvice),
        ...(stackAdvice ? { stack: stackAdvice } : {}),
        ...(providerAdvice ? { provider: providerAdvice } : {}),
        ...(modelEscalationAdvice ? { modelEscalation: modelEscalationAdvice } : {}),
        ...(prdBootstrapAdvice ? {
          prdBootstrap: prdBootstrapAdvice,
          prdQualityGates: runPrdQualityGates(initialState)
        } : {}),
        ...(postPrdExpansionAdvice ? {
          postPrdExpansion: postPrdExpansionAdvice
        } : {}),
        ...(expansionPlanAdvice ? {
          expansionPlan: expansionPlanAdvice
        } : {})
      } : eventAdvice ? {
        ...(stackAdvice ? { stack: stackAdvice } : {}),
        ...(providerAdvice ? { provider: providerAdvice } : {}),
        events: eventAdvice,
        ...(modelEscalationAdvice ? { modelEscalation: modelEscalationAdvice } : {})
      } : modelEscalationAdvice ? {
        ...(stackAdvice ? { stack: stackAdvice } : {}),
        ...(providerAdvice ? { provider: providerAdvice } : {}),
        modelEscalation: modelEscalationAdvice
      } : stackAdvice || providerAdvice ? {
        ...(stackAdvice ? { stack: stackAdvice } : {}),
        ...(providerAdvice ? { provider: providerAdvice } : {})
      } : undefined
    };
  }
}
