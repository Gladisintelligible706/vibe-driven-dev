import { describe, expect, it } from "vitest";
import { OnboardingEngine } from "../../core/intelligence/onboarding-engine.js";
import { ModelEscalationAdvisor } from "../../core/intelligence/model-escalation-advisor.js";
import { ProviderSelector } from "../../core/intelligence/provider-selector.js";
import { ConfidenceEngine } from "../../core/autopilot/confidence-engine.js";
import { AutopilotConductor } from "../../core/autopilot/conductor.js";

describe("OnboardingEngine", () => {
  it("returns questions when the project idea is still vague", () => {
    const result = new OnboardingEngine().assess({
      state: null,
      args: {
        idea: "I want to build something useful"
      }
    });

    expect(result.needsMoreAnswers).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.canInitializeState).toBe(false);
  });

  it("builds a normalized seed when the user gives enough plain-language detail", () => {
    const result = new OnboardingEngine().assess({
      state: null,
      args: {
        idea: "AI assistant for small sales teams that drafts outreach emails from inbound leads",
        "target-user": "small B2B sales teams",
        "success-definition": "A rep can review a lead and send a first draft in under three minutes",
        delivery: "mvp"
      }
    });

    expect(result.canInitializeState).toBe(true);
    expect(result.seed.projectType).toBeDefined();
    expect(result.seed.hasAiFeatures).toBe(true);
  });

  it("marks blueprint autopilot as ready when the intent is detailed enough", () => {
    const result = new OnboardingEngine().assess({
      state: null,
      args: {
        idea:
          "AI assistant for small sales teams that drafts outreach emails from inbound leads and coordinates qualification, routing, and follow-up workflows",
        "target-user": "small B2B sales teams",
        "success-definition":
          "A rep can review a lead, approve a personalized first draft, and push the lead into the right follow-up workflow in under three minutes",
        delivery: "foundation",
        constraints: "keep human approval in the loop; web app first",
        autopilot: true
      }
    });

    expect(result.canInitializeState).toBe(true);
    expect(result.canAutoRunBlueprint).toBe(true);
    expect(result.recommendedCommands).toContain("/vibe.blueprint");
  });
});

describe("Autopilot runtime", () => {
  it("asks for more detail when onboarding confidence is still low", () => {
    const onboarding = new OnboardingEngine().assess({
      state: null,
      args: {
        idea: "I want to build something useful",
        autopilot: true
      }
    });

    const confidence = new ConfidenceEngine().assess({ onboarding });
    expect(confidence.decision).toBe("ask");
    expect(confidence.canContinuePlanningPackage).toBe(false);
  });

  it("plans the planning package mission when autopilot can continue safely", () => {
    const onboarding = new OnboardingEngine().assess({
      state: null,
      args: {
        idea: "Tool for sales teams to draft outreach emails from inbound leads",
        "target-user": "sales teams",
        "success-definition": "Draft a first reply quickly",
        delivery: "mvp",
        autopilot: true
      }
    });

    const plan = new AutopilotConductor().plan({
      onboarding,
      currentStage: "init"
    });

    expect(plan.continueAutomatically).toBe(true);
    expect(plan.mission).toBe("build-planning-package");
    expect(plan.checkpointAfter).toBe("planning-package-complete");
    expect(plan.steps.map((step) => step.command)).toEqual(["/vibe.plan", "/vibe.research"]);
  });

  it("plans the technical-direction mission when autopilot confidence is high enough for blueprint", () => {
    const onboarding = new OnboardingEngine().assess({
      state: null,
      args: {
        idea:
          "AI assistant for small sales teams that drafts outreach emails from inbound leads and coordinates qualification, routing, and follow-up workflows",
        "target-user": "small B2B sales teams",
        "success-definition":
          "A rep can review a lead, approve a personalized first draft, and push the lead into the right follow-up workflow in under three minutes",
        delivery: "foundation",
        constraints: "keep human approval in the loop; web app first",
        autopilot: true
      }
    });

    const plan = new AutopilotConductor().plan({
      onboarding,
      currentStage: "init"
    });

    expect(plan.continueAutomatically).toBe(true);
    expect(plan.mission).toBe("lock-technical-direction");
    expect(plan.checkpointAfter).toBe("technical-strategy-locked");
    expect(plan.steps.map((step) => step.command)).toEqual([
      "/vibe.plan",
      "/vibe.research",
      "/vibe.blueprint"
    ]);
  });
});

describe("ModelEscalationAdvisor", () => {
  it("recommends a stronger model for PRD-heavy scaffold work", () => {
    const result = new ModelEscalationAdvisor().advise({
      command: "/vibe.scaffold",
      projectType: "saas",
      hasAiFeatures: true,
      artifacts: ["PRD.md", "Logic.md"],
      stackComplexity: "high"
    });

    expect(result.shouldRecommend).toBe(true);
    expect(result.recommendations[0]?.model).toContain("Claude Opus 4.6");
    expect(result.recommendations[1]?.reasoningEffort).toBe("xhigh");
    expect(result.recommendations[1]?.model).toContain("Codex on GPT-5.4");
    expect(result.recommendations[2]?.model).toContain("Gemini 3.1 Pro");
    expect(result.prdArtifact).toBe("PRD.draft.md");
    expect(result.decision).toBe("deferred");
  });

  it("marks the PRD as full when stronger-model escalation is accepted", () => {
    const result = new ModelEscalationAdvisor().advise({
      command: "/vibe.scaffold",
      projectType: "saas",
      hasAiFeatures: true,
      artifacts: ["PRD.md", "Logic.md"],
      stackComplexity: "high",
      accepted: true
    });

    expect(result.shouldRecommend).toBe(true);
    expect(result.prdArtifact).toBe("PRD.full.md");
    expect(result.decision).toBe("accepted");
    expect(result.handoffPrompt).toContain("PRD.full.md");
  });
});

describe("ProviderSelector", () => {
  it("uses modern flagship recommendations for extreme reasoning work", () => {
    const result = new ProviderSelector().evaluate({
      reasoningQualityRequired: "extreme",
      writingQualityRequired: "high",
      costSensitivity: "low",
      latencyTolerance: "high",
      structuredOutputRequired: true
    });

    expect(result.topProvider).toBe("Anthropic");
    expect(result.topModel).toBe("claude-opus-4-6");
    expect(result.alternatives.some((alt) => alt.model.toLowerCase().includes("codex-on-gpt-5.4"))).toBe(true);
    expect(result.alternatives.some((alt) => alt.model.includes("gemini-3.1-pro"))).toBe(true);
  });
});
