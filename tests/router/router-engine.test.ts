import { describe, it, expect } from "vitest";
import { RouterEngine } from "../../core/router/engine.js";
import type { ProjectState, RoutingContext } from "../../core/router/engine.js";

const engine = new RouterEngine();

function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectId: "test-proj",
    stage: "init",
    status: "active",
    assumptions: [],
    decisions: [],
    artifacts: [],
    gates: {
      security: "pending",
      measurement: "pending",
      realityCheck: "pending",
    },
    handoff: {
      target: "spec-kit",
      ready: false,
    },
    ...overrides,
  };
}

function ctx(
  command: RoutingContext["command"],
  state: ProjectState | null
): RoutingContext {
  return { command, state };
}

// ─── Valid Transitions ───────────────────────────────────────────────────────

describe("RouterEngine — valid transitions", () => {
  it("/vibe.start begins onboarding without requiring state", () => {
    const result = engine.run({
      command: "/vibe.start",
      state: null,
      args: {
        idea: "AI assistant for small sales teams that drafts outreach emails from new inbound leads",
        "target-user": "small B2B sales teams",
        "success-definition": "A rep can review a lead and send a good first draft in under three minutes",
        delivery: "mvp"
      }
    });
    expect(result.ok).toBe(true);
    expect(result.resolvedSkill).toBe("onboarding-guide");
    expect(result.intelligence?.onboarding?.canInitializeState).toBe(true);
    expect(result.nextRecommendedCommand).toBe("/vibe.plan");
  });

  it("/vibe.start autopilot reports that it can auto-run the early journey", () => {
    const result = engine.run({
      command: "/vibe.start",
      state: null,
      args: {
        idea: "AI assistant for small sales teams that drafts outreach emails from inbound leads",
        "target-user": "small B2B sales teams",
        "success-definition": "A rep can review a lead and send a first draft in under three minutes",
        delivery: "mvp",
        autopilot: true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.intelligence?.onboarding?.canAutoRunEarlyJourney).toBe(true);
  });

  it("/vibe.start autopilot reports blueprint readiness when the intent is strong enough", () => {
    const result = engine.run({
      command: "/vibe.start",
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
    expect(result.ok).toBe(true);
    expect(result.intelligence?.onboarding?.canAutoRunBlueprint).toBe(true);
    expect(result.intelligence?.onboarding?.recommendedCommands).toContain("/vibe.blueprint");
  });

  it("/vibe.start stays in Q&A mode when the idea is still too vague", () => {
    const result = engine.run({
      command: "/vibe.start",
      state: null,
      args: {
        idea: "I want to build something useful"
      }
    });
    expect(result.ok).toBe(true);
    expect(result.intelligence?.onboarding?.needsMoreAnswers).toBe(true);
    expect(result.nextRecommendedCommand).toBe("/vibe.start");
    expect(result.delegation?.recommendedAgent).toBe("onboarding-guide");
  });

  it("/vibe.spec-quality is valid without requiring state", () => {
    const result = engine.run({
      command: "/vibe.spec-quality",
      state: null,
      projectRoot: "/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev"
    });
    expect(result.ok).toBe(true);
    expect(result.resolvedSkill).toBe("spec-quality-checker");
    expect(result.intelligence?.specQuality?.clarityLevel).toBeDefined();
    expect(result.nextRecommendedCommand).toBe("/vibe.init");
  });

  it("/vibe.events is valid without requiring state", () => {
    const result = engine.run({
      command: "/vibe.events",
      state: null,
      args: {
        notifications: true,
        webhooks: true
      },
      projectRoot: "/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev"
    });
    expect(result.ok).toBe(true);
    expect(result.resolvedSkill).toBe("event-architecture-planner");
    expect(result.intelligence?.events?.relevance.requiresEventArchitecture).toBe(true);
    expect(result.artifactsCreated).toContain("Event-Architecture.md");
    expect(result.nextRecommendedCommand).toBe("/vibe.init");
  });

  it("/vibe.spec-quality recommends planning repair when clarity is weak", () => {
    const result = engine.run({
      command: "/vibe.spec-quality",
      state: makeState({ stage: "blueprint" }),
      projectRoot: "/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev"
    });
    expect(result.ok).toBe(true);
    expect(result.delegation?.recommendedAgent).toBe("planner");
    expect(result.nextRecommendedCommand).toBe("/vibe.plan");
  });

  it("/vibe.spec-quality becomes usable with explicit problem framing inputs", () => {
    const result = engine.run({
      command: "/vibe.spec-quality",
      state: makeState({
        stage: "init",
        targetUser: "sales teams",
        successDefinition: "A rep can qualify a lead and generate an outreach draft in under three minutes.",
        assumptions: ["Ship an MVP first", "Keep the flow inside a single web app"]
      }),
      args: {
        problem: "Sales teams still qualify inbound leads manually and lose time before first outreach.",
        "target-user": "Small B2B sales teams"
      },
      projectRoot: "/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev"
    });
    expect(result.ok).toBe(true);
    expect(result.intelligence?.specQuality?.score).toBeGreaterThanOrEqual(60);
    expect(result.intelligence?.specQuality?.clarityLevel).not.toBe("blocked");
  });

  it("/vibe.init runs without any state", () => {
    const result = engine.run(ctx("/vibe.init", null));
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("orchestrator");
    expect(result.resolvedSkill).toBe("vibe-init");
  });

  it("/vibe.plan runs from init stage", () => {
    const result = engine.run(ctx("/vibe.plan", makeState({ stage: "init" })));
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("planner");
    expect(result.resolvedSkill).toBe("vibe-plan");
  });

  it("/vibe.research runs from plan stage", () => {
    const result = engine.run(
      ctx("/vibe.research", makeState({ stage: "plan" }))
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("researcher");
  });

  it("/vibe.blueprint runs from research stage", () => {
    const result = engine.run(
      ctx("/vibe.blueprint", makeState({ stage: "research" }))
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("architect");
  });

  it("/vibe.blueprint adds Event-Architecture.md when event relevance crosses threshold", () => {
    const result = engine.run({
      command: "/vibe.blueprint",
      state: makeState({
        stage: "research",
        assumptions: ["This flow has webhooks and user notifications"]
      }),
      args: {
        notifications: true,
        webhooks: true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.artifactsCreated).toContain("Event-Architecture.md");
    expect(result.intelligence?.events?.relevance.requiresEventArchitecture).toBe(true);
  });

  it("/vibe.blueprint returns an approval-aware checkpoint summary", () => {
    const result = engine.run({
      command: "/vibe.blueprint",
      state: makeState({
        stage: "research",
        projectType: "saas",
        hasAiFeatures: true,
        assumptions: ["This flow has webhooks and user notifications"]
      }),
      args: {
        notifications: true,
        webhooks: true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.checkpoint?.checkpoint).toBe("technical-strategy-locked");
    expect(result.checkpoint?.approvals.map((approval) => approval.type)).toEqual(
      expect.arrayContaining(["stack", "provider", "events", "model-escalation"])
    );
    expect(result.checkpoint?.approvals.find((approval) => approval.type === "events")?.requiresApproval).toBe(true);
  });

  it("/vibe.detail runs from blueprint stage", () => {
    const result = engine.run(
      ctx("/vibe.detail", makeState({ stage: "blueprint" }))
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("detailer");
  });

  it("/vibe.detail adds Event-Catalog.md and Event-Contracts.md for high-complexity event systems", () => {
    const result = engine.run({
      command: "/vibe.detail",
      state: makeState({
        stage: "blueprint",
        successDefinition: "An AI workflow generates results asynchronously for users."
      }),
      args: {
        "background-jobs": true,
        notifications: true,
        webhooks: true,
        "ai-async-flows": true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.artifactsCreated).toContain("Event-Catalog.md");
    expect(result.artifactsCreated).toContain("Event-Contracts.md");
    expect(result.intelligence?.events?.relevance.requiresEventCatalog).toBe(true);
  });

  it("/vibe.scaffold runs from detail stage", () => {
    const result = engine.run(
      ctx(
        "/vibe.scaffold",
        makeState({
          stage: "detail",
          projectType: "saas",
          hasAiFeatures: true
        })
      )
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedSkill).toBe("vibe-scaffold");
    expect(result.intelligence?.modelEscalation?.shouldRecommend).toBe(true);
    expect(result.artifactsCreated).toContain("PRD.draft.md");
  });

  it("/vibe.scaffold upgrades the PRD artifact to full when model escalation is accepted", () => {
    const result = engine.run({
      command: "/vibe.scaffold",
      state: makeState({
        stage: "detail",
        projectType: "saas",
        hasAiFeatures: true
      }),
      args: {
        "accept-model-upgrade": true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.artifactsCreated).toContain("PRD.full.md");
    expect(result.intelligence?.modelEscalation?.decision).toBe("accepted");
  });

  it("/vibe.scaffold returns an explicit handoff prompt when stronger-model escalation is deferred", () => {
    const result = engine.run(
      ctx(
        "/vibe.scaffold",
        makeState({
          stage: "detail",
          projectType: "saas",
          hasAiFeatures: true
        })
      )
    );
    expect(result.ok).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("re-run /vibe.scaffold --accept-model-upgrade"))).toBe(true);
    expect(result.nextRecommendedCommand).toBe("/vibe.qa");
    expect(result.humanNextStep).toEqual([
      "Switch model to Claude Opus 4.6 where available, Codex on GPT-5.4 or GPT-5.4 with xhigh reasoning, or Gemini 3.1 Pro.",
      "Re-run /vibe.scaffold --accept-model-upgrade to generate PRD.full.md.",
      "Otherwise continue to /vibe.qa with draft PRD truth only."
    ]);
    expect(result.checkpoint?.checkpoint).toBe("prd-threshold-reached");
    expect(result.checkpoint?.approvals.find((approval) => approval.type === "model-escalation")?.status).toBe("deferred");
  });

  it("/vibe.qa runs from scaffold stage", () => {
    const result = engine.run(
      ctx("/vibe.qa", makeState({ stage: "scaffold" }))
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedAgent).toBe("qa-guardian");
  });

  it("/vibe.status is always valid regardless of stage", () => {
    const stages = [
      "init",
      "plan",
      "research",
      "blueprint",
      "detail",
      "scaffold",
      "qa",
      "handoff",
    ] as const;
    for (const stage of stages) {
      const result = engine.run(
        ctx("/vibe.status", makeState({ stage }))
      );
      expect(result.ok).toBe(true);
    }
  });

  it("/vibe.skills is valid without requiring a stage transition", () => {
    const result = engine.run(
      ctx("/vibe.skills", makeState({ stage: "plan" }))
    );
    expect(result.ok).toBe(true);
    expect(result.resolvedSkill).toBe("skill-recommender");
    expect(result.intelligence?.skills?.recommendations.length).toBeGreaterThan(0);
    expect(result.delegation?.currentOwner).toBe("orchestrator");
  });

  it("/vibe.events recommends architect ownership from research-stage event design", () => {
    const result = engine.run({
      command: "/vibe.events",
      state: makeState({ stage: "research" }),
      args: {
        notifications: true,
        webhooks: true
      }
    });
    expect(result.ok).toBe(true);
    expect(result.delegation?.recommendedAgent).toBe("architect");
    expect(result.nextRecommendedCommand).toBe("/vibe.blueprint");
  });

  it("/vibe.skills exposes specialist ownership for bundle-guided recommendations", () => {
    const result = engine.run({
      command: "/vibe.skills",
      state: makeState({ stage: "blueprint" }),
      args: { bundle: "frontend-polish" },
      projectRoot: "/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev"
    });
    expect(result.ok).toBe(true);
    expect(result.delegation?.recommendedAgent).toBe("architect");
    expect(result.intelligence?.skills?.recommendedSpecialists[0]?.agent).toBe("architect");
  });

  it("/vibe.next is always valid", () => {
    const result = engine.run(
      ctx("/vibe.next", makeState({ stage: "plan" }))
    );
    expect(result.ok).toBe(true);
  });

  it("/vibe.decide is always valid", () => {
    const result = engine.run(
      ctx("/vibe.decide", makeState({ stage: "research" }))
    );
    expect(result.ok).toBe(true);
  });
});

// ─── Invalid Jumps ───────────────────────────────────────────────────────────

describe("RouterEngine — invalid stage jumps", () => {
  it("blocks /vibe.research from init stage (stage jump)", () => {
    const result = engine.run(
      ctx("/vibe.research", makeState({ stage: "init" }))
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("blocks /vibe.blueprint from init stage", () => {
    const result = engine.run(
      ctx("/vibe.blueprint", makeState({ stage: "init" }))
    );
    expect(result.ok).toBe(false);
  });

  it("blocks /vibe.qa from plan stage (skipping multiple stages)", () => {
    const result = engine.run(
      ctx("/vibe.qa", makeState({ stage: "plan" }))
    );
    expect(result.ok).toBe(false);
  });

  it("returns blockers describing the invalid jump", () => {
    const result = engine.run(
      ctx("/vibe.scaffold", makeState({ stage: "init" }))
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.some((b) => b.toLowerCase().includes("jump") || b.toLowerCase().includes("cannot"))).toBe(true);
  });
});

// ─── Handoff Blocked Before QA ───────────────────────────────────────────────

describe("RouterEngine — handoff blocked before handoff-ready", () => {
  it("blocks /vibe.handoff-to-spec when not handoff-ready", () => {
    const result = engine.run(
      ctx(
        "/vibe.handoff-to-spec",
        makeState({ stage: "qa", handoff: { target: "spec-kit", ready: false } })
      )
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.some((b) => b.toLowerCase().includes("handoff-ready") || b.toLowerCase().includes("not marked"))).toBe(true);
  });

  it("allows /vibe.handoff-to-spec when handoff-ready and on handoff stage", () => {
    const result = engine.run(
      ctx(
        "/vibe.handoff-to-spec",
        makeState({
          stage: "handoff",
          status: "handoff-ready",
          handoff: { target: "spec-kit", ready: true },
        })
      )
    );
    expect(result.ok).toBe(true);
  });
});

// ─── No State Requires Init First ────────────────────────────────────────────

describe("RouterEngine — null state handling", () => {
  it("blocks /vibe.plan when no state exists", () => {
    const result = engine.run(ctx("/vibe.plan", null));
    expect(result.ok).toBe(false);
    expect(result.blockers.some((b) => b.includes("vibe.init"))).toBe(true);
  });

  it("blocks /vibe.qa when no state exists", () => {
    const result = engine.run(ctx("/vibe.qa", null));
    expect(result.ok).toBe(false);
  });

  it("allows /vibe.skills when no state exists", () => {
    const result = engine.run(ctx("/vibe.skills", null));
    expect(result.ok).toBe(true);
    expect(result.nextRecommendedCommand).toBe("/vibe.init");
  });

  it("allows /vibe.start when no state exists", () => {
    const result = engine.run(ctx("/vibe.start", null));
    expect(result.ok).toBe(true);
  });
});

// ─── Next Recommendation ─────────────────────────────────────────────────────

describe("RouterEngine — /vibe.next recommendation", () => {
  it("recommends /vibe.plan after init", () => {
    const result = engine.run(ctx("/vibe.next", makeState({ stage: "init" })));
    expect(result.ok).toBe(true);
    expect(result.nextRecommendedCommand).toBe("/vibe.plan");
    expect(result.delegation?.recommendedAgent).toBe("planner");
  });

  it("recommends /vibe.research after plan", () => {
    const result = engine.run(ctx("/vibe.next", makeState({ stage: "plan" })));
    expect(result.nextRecommendedCommand).toBe("/vibe.research");
  });

  it("recommends /vibe.qa after scaffold", () => {
    const result = engine.run(ctx("/vibe.next", makeState({ stage: "scaffold" })));
    expect(result.nextRecommendedCommand).toBe("/vibe.qa");
  });
});

// ─── Artifact Simulation ─────────────────────────────────────────────────────

describe("RouterEngine — artifact simulation", () => {
  it("lists artifacts for /vibe.scaffold", () => {
    const result = engine.run(
      ctx("/vibe.scaffold", makeState({ stage: "detail" }))
    );
    expect(result.artifactsCreated).toContain("PRD.draft.md");
    expect(result.artifactsCreated).toContain("Memory.md");
    expect(result.artifactsCreated).toContain("anti-hallucination.md");
  });

  it("lists artifacts for /vibe.plan", () => {
    const result = engine.run(ctx("/vibe.plan", makeState({ stage: "init" })));
    expect(result.artifactsCreated).toContain("problem-statement.md");
    expect(result.artifactsCreated).toContain("scope.md");
  });
});
