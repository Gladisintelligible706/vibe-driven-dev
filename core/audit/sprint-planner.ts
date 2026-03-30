/**
 * Sprint Planner — assigns issues to sprints based on severity, dependencies, and workstreams.
 *
 * Responsibilities:
 * - Group issues into workstreams
 * - Assign issues to Sprint 1, 2, or 3
 * - Consider dependencies between issues
 * - Generate sprint goals and success criteria
 */

import type { AuditIssue, Workstream, SprintPlan, Severity } from "./types.js";

/**
 * Group issues into workstreams.
 */
export function groupIntoWorkstreams(issues: AuditIssue[]): Workstream[] {
  const workstreamMap = new Map<string, AuditIssue[]>();

  for (const issue of issues) {
    const ws = issue.workstream ?? "Quality Improvements";
    if (!workstreamMap.has(ws)) {
      workstreamMap.set(ws, []);
    }
    workstreamMap.get(ws)!.push(issue);
  }

  const workstreams: Workstream[] = [];

  const priorityOrder: Record<string, Severity> = {
    "Architecture Cleanup": "critical",
    "Security Hardening": "critical",
    "Event and Lifecycle": "high",
    "Testing Foundation": "high",
    "Error Handling": "high",
    "Dependency Hygiene": "medium",
    "UI and Accessibility": "medium",
    "Performance": "medium",
    "Type Safety": "medium",
    "Quality Improvements": "low",
  };

  const whyItMattersMap: Record<string, string> = {
    "Architecture Cleanup": "Without clean architecture, every subsequent change becomes riskier. Circular dependencies and layer violations create hidden coupling that makes the system resistant to change.",
    "Security Hardening": "Security issues can lead to data breaches and compliance violations. These must be addressed before the project scales.",
    "Testing Foundation": "Without reliable tests, refactoring becomes dangerous and bugs reach users. A strong test foundation enables confident iteration.",
    "Event and Lifecycle": "Unclear event ownership leads to subtle bugs in async flows. Clear event architecture makes the system predictable and debuggable.",
    "Error Handling": "Inconsistent error handling causes silent failures and poor user experience. A unified error model improves reliability and debuggability.",
    "Dependency Hygiene": "Deprecated or duplicated dependencies create maintenance burden and security vulnerabilities.",
    "UI and Accessibility": "Accessibility issues create barriers for users and may create legal liability. UI quality directly impacts user satisfaction.",
    "Performance": "Performance issues compound over time and become expensive to fix. Early optimization of critical paths prevents future bottlenecks.",
    "Type Safety": "TypeScript gaps allow bugs to slip through the compiler. Strong types catch errors before they reach production.",
    "Quality Improvements": "General quality improvements that make the codebase more maintainable and professional.",
  };

  const successCriteriaMap: Record<string, string[]> = {
    "Architecture Cleanup": [
      "All circular dependencies resolved",
      "Import paths follow unidirectional pattern",
      "No layer violations detected",
    ],
    "Security Hardening": [
      "No hardcoded secrets in source code",
      ".env.example exists with all variables documented",
      "Environment validation implemented",
    ],
    "Testing Foundation": [
      "Test files exist for all source files",
      "Critical paths have integration tests",
      "Coverage meets 80% threshold",
    ],
    "Event and Lifecycle": [
      "Event architecture documented",
      "Producer/consumer relationships defined",
      "Event naming is consistent",
    ],
    "Error Handling": [
      "ErrorBoundary present in component tree",
      "All async functions have error handling",
      "User-friendly error messages implemented",
    ],
    "Dependency Hygiene": [
      "No deprecated packages in dependencies",
      "No duplicate dependencies",
      "npm audit shows no critical vulnerabilities",
    ],
    "UI and Accessibility": [
      "All images have alt text",
      "Interactive elements have ARIA labels",
      "Keyboard navigation works for all flows",
    ],
    "Performance": [
      "No oversized components (>250 lines)",
      "Lazy loading implemented for routes",
      "Bundle size within target",
    ],
    "Type Safety": [
      "No excessive 'any' usage",
      "Shared types defined in types/ directory",
      "Strict TypeScript mode enabled",
    ],
    "Quality Improvements": [
      "All quality issues resolved",
      "Code style consistent across codebase",
    ],
  };

  for (const [name, wsIssues] of workstreamMap) {
    const totalEffort = wsIssues.reduce((sum, i) => sum + i.estimatedEffortHours, 0);
    const maxSeverity = wsIssues.reduce<Severity>((max, i) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[i.severity] < order[max] ? i.severity : max;
    }, "low");

    workstreams.push({
      name,
      priority: priorityOrder[name] ?? maxSeverity,
      effort: `${totalEffort}-${totalEffort + Math.ceil(totalEffort * 0.3)}h`,
      issues: wsIssues,
      dependsOn: name === "Architecture Cleanup" ? [] : ["Architecture Cleanup"],
      whyItMatters: whyItMattersMap[name] ?? `This workstream addresses ${name.toLowerCase()} issues.`,
      successCriteria: successCriteriaMap[name] ?? [`${name} issues resolved`],
    });
  }

  // Sort: Architecture first, then by severity
  const wsOrder: Record<string, number> = {
    "Architecture Cleanup": 0,
    "Security Hardening": 1,
    "Error Handling": 2,
    "Event and Lifecycle": 3,
    "Testing Foundation": 4,
    "Dependency Hygiene": 5,
    "UI and Accessibility": 6,
    "Type Safety": 7,
    "Performance": 8,
    "Quality Improvements": 9,
  };

  workstreams.sort((a, b) => (wsOrder[a.name] ?? 10) - (wsOrder[b.name] ?? 10));

  return workstreams;
}

