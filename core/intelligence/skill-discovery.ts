/**
 * Skill Discovery
 *
 * Generates targeted search queries from the project profile so VDD can
 * search the open skills ecosystem through find-skills intelligently.
 *
 * This module does not talk to the network directly.
 * It produces the queries that the bootstrap orchestrator (skill-bootstrap.ts)
 * will execute against find-skills CLI.
 */

import type { SkillRecommendationProjectInput } from "./skill-recommender.js";

export type GapCategory =
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

export interface DiscoveryQuery {
  query: string;
  category: GapCategory;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface DiscoveryPlan {
  queries: DiscoveryQuery[];
  gapCategories: GapCategory[];
  summary: string;
}

const STACK_QUERIES: Array<{
  match: (input: SkillRecommendationProjectInput) => boolean;
  queries: Array<{ query: string; category: GapCategory; reason: string }>;
}> = [
  {
    match: (input) =>
      Boolean(input.stackHints?.some((h) => /next/i.test(h))) ||
      Boolean(input.platform?.toLowerCase().includes("next")),
    queries: [
      { query: "nextjs", category: "frontend", reason: "Project uses Next.js" },
      { query: "react performance", category: "performance", reason: "React/Next.js performance patterns" }
    ]
  },
  {
    match: (input) =>
      Boolean(input.stackHints?.some((h) => /react/i.test(h))) && !input.stackHints?.some((h) => /next/i.test(h)),
    queries: [
      { query: "react testing", category: "testing", reason: "React testing patterns" }
    ]
  },
  {
    match: (input) => input.hasAiFeatures === true,
    queries: [
      { query: "ai agent", category: "AI integration", reason: "Project has AI features" },
      { query: "mcp", category: "MCP", reason: "MCP integration for AI tools" },
      { query: "prompt engineering", category: "AI integration", reason: "AI prompt quality" }
    ]
  },
  {
    match: (input) => input.needsAuth === true,
    queries: [
      { query: "auth best practices", category: "auth", reason: "Project needs authentication" },
      { query: "security", category: "security", reason: "Auth implies security concerns" }
    ]
  },
  {
    match: (input) => input.needsDatabase === true,
    queries: [
      { query: "database", category: "backend", reason: "Project needs database access" }
    ]
  },
  {
    match: (input) => input.designSensitive === true,
    queries: [
      { query: "web design", category: "design", reason: "Project is design-sensitive" },
      { query: "accessibility", category: "design", reason: "Design-sensitive projects need a11y" }
    ]
  },
  {
    match: (input) => input.performanceSensitive === true,
    queries: [
      { query: "performance", category: "performance", reason: "Project is performance-sensitive" }
    ]
  },
  {
    match: (input) => input.projectType === "wrapper-app",
    queries: [
      { query: "tool calling", category: "AI integration", reason: "Wrapper apps need tool integration" }
    ]
  }
];

// Gap-based queries that apply to most projects regardless of stack
const UNIVERSAL_QUERIES: Array<{ query: string; category: GapCategory; reason: string }> = [
  { query: "systematic debugging", category: "debugging", reason: "Every project benefits from debugging discipline" },
  { query: "testing", category: "testing", reason: "Testing is universally needed" },
  { query: "pr review", category: "docs", reason: "Code review improves quality" }
];

// Stage-dependent queries
const STAGE_QUERIES: Record<string, Array<{ query: string; category: GapCategory; reason: string }>> = {
  init: [
    { query: "project setup", category: "planning", reason: "Early setup stage" }
  ],
  plan: [
    { query: "spec writing", category: "planning", reason: "Planning stage" },
    { query: "requirements", category: "planning", reason: "Requirements gathering" }
  ],
  research: [
    { query: "architecture", category: "planning", reason: "Research stage needs architecture patterns" }
  ],
  blueprint: [
    { query: "design system", category: "design", reason: "Blueprint stage defines design" },
    { query: "system design", category: "planning", reason: "Blueprint stage defines system boundaries" }
  ],
  detail: [
    { query: "code review", category: "docs", reason: "Detail stage benefits from review patterns" }
  ],
  scaffold: [
    { query: "deployment", category: "deployment", reason: "Scaffold stage prepares for deployment" },
    { query: "ci cd", category: "deployment", reason: "Scaffold stage needs CI/CD patterns" }
  ],
  qa: [
    { query: "e2e testing", category: "testing", reason: "QA stage needs E2E testing" },
    { query: "playwright", category: "testing", reason: "QA stage may need browser testing" }
  ],
  handoff: [
    { query: "changelog", category: "docs", reason: "Handoff stage benefits from changelogs" },
    { query: "release notes", category: "docs", reason: "Handoff stage needs release documentation" }
  ]
};

function categorizeProjectGaps(input: SkillRecommendationProjectInput): GapCategory[] {
  const gaps = new Set<GapCategory>();

  // Always useful
  gaps.add("testing");
  gaps.add("debugging");

  if (input.hasAiFeatures) {
    gaps.add("AI integration");
    gaps.add("MCP");
  }

  if (input.needsAuth) {
    gaps.add("auth");
    gaps.add("security");
  }

  if (input.needsDatabase) {
    gaps.add("backend");
    gaps.add("database");
  }

  if (input.frontendHeavy) {
    gaps.add("frontend");
    gaps.add("design");
    gaps.add("product polish");
  }

  if (input.backendHeavy) {
    gaps.add("backend");
  }

  if (input.designSensitive) {
    gaps.add("design");
    gaps.add("product polish");
  }

  if (input.performanceSensitive) {
    gaps.add("performance");
  }

  if (input.securitySensitive) {
    gaps.add("security");
  }

  if (input.projectType === "saas" || input.projectType === "wrapper-app") {
    gaps.add("deployment");
    gaps.add("planning");
  }

  return [...gaps];
}

/**
 * Generate a discovery plan with targeted search queries for the project.
 *
 * Queries are ranked by priority:
 * - high: directly addresses the project's primary gaps
 * - medium: supports the current workflow stage
 * - low: useful general capabilities
 */
export function generateDiscoveryPlan(
  input: SkillRecommendationProjectInput,
  currentStage?: string | undefined
): DiscoveryPlan {
  const gaps = categorizeProjectGaps(input);
  const queryMap = new Map<string, DiscoveryQuery>();

  // Add universal queries at medium priority
  for (const uq of UNIVERSAL_QUERIES) {
    if (!queryMap.has(uq.query)) {
      queryMap.set(uq.query, {
        query: uq.query,
        category: uq.category,
        priority: "medium",
        reason: uq.reason
      });
    }
  }

  // Add stack-specific queries at high priority
  for (const sq of STACK_QUERIES) {
    if (!sq.match(input)) {
      continue;
    }
    for (const q of sq.queries) {
      if (!queryMap.has(q.query)) {
        queryMap.set(q.query, {
          query: q.query,
          category: q.category,
          priority: "high",
          reason: q.reason
        });
      }
    }
  }

  // Add stage-specific queries at medium priority
  if (currentStage) {
    const stageQs = STAGE_QUERIES[currentStage];
    if (stageQs) {
      for (const sq of stageQs) {
        if (!queryMap.has(sq.query)) {
          queryMap.set(sq.query, {
            query: sq.query,
            category: sq.category,
            priority: "medium",
            reason: sq.reason
          });
        }
      }
    }
  }

  // Sort: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const queries = [...queryMap.values()].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return {
    queries,
    gapCategories: gaps,
    summary: `Generated ${queries.length} discovery queries covering ${gaps.length} gap categories for a ${input.projectType ?? "mvp"} project.`
  };
}
