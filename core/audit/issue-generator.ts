/**
 * Issue Generator — converts raw violation findings into structured audit issues.
 *
 * Responsibilities:
 * - Convert ViolationFinding → AuditIssue
 * - Assign severity based on rule and context
 * - Assign workstream grouping
 * - Assign sprint recommendations
 * - Generate meaningful "why it matters" explanations
 */

import type {
  AuditIssue,
  AuditEvidence,
  RepositoryProfile,
  Severity,
  LoadedRuleFile,
  AuditFocus,
} from "./types.js";
import type { ViolationFinding } from "./codebase-auditor.js";

/**
 * Map from rule category to workstream name.
 */
const WORKSTREAM_MAP: Record<string, string> = {
  architecture: "Architecture Cleanup",
  circular: "Architecture Cleanup",
  dependency: "Architecture Cleanup",
  component: "Architecture Cleanup",
  testing: "Testing Foundation",
  security: "Security Hardening",
  environment: "Security Hardening",
  performance: "Performance",
  accessibility: "UI and Accessibility",
  ui: "UI and Accessibility",
  quality: "Quality Improvements",
  type: "Type Safety",
  error: "Error Handling",
  event: "Event and Lifecycle",
  tracking: "Event and Lifecycle",
  memory: "Event and Lifecycle",
  deps: "Dependency Hygiene",
};

/**
 * Map from rule ID prefix to default severity.
 */
const SEVERITY_MAP: Record<string, Severity> = {
  CDEP: "critical", // circular deps
  SEC: "high", // security
  ERR: "high", // error handling
  ARCH: "high", // architecture
  TEST: "medium", // testing
  A11Y: "medium", // accessibility
  MOD: "medium", // modularity
  TYPE: "medium", // type safety
  DEP: "medium", // dependencies
  ENV: "medium", // environment
  PERF: "medium", // performance
};

/**
 * "Why it matters" explanations for common issue types.
 */
const WHY_IT_MATTERS: Record<string, string> = {
  CDEP: "Circular imports prevent proper dead-code elimination and cause bundling issues. They create hidden coupling that makes the system harder to test and maintain, and can cause initialization order bugs at runtime.",
  TEST: "Missing tests mean changes can silently break existing functionality. Without test coverage, refactoring becomes risky and bugs are caught by users instead of developers.",
  SEC: "Security issues can lead to data breaches, credential leaks, and compliance violations. Hardcoded secrets in source code are one of the most common and preventable security failures.",
  A11Y: "Accessibility issues create barriers for users with disabilities and may violate legal requirements (WCAG, ADA). Missing ARIA labels and alt text make the product unusable for screen reader users.",
  MOD: "Large components violate the Single Responsibility Principle, making them harder to understand, test, and modify. They become change hotspots that slow down development.",
  TYPE: "Excessive 'any' usage defeats the purpose of TypeScript and allows type errors to slip through. Each 'any' is a place where the compiler cannot help you catch bugs.",
  ERR: "Inconsistent error handling leads to silent failures, poor user experience, and difficult debugging. Without proper error boundaries, a single component crash can bring down the entire application.",
  DEP: "Deprecated or duplicated dependencies create maintenance burden, security vulnerabilities, and potential version conflicts. They should be replaced or consolidated.",
  ENV: "Missing environment documentation and validation leads to deployment failures and configuration drift. Without .env.example, new developers cannot set up the project.",
  ARCH: "Architectural violations degrade system quality over time. Dependencies that flow in the wrong direction create tight coupling and make the system resistant to change.",
};

/**
 * Estimate effort in hours based on issue type and severity.
 */
function estimateEffort(ruleId: string, evidenceCount: number): number {
  const prefix = ruleId.replace(/-\d+$/, "");

  const baseEffort: Record<string, number> = {
    CDEP: 2,
    SEC: 3,
    ERR: 3,
    ARCH: 4,
    TEST: 4,
    A11Y: 3,
    MOD: 6,
    TYPE: 3,
    DEP: 2,
    ENV: 1,
    PERF: 4,
  };

  const base = baseEffort[prefix] ?? 3;
  // Scale with evidence count (more files = more effort)
  const scale = Math.min(evidenceCount / 3, 2);
  return Math.ceil(base * (1 + scale * 0.5));
}

/**
 * Determine workstream from category and rule source.
 */
function getWorkstream(category: string, ruleSource: string): string {
  const lower = `${category} ${ruleSource}`.toLowerCase();

  for (const [keyword, workstream] of Object.entries(WORKSTREAM_MAP)) {
    if (lower.includes(keyword)) return workstream;
  }

  return "Quality Improvements";
}

/**
 * Determine severity from rule ID and finding context.
 */
