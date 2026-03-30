/**
 * Report Writer — generates all audit output artifacts.
 *
 * Produces:
 * - Audit-Report.md (executive summary)
 * - Audit-Issues.json (machine-readable)
 * - Refactor-Plan.md (workstream grouping)
 * - Sprint-Plan.md (execution roadmap)
 */

import fs from "fs-extra";
import path from "node:path";
import type {
  AuditReport,
  AuditIssue,
  Workstream,
  SprintPlan,
  RepositoryProfile,
  LoadedRuleFile,
  Severity,
} from "./types.js";

/**
 * Generate the audit output directory path.
 */
export function getAuditOutputDir(repoPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return path.join(repoPath, "audit-artifacts", timestamp);
}

/**
 * Write all audit artifacts to disk.
 */
export async function writeAuditArtifacts(
  outputDir: string,
  report: AuditReport
): Promise<string[]> {
  await fs.ensureDir(outputDir);
  const files: string[] = [];

  // 1. Audit-Report.md
  const reportMd = generateAuditReportMarkdown(report);
  const reportPath = path.join(outputDir, "Audit-Report.md");
  await fs.writeFile(reportPath, reportMd);
  files.push(reportPath);

  // 2. Audit-Issues.json
  const issuesPath = path.join(outputDir, "Audit-Issues.json");
  await fs.writeJSON(issuesPath, buildIssuesJson(report), { spaces: 2 });
  files.push(issuesPath);

  // 3. Refactor-Plan.md
  const refactorMd = generateRefactorPlanMarkdown(report);
  const refactorPath = path.join(outputDir, "Refactor-Plan.md");
  await fs.writeFile(refactorPath, refactorMd);
  files.push(refactorPath);

  // 4. Sprint-Plan.md
  const sprintMd = generateSprintPlanMarkdown(report);
  const sprintPath = path.join(outputDir, "Sprint-Plan.md");
  await fs.writeFile(sprintPath, sprintMd);
  files.push(sprintPath);

  return files;
}

/**
 * Build the machine-readable Audit-Issues.json structure.
 */
function buildIssuesJson(report: AuditReport) {
  return {
    audit_metadata: report.metadata,
    repository_profile: report.profile,
    rulesets_applied: report.rulesApplied.map((r) => ({
      path: r.path,
      name: r.name,
      selected_because: r.selectedBecause,
      rule_count: r.rules.length,
    })),
    issues: report.issues.map((i) => ({
      issue_id: i.id,
      title: i.title,
      severity: i.severity,
      category: i.category,
      rule_source: i.ruleSource,
      rule_id: i.ruleId,
      why_it_matters: i.whyItMatters,
      evidence: i.evidence,
      affected_files: i.affectedFiles,
      suggested_remediation: i.suggestedRemediation,
      estimated_effort_hours: i.estimatedEffortHours,
      sprint_assignment: i.sprintAssignment,
      workstream: i.workstream,
    })),
  };
}

/**
 * Generate Audit-Report.md — the executive summary.
 */