/**
 * Assign issues to sprints.
 */
export function planSprints(issues: AuditIssue[], workstreams: Workstream[]): SprintPlan[] {
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  // Sprint 1: Critical and high severity + architecture cleanup
  const sprint1Issues = issues.filter(
    (i) =>
      i.severity === "critical" ||
      i.severity === "high" ||
      i.workstream === "Architecture Cleanup" ||
      i.workstream === "Security Hardening"
  );

  // Sprint 2: Medium severity + testing + events
  const sprint2Issues = issues.filter(
    (i) =>
      !sprint1Issues.includes(i) &&
      (i.severity === "medium" ||
        i.workstream === "Testing Foundation" ||
        i.workstream === "Event and Lifecycle")
  );

  // Sprint 3: Everything else
  const sprint3Issues = issues.filter(
    (i) => !sprint1Issues.includes(i) && !sprint2Issues.includes(i)
  );

  const totalEffort1 = sprint1Issues.reduce((s, i) => s + i.estimatedEffortHours, 0);
  const totalEffort2 = sprint2Issues.reduce((s, i) => s + i.estimatedEffortHours, 0);
  const totalEffort3 = sprint3Issues.reduce((s, i) => s + i.estimatedEffortHours, 0);

  return [
    {
      sprint: 1,
      name: "Foundation & Critical Fixes",
      duration: "1 week",
      priority: "critical",
      goal: "Fix critical structural issues, security gaps, and architecture violations that block all other work.",
      issues: sprint1Issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
      successCriteria: [
        `All ${sprint1Issues.filter((i) => i.severity === "critical").length} critical issues resolved`,
        "Circular dependencies eliminated",
        "Security issues addressed",
        `Total effort: ~${totalEffort1}h`,
      ],
    },
    {
      sprint: 2,
      name: "Quality & Architecture",
      duration: "1 week",
      priority: "high",
      goal: "Establish testing foundation, improve event architecture, and address medium-severity quality gaps.",
      issues: sprint2Issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
      successCriteria: [
        "Test coverage targets met",
        "Error handling standardized",
        `Total effort: ~${totalEffort2}h`,
      ],
    },
    {
      sprint: 3,
      name: "Polish & Optimization",
      duration: "1 week",
      priority: "medium",
      goal: "Handle remaining medium and low issues, optimize performance, and improve accessibility.",
      issues: sprint3Issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
      successCriteria: [
        "All remaining issues addressed",
        "Accessibility audit passes",
        `Total effort: ~${totalEffort3}h`,
      ],
    },
  ];
}