function getSeverity(ruleId: string, profile: RepositoryProfile): Severity {
  const prefix = ruleId.replace(/-\d+$/, "");
  let severity = SEVERITY_MAP[prefix] ?? "medium";

  // Escalate if critical for this project type
  if (prefix === "CDEP") severity = "critical";
  if (prefix === "SEC" && profile.hasAuth) severity = "critical";

  return severity;
}

/**
 * Generate a sprint assignment based on severity and workstream dependencies.
 */
function getSprintAssignment(severity: Severity, workstream: string): number {
  if (severity === "critical") return 1;
  if (severity === "high") return 1;
  if (workstream === "Architecture Cleanup") return 1;
  if (severity === "medium") return 2;
  return 3;
}

function nextIssueId(category: string, counter: number): string {
  const prefix = category.substring(0, 4).toUpperCase();
  return `AUD-${prefix}-${String(counter).padStart(3, "0")}`;
}

/**
 * Convert violation findings into structured audit issues.
 */
export function generateIssues(
  findings: ViolationFinding[],
  profile: RepositoryProfile,
  _loadedRules: LoadedRuleFile[],
  focus?: AuditFocus | undefined
): AuditIssue[] {
  let issueCounter = 0;

  const issues: AuditIssue[] = [];

  for (const finding of findings) {
    // Apply focus filter
    if (focus) {
      const focusKeywords: Record<string, string[]> = {
        architecture: ["architecture", "circular", "dependency", "component", "modularity"],
        testing: ["testing"],
        security: ["security", "environment"],
        performance: ["performance"],
        events: ["event", "tracking", "memory", "lifecycle"],
        accessibility: ["accessibility", "ui", "a11y"],
      };

      const keywords = focusKeywords[focus] ?? [];
      const combined = `${finding.category} ${finding.ruleSource}`.toLowerCase();
      if (!keywords.some((kw) => combined.includes(kw))) {
        continue;
      }
    }

    const severity = getSeverity(finding.ruleId, profile);
    const workstream = getWorkstream(finding.category, finding.ruleSource);
    const effort = estimateEffort(finding.ruleId, finding.evidence.length);
    const sprint = getSprintAssignment(severity, workstream);
    const rulePrefix = finding.ruleId.replace(/-\d+$/, "");

    issueCounter++;
    issues.push({
      id: nextIssueId(finding.category, issueCounter),
      title: finding.ruleName,
      severity,
      category: finding.category,
      ruleSource: finding.ruleSource,
      ruleId: finding.ruleId,
      whyItMatters: WHY_IT_MATTERS[rulePrefix] ?? `Violates ${finding.ruleName} which is important for code quality.`,
      evidence: finding.evidence,
      affectedFiles: finding.affectedFiles,
      suggestedRemediation: generateRemediationHint(finding),
      estimatedEffortHours: effort,
      sprintAssignment: sprint,
      blocks: [],
      dependsOn: [],
      workstream,
    });
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}

/**
 * Generate a specific remediation hint based on the finding.
 */
function generateRemediationHint(finding: ViolationFinding): string {
  const rulePrefix = finding.ruleId.replace(/-\d+$/, "");

  const hints: Record<string, string> = {
    CDEP: "Extract shared types and interfaces to a separate types/ file. Refactor imports to follow unidirectional flow. Use dependency injection or event-based communication instead of direct cross-imports.",
    TEST: "Add test files for each uncovered source file. Start with the most critical business logic. Use Vitest for unit tests and React Testing Library for component tests.",
    SEC: "Remove hardcoded secrets immediately. Use environment variables and a secrets manager. Add .env.example with placeholder values. Implement runtime env validation.",
    A11Y: "Add descriptive alt text to all images. Add aria-label or aria-labelledby to interactive elements. Run axe-core or Lighthouse accessibility audit for full coverage.",
    MOD: "Split large components into smaller, focused components. Extract business logic into custom hooks. Move shared UI elements into reusable primitives.",
    TYPE: "Replace 'any' with proper type definitions. Use generics where appropriate. Create shared type files for common interfaces.",
    ERR: "Add ErrorBoundary components at route and section levels. Wrap async operations in try/catch blocks. Implement consistent error logging.",
    DEP: "Replace deprecated packages with maintained alternatives. Consolidate duplicate dependencies. Run npm audit to identify vulnerabilities.",
    ENV: "Create .env.example with all required variables and descriptions. Add startup validation that checks required env vars are set.",
    ARCH: "Restructure imports to follow the unidirectional dependency rule. Move shared logic to utils/types/constants directories.",
  };

  return hints[rulePrefix] ?? "Review the violated rule and refactor the affected code to comply with the standard.";
}
