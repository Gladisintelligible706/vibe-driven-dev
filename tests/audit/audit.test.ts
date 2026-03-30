import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveRulesDir,
  loadRulesIndex,
  selectRulePaths,
  loadRuleFiles,
} from "../../core/audit/rule-loader.js";
import { profileRepository } from "../../core/audit/repository-profiler.js";
import { generateIssues } from "../../core/audit/issue-generator.js";
import { groupIntoWorkstreams, planSprints } from "../../core/audit/sprint-planner.js";
import {
  generateExecutiveSummary,
  getAuditOutputDir,
} from "../../core/audit/report-writer.js";
import type {
  RulesIndex,
  RepositoryProfile,
  AuditIssue,
  LoadedRuleFile,
  Severity,
  AuditFocus,
} from "../../core/audit/types.js";
import type { ViolationFinding } from "../../core/audit/codebase-auditor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<RepositoryProfile> = {}): RepositoryProfile {
  return {
    type: "fullstack",
    languages: { typescript: 50, javascript: 10 },
    frameworks: ["React"],
    hasTests: true,
    hasAuth: false,
    hasAI: false,
    hasEvents: false,
    hasTracking: false,
    isMonorepo: false,
    totalFiles: 100,
    totalLOC: 4000,
    packageManager: "npm",
    testFramework: "vitest",
    ciConfig: "github-actions",
    hasDesignSystem: false,
    hasTypescript: true,
    dependencyCount: 25,
    ...overrides,
  };
}

function makeFinding(overrides: Partial<ViolationFinding> = {}): ViolationFinding {
  return {
    ruleId: "TEST-01",
    ruleName: "Missing Test Coverage",
    ruleSource: "quality/testing.rules.json",
    category: "testing",
    evidence: [{ file: "src/foo.ts", pattern: "No test file found" }],
    affectedFiles: ["src/foo.ts"],
    ...overrides,
  };
}

// ── 1. Rule Loading ──────────────────────────────────────────────────────────

