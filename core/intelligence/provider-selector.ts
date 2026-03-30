/**
 * Provider Selector Intelligence
 *
 * Recommends the optimal AI provider and model for the resulting project's features
 * (not the VDD coding agent itself).
 */

export interface ProviderSelectionInput {
  reasoningQualityRequired: "extreme" | "high" | "moderate";
  writingQualityRequired: "high" | "moderate";
  costSensitivity: "high" | "medium" | "low";
  latencyTolerance: "high" | "medium" | "low";
  structuredOutputRequired: boolean;
}

export interface ProviderRecommendation {
  topProvider: string;
  topModel: string;
  alternatives: { provider: string; model: string; reason: string }[];
  rationale: string;
  caveats: string[];
  freshnessStatus: "verified_static" | "mcp_checked" | "unverified";
}

export class ProviderSelector {
  evaluate(input: ProviderSelectionInput): ProviderRecommendation {
    // Fast, cheap structured output overrides
    if (input.costSensitivity === "high" && input.latencyTolerance === "low") {
      return {
        topProvider: "Google",
        topModel: "gemini-2.5-flash",
        alternatives: [
          { provider: "Anthropic", model: "claude-3-5-haiku", reason: "Good alternative for fast reasoning" },
          { provider: "OpenAI", model: "gpt-4o-mini", reason: "Standard fallback for cheap API tasks" },
        ],
        rationale: "When cost and latency are the primary constraints, Gemini 2.5 Flash provides unmatched speed and competitive output quality.",
        caveats: [
          "Complex reasoning tasks may fail.",
          "Long-context nuanced generation might degrade.",
        ],
        freshnessStatus: "verified_static",
      };
    }

    if (input.reasoningQualityRequired === "extreme") {
      return {
        topProvider: "Anthropic",
        topModel: "claude-opus-4-6",
        alternatives: [
          {
            provider: "OpenAI",
            model: "codex-on-gpt-5.4 (xhigh) / gpt-5.4",
            reason: "For very strong structured reasoning, tool-aware planning, and deep PRD or architecture synthesis.",
          },
          {
            provider: "Google",
            model: "gemini-3.1-pro",
            reason: "Good fit when you want higher-reasoning Pro planning and large-context synthesis.",
          },
        ],
        rationale:
          "Claude Opus 4.6 is the preferred Anthropic flagship for deep reasoning, long-form strategy writing, and structured product synthesis in this workflow.",
        caveats: [
          "More expensive than Flash/Haiku models.",
          "Rate limits can be strict on Tier 1 developer accounts.",
        ],
        freshnessStatus: "verified_static",
      };
    }

    if (input.writingQualityRequired === "high") {
      return {
        topProvider: "Anthropic",
        topModel: "claude-opus-4-6",
        alternatives: [
          {
            provider: "OpenAI",
            model: "codex-on-gpt-5.4 (xhigh) / gpt-5.4",
            reason: "Strong structured writing and tool-aware planning inside the OpenAI stack.",
          },
          {
            provider: "Google",
            model: "gemini-3.1-pro",
            reason: "Excellent long-context planning and strong writing quality for strategy documents.",
          },
        ],
        rationale:
          "Claude Opus 4.6 is the preferred writing-heavy option when the output must read like serious project truth instead of a generic AI draft.",
        caveats: ["Slightly higher latency for pure text generation than some competitor models."],
        freshnessStatus: "verified_static",
      };
    }

    // Default robust balanced model
    return {
      topProvider: "OpenAI",
      topModel: "gpt-5.4",
      alternatives: [
        {
          provider: "Anthropic",
          model: "claude-opus-4-6",
          reason: "Preferred when you want stronger long-form writing and premium planning quality.",
        },
        {
          provider: "Google",
          model: "gemini-3.1-pro",
          reason: "Strong Pro-tier alternative for planning, reasoning, and large-context synthesis.",
        },
      ],
      rationale:
        "GPT-5.4 is the best default OpenAI recommendation here when you want a current, high-quality general model for structured planning and execution support.",
      caveats: [
        "Higher cost and latency than mini-class models.",
        "May be unnecessary for lightweight or purely transactional product flows.",
      ],
      freshnessStatus: "verified_static",
    };
  }
}