function generateAuditReportMarkdown(report: AuditReport): string {
  const { metadata, profile, issues, workstreams, riskLevel } = report;

  const riskEmoji: Record<Severity, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  const topIssues = issues.slice(0, 10);

  return `# Code Audit Report

**Generated:** ${metadata.timestamp}
**Repository:** ${metadata.repositoryPath}
**Audit Scope:** ${metadata.focusArea ?? "full"}

---

## Executive Summary

${report.executiveSummary}

---

## Repository Profile

- **Type:** ${profile.type}
- **Languages:** ${Object.entries(profile.languages).map(([k, v]) => `${k} (${v} files)`).join(", ") || "Unknown"}
- **Frameworks:** ${profile.frameworks.join(", ") || "None detected"}
- **Total Files:** ${profile.totalFiles}
- **Testing:** ${profile.hasTests ? `Yes (${profile.testFramework ?? "unknown framework"})` : "No"}
- **Auth:** ${profile.hasAuth ? "Yes" : "No"}
- **AI Features:** ${profile.hasAI ? "Yes" : "No"}
- **Events:** ${profile.hasEvents ? "Yes" : "No"}
- **TypeScript:** ${profile.hasTypescript ? "Yes" : "No"}
- **CI/CD:** ${profile.ciConfig ?? "Not detected"}
- **Package Manager:** ${profile.packageManager}

---

## Rule Coverage

- **Rulesets Applied:** ${report.rulesApplied.length}
${report.rulesApplied.map((r) => `- ${r.path} — ${r.selectedBecause}`).join("\n")}

---

## Issues Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${metadata.critical} |
| 🟠 High | ${metadata.high} |
| 🟡 Medium | ${metadata.medium} |
| 🟢 Low | ${metadata.low} |
| **Total** | **${metadata.totalIssues}** |

---

## Risk Assessment

**Overall Risk: ${riskEmoji[riskLevel]} ${riskLevel.toUpperCase()}**

${issues.length > 0 ? `### Top Findings

${topIssues
  .map(
    (issue) => `#### ${issue.id}: ${issue.title}
- **Severity:** ${riskEmoji[issue.severity]} ${issue.severity}
- **Category:** ${issue.category}
- **Sprint:** ${issue.sprintAssignment}
- **Effort:** ${issue.estimatedEffortHours}h

${issue.evidence.map((e) => `- \`${e.file}\`: ${e.pattern}`).join("\n")}

**Why it matters:** ${issue.whyItMatters}

**Fix:** ${issue.suggestedRemediation}
`
  )
  .join("\n---\n\n")}` : "No issues found. The codebase looks healthy!"}

---

## Workstreams

${workstreams
  .map(
    (ws) => `### ${ws.name}
- **Priority:** ${ws.priority}
- **Effort:** ${ws.effort}
- **Issues:** ${ws.issues.length}
- **Why:** ${ws.whyItMatters}
`
  )
  .join("\n")}

---

## Next Steps

1. Review \`Sprint-Plan.md\` for execution order
2. Review \`Refactor-Plan.md\` for workstream details
3. Review \`Audit-Issues.json\` for machine-readable data
4. Assign Sprint 1 issues to team
5. Schedule remediation work

---

*Generated by VDD Audit Engine*
`;
}

/**
 * Generate Refactor-Plan.md — the workstream-based remediation plan.
 */
function generateRefactorPlanMarkdown(report: AuditReport): string {
  const { workstreams, metadata } = report;
  const totalEffort = report.issues.reduce((s, i) => s + i.estimatedEffortHours, 0);

  return `# Refactor & Remediation Plan

**Generated:** ${metadata.timestamp}
**Repository:** ${metadata.repositoryPath}
**Estimated Total Effort:** ${totalEffort}-${Math.ceil(totalEffort * 1.3)} hours

---

${workstreams
  .map(
    (ws, idx) => `## Workstream ${idx + 1}: ${ws.name}

**Priority:** ${ws.priority.toUpperCase()}
**Effort:** ${ws.effort}
${ws.dependsOn.length > 0 ? `**Depends On:** ${ws.dependsOn.join(", ")}` : "**Depends On:** Nothing — can start immediately"}

### Issues in This Workstream

${ws.issues.map((i) => `- **${i.id}: ${i.title}** — ${i.severity} — ${i.estimatedEffortHours}h`).join("\n")}

### Why This Matters

${ws.whyItMatters}

### Success Criteria

${ws.successCriteria.map((c) => `- ✅ ${c}`).join("\n")}

---
`
  )
  .join("\n")}

## Implementation Order

${workstreams
  .map((ws, idx) => {
    const order =
      ws.dependsOn.length === 0
        ? "Start first (no dependencies)"
        : `Start after ${ws.dependsOn.join(", ")}`;
    return `${idx + 1}. **${ws.name}** — ${order}`;
  })
  .join("\n")}

---

*Generated by VDD Audit Engine*
`;
}

