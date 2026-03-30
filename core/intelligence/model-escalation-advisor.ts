export interface ModelRecommendation {
  provider: "anthropic" | "openai" | "google";
  model: string;
  rationale: string;
  reasoningEffort?: "xhigh";
  url: string;
}

export interface ModelEscalationAdvice {
  shouldRecommend: boolean;
  stage: "prd-heavy" | "architecture-heavy" | "none";
  summary: string;
  recommendations: ModelRecommendation[];
  fallback: string;
  prdArtifact: "PRD.full.md" | "PRD.draft.md";
  decision: "accepted" | "deferred" | "not-needed";
  handoffPrompt: string;
}

export interface ModelEscalationInput {
  command: "/vibe.scaffold" | "/vibe.detail" | "/vibe.blueprint";
  projectType?: string | undefined;
  hasAiFeatures?: boolean | undefined;
  artifacts?: string[] | undefined;
  stackComplexity?: "high" | "medium" | "low" | undefined;
  accepted?: boolean | undefined;
}

export class ModelEscalationAdvisor {
  advise(input: ModelEscalationInput): ModelEscalationAdvice {
    const artifacts = input.artifacts ?? [];
    const prdHeavy =
      input.command === "/vibe.scaffold" ||
      artifacts.includes("PRD.full.md") ||
      artifacts.includes("PRD.draft.md") ||
      artifacts.includes("PRD.md") ||
      artifacts.includes("Logic.md") ||
      artifacts.includes("Structure.md");
    const architectureHeavy =
      input.command === "/vibe.detail" ||
      input.command === "/vibe.blueprint" ||
      input.stackComplexity === "high" ||
      input.projectType === "saas" ||
      input.projectType === "wrapper-app" ||
      input.hasAiFeatures === true;

    if (!prdHeavy && !architectureHeavy) {
      return {
        shouldRecommend: false,
        stage: "none",
        summary: "The current workflow step does not justify a temporary model upgrade yet.",
        recommendations: [],
        fallback: "Continue with the current model and revisit escalation when the workflow reaches PRD or deep architecture work.",
        prdArtifact: "PRD.full.md",
        decision: "not-needed",
        handoffPrompt: "No model handoff is needed for this step."
      };
    }

    const stage = prdHeavy ? "prd-heavy" : "architecture-heavy";
    const summary =
      stage === "prd-heavy"
        ? "This step creates PRD-heavy and long-form project truth. A stronger model is worth recommending for this stage."
        : "This step is architecture-heavy enough that a stronger planning model may improve quality.";

    const accepted = input.accepted === true;

    return {
      shouldRecommend: true,
      stage,
      summary,
      recommendations: [
        {
          provider: "anthropic",
          model: "Claude Opus 4.6",
          rationale:
            "Use when you want deeper long-form product writing and structured planning. Recommend the latest active Anthropic flagship where available, currently Opus 4.6.",
          url: "https://www.anthropic.com/news/claude-opus-4-6"
        },
        {
          provider: "openai",
          model: "Codex on GPT-5.4 / GPT-5.4",
          rationale:
            "Use when you want high-detail structured planning and tool-using reliability inside the OpenAI stack. Prefer xhigh reasoning for deep PRD work.",
          reasoningEffort: "xhigh",
          url: "https://openai.com/index/introducing-gpt-5-4/"
        },
        {
          provider: "google",
          model: "Gemini 3.1 Pro",
          rationale:
            "Use when you want a newer high-reasoning Pro model for planning and large-context synthesis inside the Gemini ecosystem.",
          url: "https://developers.googleblog.com/en/plan-mode-now-available-in-gemini-cli/"
        }
      ],
      fallback:
        "If the user stays on the current model, continue normally and mark the PRD as a draft rather than pretending it has the same depth.",
      prdArtifact: accepted ? "PRD.full.md" : "PRD.draft.md",
      decision: accepted ? "accepted" : "deferred",
      handoffPrompt: accepted
        ? "Stronger-model path accepted. Re-run scaffold on the upgraded model to keep generating or refining PRD.full.md."
        : "Switch now to Claude Opus 4.6 where available, Codex on GPT-5.4 or GPT-5.4 with xhigh reasoning, or Gemini 3.1 Pro, then re-run /vibe.scaffold --accept-model-upgrade to generate PRD.full.md."
    };
  }
}