describe("Rule Loading", () => {
  let rulesDir: string;
  let index: RulesIndex;

  beforeAll(async () => {
    rulesDir = await resolveRulesDir(REPO_ROOT);
    index = await loadRulesIndex(rulesDir);
  });

  describe("resolveRulesDir", () => {
    it("resolves the rules directory from the repo root", () => {
      expect(rulesDir).toBeTruthy();
      expect(rulesDir).toContain("rules");
    });

    it("points to a directory containing RULES_INDEX.json", async () => {
      const fs = await import("fs-extra");
      const exists = await fs.pathExists(path.join(rulesDir, "RULES_INDEX.json"));
      expect(exists).toBe(true);
    });
  });

  describe("loadRulesIndex", () => {
    it("returns a valid RulesIndex with ruleLoadOrder", () => {
      expect(index.ruleLoadOrder).toBeDefined();
      expect(Array.isArray(index.ruleLoadOrder)).toBe(true);
      expect(index.ruleLoadOrder.length).toBeGreaterThan(0);
    });

    it("has ruleCategories", () => {
      expect(index.ruleCategories).toBeDefined();
      expect(Object.keys(index.ruleCategories).length).toBeGreaterThan(0);
    });

    it("has a priorityMatrix", () => {
      expect(index.priorityMatrix).toBeDefined();
      expect(index.priorityMatrix).toHaveProperty("P0_BLOCKING");
    });

    it("ruleLoadOrder entries are valid file paths (non-empty strings)", () => {
      for (const entry of index.ruleLoadOrder) {
        expect(typeof entry).toBe("string");
        expect(entry.length).toBeGreaterThan(0);
        expect(entry).toContain("/");
      }
    });

    it("throws on non-existent path", async () => {
      await expect(loadRulesIndex("/nonexistent/path")).rejects.toThrow();
    });
  });

  describe("selectRulePaths", () => {
    it("always includes core rules for any profile", () => {
      const profile = makeProfile({ type: "backend", hasTypescript: false });
      const paths = selectRulePaths(index, profile);

      expect(paths).toContain("core/master-rules.json");
      expect(paths).toContain("quality/testing.rules.json");
      expect(paths).toContain("quality/error-handling.rules.json");
    });

    it("includes accessibility rules for frontend projects", () => {
      const profile = makeProfile({ type: "frontend" });
      const paths = selectRulePaths(index, profile);

      expect(paths).toContain("quality/accessibility.rules.json");
      expect(paths).toContain("architecture/component-modularity.rules.json");
    });

    it("includes accessibility rules for fullstack projects", () => {
      const profile = makeProfile({ type: "fullstack" });
      const paths = selectRulePaths(index, profile);

      expect(paths).toContain("quality/accessibility.rules.json");
    });

    it("includes type-system rules when project has TypeScript and the rule is in ruleLoadOrder", () => {
      const profile = makeProfile({ hasTypescript: true });
      const paths = selectRulePaths(index, profile);

      // core/type-system.rules.json is added to selected set but only appears in output
      // if it is also in the index's ruleLoadOrder. Verify the set filtering works correctly.
      const hasTypeSystem = index.ruleLoadOrder.includes("core/type-system.rules.json");
      if (hasTypeSystem) {
        expect(paths).toContain("core/type-system.rules.json");
      }
      // Regardless, TypeScript profile should not reduce the rule count vs a non-TS profile
      const nonTsProfile = makeProfile({ type: "backend", hasTypescript: false });
      const nonTsPaths = selectRulePaths(index, nonTsProfile);
      expect(paths.length).toBeGreaterThanOrEqual(nonTsPaths.length);
    });

    it("filters by focus area: architecture", () => {
      const profile = makeProfile();
      const paths = selectRulePaths(index, profile, "architecture" as AuditFocus);

      for (const p of paths) {
        const lower = p.toLowerCase();
        const isArchitectureRelated =
          lower.includes("architecture") ||
          lower.includes("dependency") ||
          lower.includes("circular") ||
          lower.includes("component") ||
          lower.includes("master") ||
          lower.includes("error-handling");
        expect(isArchitectureRelated).toBe(true);
      }
    });

    it("filters by focus area: security", () => {
      const profile = makeProfile({ hasAuth: true });
      const paths = selectRulePaths(index, profile, "security" as AuditFocus);

      for (const p of paths) {
        const lower = p.toLowerCase();
        const isSecurityRelated =
          lower.includes("security") ||
          lower.includes("environment") ||
          lower.includes("master") ||
          lower.includes("error-handling");
        expect(isSecurityRelated).toBe(true);
      }
    });

    it("filters by focus area: testing", () => {
      const profile = makeProfile();
      const paths = selectRulePaths(index, profile, "testing" as AuditFocus);

      expect(paths).toContain("quality/testing.rules.json");
    });

    it("returns paths in the same order as ruleLoadOrder", () => {
      const profile = makeProfile({ type: "frontend" });
      const paths = selectRulePaths(index, profile);

      for (let i = 1; i < paths.length; i++) {
        const prevIdx = index.ruleLoadOrder.indexOf(paths[i - 1]!);
        const currIdx = index.ruleLoadOrder.indexOf(paths[i]!);
        expect(prevIdx).toBeLessThan(currIdx);
      }
    });
  });

  describe("loadRuleFiles", () => {
    it("loads rule files with valid structure", async () => {
      const profile = makeProfile({ type: "frontend" });
      const loaded = await loadRuleFiles(rulesDir, index, profile);

      expect(loaded.length).toBeGreaterThan(0);

      for (const file of loaded) {
        expect(file.path).toBeTruthy();
        expect(file.category).toBeTruthy();
        expect(file.name).toBeTruthy();
        expect(file.rules).toBeDefined();
        expect(typeof file.loadOrder).toBe("number");
        expect(file.selectedBecause).toBeTruthy();
      }
    });

    it("each loaded rule has required fields", async () => {
      const profile = makeProfile();
      const loaded = await loadRuleFiles(rulesDir, index, profile);

      for (const file of loaded) {
        for (const rule of file.rules) {
          expect(rule.ruleId).toBeTruthy();
          expect(rule.name).toBeTruthy();
          expect(rule.severity).toBeTruthy();
          expect(["critical", "high", "medium", "low"]).toContain(rule.severity);
          expect(rule.category).toBeTruthy();
        }
      }
    });

    it("respects the focus filter", async () => {
      const profile = makeProfile();
      const allLoaded = await loadRuleFiles(rulesDir, index, profile);
      const focusedLoaded = await loadRuleFiles(rulesDir, index, profile, "testing" as AuditFocus);

      expect(focusedLoaded.length).toBeLessThanOrEqual(allLoaded.length);
    });

    it("assigns loadOrder matching the selected paths order", async () => {
      const profile = makeProfile();
      const loaded = await loadRuleFiles(rulesDir, index, profile);

      for (let i = 1; i < loaded.length; i++) {
        expect(loaded[i]!.loadOrder).toBeGreaterThan(loaded[i - 1]!.loadOrder);
      }
    });

    it("provides a selectedBecause reason for every rule file", async () => {
      const profile = makeProfile();
      const loaded = await loadRuleFiles(rulesDir, index, profile);

      for (const file of loaded) {
        expect(file.selectedBecause).toBeTruthy();
        expect(file.selectedBecause.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── 2. Repository Profiling ─────────────────────────────────────────────────

describe("Repository Profiling", () => {
  let profile: RepositoryProfile;

  beforeAll(async () => {
    profile = await profileRepository(REPO_ROOT);
  });

  it("detects the project type", () => {
    expect(["frontend", "backend", "fullstack", "monorepo", "ai-native"]).toContain(profile.type);
  });

  it("detects TypeScript", () => {
    expect(profile.hasTypescript).toBe(true);
  });

  it("counts source files", () => {
    expect(profile.totalFiles).toBeGreaterThan(0);
  });

  it("detects test framework from package.json", () => {
    expect(profile.testFramework).toBe("vitest");
  });

  it("reports hasTests as true when test files exist", () => {
    expect(profile.hasTests).toBe(true);
  });

  it("detects the package manager", () => {
    expect(["npm", "pnpm", "yarn", "bun"]).toContain(profile.packageManager);
  });

  it("counts dependency count greater than zero", () => {
    expect(profile.dependencyCount).toBeGreaterThan(0);
  });

  it("populates languages object", () => {
    expect(typeof profile.languages).toBe("object");
  });

  it("returns a valid RepositoryProfile with all required fields", () => {
    expect(profile).toHaveProperty("type");
    expect(profile).toHaveProperty("languages");
    expect(profile).toHaveProperty("frameworks");
    expect(profile).toHaveProperty("hasTests");
    expect(profile).toHaveProperty("hasAuth");
    expect(profile).toHaveProperty("hasAI");
    expect(profile).toHaveProperty("hasEvents");
    expect(profile).toHaveProperty("hasTracking");
    expect(profile).toHaveProperty("isMonorepo");
    expect(profile).toHaveProperty("totalFiles");
    expect(profile).toHaveProperty("totalLOC");
    expect(profile).toHaveProperty("packageManager");
    expect(profile).toHaveProperty("testFramework");
    expect(profile).toHaveProperty("hasDesignSystem");
    expect(profile).toHaveProperty("hasTypescript");
    expect(profile).toHaveProperty("dependencyCount");
  });
});

// ── 3. Issue Generation ─────────────────────────────────────────────────────

describe("Issue Generation", () => {
  const profile = makeProfile();

  const mockLoadedRules: LoadedRuleFile[] = [
    {
      path: "quality/testing.rules.json",
      category: "quality",
      name: "Testing Standards",
      description: "",
      rules: [],
      raw: {},
      loadOrder: 0,
      selectedBecause: "Always applied — core standard",
    },
  ];

  it("converts findings to AuditIssues with required fields", () => {
    const findings: ViolationFinding[] = [
      makeFinding({ ruleId: "TEST-01", category: "testing" }),
    ];

    const issues = generateIssues(findings, profile, mockLoadedRules);

    expect(issues.length).toBe(1);
    const issue = issues[0]!;
    expect(issue.id).toMatch(/^AUD-/);
    expect(issue.title).toBe("Missing Test Coverage");
    expect(issue.severity).toBeTruthy();
    expect(issue.category).toBe("testing");
    expect(issue.ruleId).toBe("TEST-01");
    expect(issue.whyItMatters).toBeTruthy();
    expect(issue.evidence.length).toBeGreaterThan(0);
    expect(issue.affectedFiles).toEqual(["src/foo.ts"]);
    expect(issue.suggestedRemediation).toBeTruthy();
    expect(issue.estimatedEffortHours).toBeGreaterThan(0);
    expect(issue.sprintAssignment).toBeGreaterThanOrEqual(1);
    expect(issue.sprintAssignment).toBeLessThanOrEqual(3);
    expect(issue.workstream).toBeTruthy();
  });

  it("assigns critical severity for circular dependency findings", () => {
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "CDEP-01",
        ruleName: "Circular Dependency Detected",
        category: "architecture",
        ruleSource: "architecture/circular-dependency.rules.json",
      }),
    ];

    const issues = generateIssues(findings, profile, mockLoadedRules);

    expect(issues[0]!.severity).toBe("critical");
    expect(issues[0]!.workstream).toBe("Architecture Cleanup");
  });

  it("escalates security to critical when profile has auth", () => {
    const authProfile = makeProfile({ hasAuth: true });
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "SEC-03",
        ruleName: "Hardcoded Secrets",
        category: "security",
        ruleSource: "quality/security-privacy.rules.json",
      }),
    ];

    const issues = generateIssues(findings, authProfile, mockLoadedRules);

    expect(issues[0]!.severity).toBe("critical");
  });

  it("assigns high severity for security findings without auth", () => {
    const noAuthProfile = makeProfile({ hasAuth: false });
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "SEC-03",
        ruleName: "Hardcoded Secrets",
        category: "security",
        ruleSource: "quality/security-privacy.rules.json",
      }),
    ];

    const issues = generateIssues(findings, noAuthProfile, mockLoadedRules);

    expect(issues[0]!.severity).toBe("high");
  });

  it("sorts issues by severity (critical first)", () => {
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "A11Y-01",
        ruleName: "Missing Alt Text",
        category: "accessibility",
        ruleSource: "quality/accessibility.rules.json",
      }),
      makeFinding({
        ruleId: "CDEP-01",
        ruleName: "Circular Dep",
        category: "architecture",
        ruleSource: "architecture/circular-dependency.rules.json",
      }),
      makeFinding({
        ruleId: "TEST-01",
        ruleName: "Missing Tests",
        category: "testing",
      }),
    ];

    const issues = generateIssues(findings, profile, mockLoadedRules);

    const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < issues.length; i++) {
      expect(severityOrder[issues[i]!.severity]).toBeGreaterThanOrEqual(
        severityOrder[issues[i - 1]!.severity]
      );
    }
  });

  it("generates unique issue IDs", () => {
    const findings: ViolationFinding[] = [
      makeFinding({ ruleId: "TEST-01" }),
      makeFinding({ ruleId: "TEST-02", ruleName: "Another Test Issue" }),
    ];

    const issues = generateIssues(findings, profile, mockLoadedRules);
    const ids = issues.map((i) => i.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("filters by focus parameter", () => {
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "TEST-01",
        category: "testing",
        ruleSource: "quality/testing.rules.json",
      }),
      makeFinding({
        ruleId: "CDEP-01",
        ruleName: "Circular Dep",
        category: "architecture",
        ruleSource: "architecture/circular-dependency.rules.json",
      }),
    ];

    const allIssues = generateIssues(findings, profile, mockLoadedRules);
    const testingOnly = generateIssues(findings, profile, mockLoadedRules, "testing");

    expect(testingOnly.length).toBeLessThanOrEqual(allIssues.length);
    expect(testingOnly.every((i) => i.category === "testing" || i.ruleSource.includes("testing"))).toBe(true);
  });

  it("handles empty findings array", () => {
    const issues = generateIssues([], profile, mockLoadedRules);

    expect(issues).toEqual([]);
  });

  it("scales effort based on evidence count", () => {
    const smallFinding = makeFinding({ ruleId: "TEST-01" }); // 1 evidence
    const largeFinding = makeFinding({
      ruleId: "TEST-01",
      evidence: Array.from({ length: 10 }, (_, i) => ({
        file: `src/file${i}.ts`,
        pattern: "No test found",
      })),
    });

    const smallIssues = generateIssues([smallFinding], profile, mockLoadedRules);
    const largeIssues = generateIssues([largeFinding], profile, mockLoadedRules);

    expect(largeIssues[0]!.estimatedEffortHours).toBeGreaterThanOrEqual(
      smallIssues[0]!.estimatedEffortHours
    );
  });

  it("assigns sprint 1 to critical and high severity issues", () => {
    const findings: ViolationFinding[] = [
      makeFinding({
        ruleId: "CDEP-01",
        ruleName: "Circular Dep",
        category: "architecture",
        ruleSource: "architecture/circular-dependency.rules.json",
      }),
    ];

    const issues = generateIssues(findings, profile, mockLoadedRules);

    expect(issues[0]!.sprintAssignment).toBe(1);
  });
});