/**
 * Generate Sprint-Plan.md — the execution roadmap.
 */
function generateSprintPlanMarkdown(report: AuditReport): string {
  const { sprints, metadata } = report;
  const totalEffort = report.issues.reduce((s, i) => s + i.estimatedEffortHours, 0);

  const riskEmoji: Record<Severity, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  return `# Sprint-Based Execution Plan

**Generated:** ${metadata.timestamp}
**Total Capacity:** ${totalEffort}-${Math.ceil(totalEffort * 1.3)} engineer-hours
**Recommended Pace:** 1 sprint per week

---

${sprints
  .map(
    (sprint) => `## Sprint ${sprint.sprint}: ${sprint.name}

**Duration:** ${sprint.duration}
**Priority:** ${riskEmoji[sprint.priority]} ${sprint.priority.toUpperCase()}
**Goal:** ${sprint.goal}

### Issues (${sprint.issues.length})

| Issue | Title | Severity | Effort | Category |
|-------|-------|----------|--------|----------|
${sprint.issues.map((i) => `| ${i.id} | ${i.title} | ${riskEmoji[i.severity]} ${i.severity} | ${i.estimatedEffortHours}h | ${i.category} |`).join("\n")}

### Success Criteria

${sprint.successCriteria.map((c) => `- ✅ ${c}`).join("\n")}

---
`
  )
  .join("\n")}

## Cross-Sprint Dependencies

\`\`\`
${sprints
  .map(
    (s, idx) =>
      `Sprint ${s.sprint}: ${s.name}${idx < sprints.length - 1 ? `\n    ↓ (unblocks)\n` : ""}`
  )
  .join("")}
\`\`\`

## Effort Summary

| Sprint | Issues | Estimated Effort |
|--------|--------|------------------|
${sprints.map((s) => `| Sprint ${s.sprint} | ${s.issues.length} | ~${s.issues.reduce((sum, i) => sum + i.estimatedEffortHours, 0)}h |`).join("\n")}
| **Total** | **${report.issues.length}** | **~${totalEffort}h** |

---

*Generated by VDD Audit Engine*
`;
}

/**
 * Generate the executive summary in plain language.
 */
export function generateExecutiveSummary(
  profile: RepositoryProfile,
  issues: AuditIssue[],
  riskLevel: Severity
): string {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;

  const riskDescriptions: Record<Severity, string> = {
    critical: "This codebase has critical issues that should be addressed immediately before adding new features.",
    high: "This codebase has significant issues that will become expensive to fix if ignored. Recommend addressing high-severity items before scaling.",
    medium: "This codebase is generally healthy but has quality gaps that should be planned for. Safe to keep building on with a remediation schedule.",
    low: "This codebase is in good shape with minor improvements needed. Safe to continue development as-is.",
  };

  const frameworkStr = profile.frameworks.length > 0 ? profile.frameworks.join(", ") : "standard tooling";
  const testStr = profile.hasTests ? `uses ${profile.testFramework ?? "testing"}` : "has no test setup";

  let summary = `This is a ${profile.type} project with ${profile.totalFiles} files, built with ${frameworkStr}. The project ${testStr}.`;

  if (criticalCount > 0) {
    summary += ` There are ${criticalCount} critical issue(s) that require immediate attention.`;
  }

  if (highCount > 0) {
    summary += ` ${highCount} high-severity issue(s) were found that will cause problems if not addressed soon.`;
  }

  summary += `\n\n${riskDescriptions[riskLevel]}`;

  if (issues.length === 0) {
    summary = `This ${profile.type} project with ${profile.totalFiles} files looks healthy. No significant issues were detected. The codebase is safe to continue building on.`;
  }

  return summary;
}