// ── 4. Sprint Planning ──────────────────────────────────────────────────────

describe("Sprint Planning", () => {
  function makeIssue(overrides: Partial<AuditIssue> = {}): AuditIssue {
    return {
      id: "AUD-TEST-001",
      title: "Test Issue",
      severity: "medium",
      category: "testing",
      ruleSource: "quality/testing.rules.json",
      ruleId: "TEST-01",
      whyItMatters: "Tests are important",
      evidence: [{ file: "src/foo.ts", pattern: "missing test" }],
      affectedFiles: ["src/foo.ts"],
      suggestedRemediation: "Add tests",
      estimatedEffortHours: 4,
      sprintAssignment: 2,
      blocks: [],
      dependsOn: [],
      workstream: "Testing Foundation",
      ...overrides,
    };
  }

  describe("groupIntoWorkstreams", () => {
    it("groups issues by workstream name", () => {
      const issues: AuditIssue[] = [
        makeIssue({ id: "I-1", workstream: "Architecture Cleanup", severity: "critical" }),
        makeIssue({ id: "I-2", workstream: "Architecture Cleanup", severity: "high" }),
        makeIssue({ id: "I-3", workstream: "Testing Foundation", severity: "medium" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      expect(workstreams.length).toBe(2);

      const archWs = workstreams.find((w) => w.name === "Architecture Cleanup");
      const testWs = workstreams.find((w) => w.name === "Testing Foundation");

      expect(archWs).toBeDefined();
      expect(archWs!.issues.length).toBe(2);
      expect(testWs).toBeDefined();
      expect(testWs!.issues.length).toBe(1);
    });

    it("assigns correct priority per workstream", () => {
      const issues: AuditIssue[] = [
        makeIssue({ workstream: "Architecture Cleanup" }),
        makeIssue({ workstream: "Security Hardening", severity: "high" }),
        makeIssue({ workstream: "Testing Foundation" }),
        makeIssue({ workstream: "Type Safety", severity: "low" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      const archWs = workstreams.find((w) => w.name === "Architecture Cleanup");
      const secWs = workstreams.find((w) => w.name === "Security Hardening");
      const testWs = workstreams.find((w) => w.name === "Testing Foundation");
      const typeWs = workstreams.find((w) => w.name === "Type Safety");

      expect(archWs!.priority).toBe("critical");
      expect(secWs!.priority).toBe("critical");
      expect(testWs!.priority).toBe("high");
      expect(typeWs!.priority).toBe("medium");
    });

    it("calculates total effort per workstream", () => {
      const issues: AuditIssue[] = [
        makeIssue({ workstream: "Testing Foundation", estimatedEffortHours: 4 }),
        makeIssue({ workstream: "Testing Foundation", estimatedEffortHours: 6 }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      const testWs = workstreams.find((w) => w.name === "Testing Foundation");
      expect(testWs!.effort).toContain("10");
    });

    it("provides whyItMatters and successCriteria for each workstream", () => {
      const issues: AuditIssue[] = [
        makeIssue({ workstream: "Architecture Cleanup" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      for (const ws of workstreams) {
        expect(ws.whyItMatters).toBeTruthy();
        expect(ws.successCriteria.length).toBeGreaterThan(0);
      }
    });

    it("sets Architecture Cleanup as having no dependencies", () => {
      const issues: AuditIssue[] = [
        makeIssue({ workstream: "Architecture Cleanup" }),
        makeIssue({ workstream: "Testing Foundation" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      const archWs = workstreams.find((w) => w.name === "Architecture Cleanup");
      expect(archWs!.dependsOn).toEqual([]);

      const testWs = workstreams.find((w) => w.name === "Testing Foundation");
      expect(testWs!.dependsOn).toContain("Architecture Cleanup");
    });

    it("orders Architecture Cleanup first", () => {
      const issues: AuditIssue[] = [
        makeIssue({ workstream: "Testing Foundation" }),
        makeIssue({ workstream: "Architecture Cleanup" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);

      expect(workstreams[0]!.name).toBe("Architecture Cleanup");
    });

    it("handles empty issues array", () => {
      const workstreams = groupIntoWorkstreams([]);
      expect(workstreams).toEqual([]);
    });
  });

  describe("planSprints", () => {
    it("creates three sprints", () => {
      const issues: AuditIssue[] = [
        makeIssue({ severity: "critical", workstream: "Architecture Cleanup" }),
        makeIssue({ severity: "medium", workstream: "Testing Foundation" }),
        makeIssue({ severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      expect(sprints.length).toBe(3);
      expect(sprints[0]!.sprint).toBe(1);
      expect(sprints[1]!.sprint).toBe(2);
      expect(sprints[2]!.sprint).toBe(3);
    });

    it("puts critical issues in sprint 1", () => {
      const issues: AuditIssue[] = [
        makeIssue({ id: "I-1", severity: "critical", workstream: "Architecture Cleanup" }),
        makeIssue({ id: "I-2", severity: "medium", workstream: "Testing Foundation" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      const sprint1Ids = sprints[0]!.issues.map((i) => i.id);
      expect(sprint1Ids).toContain("I-1");
    });

    it("puts high severity issues in sprint 1", () => {
      const issues: AuditIssue[] = [
        makeIssue({ id: "I-1", severity: "high", workstream: "Security Hardening" }),
        makeIssue({ id: "I-2", severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      const sprint1Ids = sprints[0]!.issues.map((i) => i.id);
      expect(sprint1Ids).toContain("I-1");
    });

    it("puts Architecture Cleanup and Security Hardening in sprint 1", () => {
      const issues: AuditIssue[] = [
        makeIssue({ id: "I-1", severity: "medium", workstream: "Architecture Cleanup" }),
        makeIssue({ id: "I-2", severity: "medium", workstream: "Security Hardening" }),
        makeIssue({ id: "I-3", severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      const sprint1Ids = sprints[0]!.issues.map((i) => i.id);
      expect(sprint1Ids).toContain("I-1");
      expect(sprint1Ids).toContain("I-2");
    });

    it("assigns correct sprint names", () => {
      const issues: AuditIssue[] = [
        makeIssue({ severity: "critical", workstream: "Architecture Cleanup" }),
        makeIssue({ severity: "medium", workstream: "Testing Foundation" }),
        makeIssue({ severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      expect(sprints[0]!.name).toBe("Foundation & Critical Fixes");
      expect(sprints[1]!.name).toBe("Quality & Architecture");
      expect(sprints[2]!.name).toBe("Polish & Optimization");
    });

    it("includes success criteria for each sprint", () => {
      const issues: AuditIssue[] = [
        makeIssue({ severity: "critical", workstream: "Architecture Cleanup" }),
        makeIssue({ severity: "medium", workstream: "Testing Foundation" }),
        makeIssue({ severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      for (const sprint of sprints) {
        expect(sprint.successCriteria.length).toBeGreaterThan(0);
      }
    });

    it("includes duration for each sprint", () => {
      const issues: AuditIssue[] = [
        makeIssue({ severity: "critical", workstream: "Architecture Cleanup" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      for (const sprint of sprints) {
        expect(sprint.duration).toBeTruthy();
      }
    });

    it("no issue appears in multiple sprints", () => {
      const issues: AuditIssue[] = [
        makeIssue({ id: "I-1", severity: "critical", workstream: "Architecture Cleanup" }),
        makeIssue({ id: "I-2", severity: "medium", workstream: "Testing Foundation" }),
        makeIssue({ id: "I-3", severity: "low", workstream: "Type Safety" }),
      ];

      const workstreams = groupIntoWorkstreams(issues);
      const sprints = planSprints(issues, workstreams);

      const allIds = sprints.flatMap((s) => s.issues.map((i) => i.id));
      const uniqueIds = new Set(allIds);

      expect(uniqueIds.size).toBe(allIds.length);
    });
  });
});

// ── 5. Report Writing ───────────────────────────────────────────────────────

describe("Report Writing", () => {
  const profile = makeProfile();

  describe("generateExecutiveSummary", () => {
    it("generates a summary mentioning project type and files", () => {
      const summary = generateExecutiveSummary(profile, [], "low");

      expect(summary).toContain("fullstack");
      expect(summary).toContain("100");
    });

    it("mentions testing framework when hasTests is true", () => {
      const issues = [makeFinding({ ruleId: "TEST-01" })].map((f) => ({
        id: "AUD-TEST-001",
        title: f.ruleName,
        severity: "medium" as const,
        category: f.category,
        ruleSource: f.ruleSource,
        ruleId: f.ruleId,
        whyItMatters: "",
        evidence: f.evidence,
        affectedFiles: f.affectedFiles,
        suggestedRemediation: "",
        estimatedEffortHours: 4,
        sprintAssignment: 2,
        blocks: [],
        dependsOn: [],
        workstream: "Testing Foundation",
      }));
      const summary = generateExecutiveSummary(profile, issues, "low");

      expect(summary).toContain("vitest");
    });

    it("reports no test setup when hasTests is false", () => {
      const noTestsProfile = makeProfile({ hasTests: false, testFramework: null });
      const issues = [makeFinding({ ruleId: "TEST-01" })].map((f) => ({
        id: "AUD-TEST-001",
        title: f.ruleName,
        severity: "medium" as const,
        category: f.category,
        ruleSource: f.ruleSource,
        ruleId: f.ruleId,
        whyItMatters: "",
        evidence: f.evidence,
        affectedFiles: f.affectedFiles,
        suggestedRemediation: "",
        estimatedEffortHours: 4,
        sprintAssignment: 2,
        blocks: [],
        dependsOn: [],
        workstream: "Testing Foundation",
      }));
      const summary = generateExecutiveSummary(noTestsProfile, issues, "low");

      expect(summary).toContain("no test setup");
    });

    it("mentions critical issues in the summary", () => {
      const issues: AuditIssue[] = [
        {
          id: "I-1",
          title: "Critical Issue",
          severity: "critical",
          category: "architecture",
          ruleSource: "test",
          ruleId: "CDEP-01",
          whyItMatters: "Bad",
          evidence: [],
          affectedFiles: [],
          suggestedRemediation: "Fix",
          estimatedEffortHours: 4,
          sprintAssignment: 1,
          blocks: [],
          dependsOn: [],
          workstream: "Architecture Cleanup",
        },
      ];

      const summary = generateExecutiveSummary(profile, issues, "critical");

      expect(summary).toContain("critical");
    });

    it("mentions high severity issues in the summary", () => {
      const issues: AuditIssue[] = [
        {
          id: "I-1",
          title: "High Issue",
          severity: "high",
          category: "security",
          ruleSource: "test",
          ruleId: "SEC-03",
          whyItMatters: "Bad",
          evidence: [],
          affectedFiles: [],
          suggestedRemediation: "Fix",
          estimatedEffortHours: 3,
          sprintAssignment: 1,
          blocks: [],
          dependsOn: [],
          workstream: "Security Hardening",
        },
      ];

      const summary = generateExecutiveSummary(profile, issues, "high");

      expect(summary).toContain("high-severity");
    });

    it("generates healthy codebase message for zero issues", () => {
      const summary = generateExecutiveSummary(profile, [], "low");

      expect(summary).toContain("healthy");
      expect(summary).toContain("No significant issues");
    });

    it("includes framework names in the summary", () => {
      const issues: AuditIssue[] = [{
        id: "I-1", title: "Minor", severity: "low", category: "quality",
        ruleSource: "test", ruleId: "TEST-01", whyItMatters: "",
        evidence: [], affectedFiles: [], suggestedRemediation: "",
        estimatedEffortHours: 2, sprintAssignment: 3, blocks: [], dependsOn: [],
        workstream: "Quality Improvements",
      }];
      const summary = generateExecutiveSummary(profile, issues, "low");

      expect(summary).toContain("React");
    });

    it("includes risk level description", () => {
      const issues: AuditIssue[] = [{
        id: "I-1", title: "Minor", severity: "medium", category: "quality",
        ruleSource: "test", ruleId: "TEST-01", whyItMatters: "",
        evidence: [], affectedFiles: [], suggestedRemediation: "",
        estimatedEffortHours: 2, sprintAssignment: 2, blocks: [], dependsOn: [],
        workstream: "Quality Improvements",
      }];
      const summary = generateExecutiveSummary(profile, issues, "medium");

      expect(summary).toContain("generally healthy");
    });

    it("handles high risk level", () => {
      const issues: AuditIssue[] = [{
        id: "I-1", title: "High Issue", severity: "high", category: "security",
        ruleSource: "test", ruleId: "SEC-03", whyItMatters: "",
        evidence: [], affectedFiles: [], suggestedRemediation: "",
        estimatedEffortHours: 3, sprintAssignment: 1, blocks: [], dependsOn: [],
        workstream: "Security Hardening",
      }];
      const summary = generateExecutiveSummary(profile, issues, "high");

      expect(summary).toContain("significant issues");
    });

    it("handles critical risk level", () => {
      const issues: AuditIssue[] = [{
        id: "I-1", title: "Critical Issue", severity: "critical", category: "architecture",
        ruleSource: "test", ruleId: "CDEP-01", whyItMatters: "",
        evidence: [], affectedFiles: [], suggestedRemediation: "",
        estimatedEffortHours: 4, sprintAssignment: 1, blocks: [], dependsOn: [],
        workstream: "Architecture Cleanup",
      }];
      const summary = generateExecutiveSummary(profile, issues, "critical");

      expect(summary).toContain("critical");
    });
  });

  describe("getAuditOutputDir", () => {
    it("returns a path under audit-artifacts/", () => {
      const outputDir = getAuditOutputDir("/my/repo");

      expect(outputDir).toContain("audit-artifacts");
      expect(outputDir).toContain("/my/repo");
    });

    it("includes a timestamp-like segment", () => {
      const outputDir = getAuditOutputDir("/my/repo");
      const basename = path.basename(outputDir);

      // ISO timestamp with colons/dots replaced, e.g. 2026-03-30T14-00-00
      expect(basename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    it("produces unique dirs on consecutive calls", async () => {
      const dir1 = getAuditOutputDir("/my/repo");
      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 1100));
      const dir2 = getAuditOutputDir("/my/repo");

      expect(dir1).not.toBe(dir2);
    });
  });
});
