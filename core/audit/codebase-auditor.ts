/**
 * Codebase Auditor — scans the codebase against loaded rules and detects violations.
 *
 * Responsibilities:
 * - For each rule pack, extract detection patterns
 * - Scan actual source files for violations
 * - Produce raw violation findings with evidence
 */

import fs from "fs-extra";
import path from "node:path";
import type {
  LoadedRuleFile,
  AuditEvidence,
  RepositoryProfile,
} from "./types.js";

export interface ViolationFinding {
  ruleId: string;
  ruleName: string;
  ruleSource: string;
  category: string;
  evidence: AuditEvidence[];
  affectedFiles: string[];
}

const IGNORE_DIRS = new Set([
  "node_modules", "dist", "build", ".git", ".vdd", "Bin",
  "coverage", ".next", ".nuxt",
]);

/**
 * Collect source files matching given extensions.
 */
async function collectSourceFiles(
  repoPath: string,
  extensions: string[] = [".ts", ".tsx", ".js", ".jsx"],
  maxFiles: number = 500
): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string, depth: number) {
    if (depth > 8 || files.length >= maxFiles) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith(".")) continue;
        await walk(fullPath, depth + 1);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(repoPath, 0);
  return files;
}

/**
 * Read file content safely.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Detect circular imports by building a dependency graph and finding cycles.
 */
async function detectCircularImports(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];
  const importGraph = new Map<string, string[]>();
  const fileContents = new Map<string, string>();

  // Build import graph
  for (const file of sourceFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;
    fileContents.set(file, content);

    const relativeFile = path.relative(repoPath, file);
    const imports: string[] = [];

    // Match import statements
    const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

    for (const regex of [importRegex, dynamicImportRegex, requireRegex]) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && (importPath.startsWith("./") || importPath.startsWith("../"))) {
          imports.push(importPath);
        }
      }
    }

    importGraph.set(relativeFile, imports);
  }

  // Find cycles using DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, visitPath: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = visitPath.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push(visitPath.slice(cycleStart));
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);

    const imports = importGraph.get(node) ?? [];
    const dir = path.dirname(node);

    for (const imp of imports) {
      // Resolve relative import to file path
      let resolved = pathLibNormalize(dir, imp);
      // Try with extensions
      for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]) {
        const candidate = resolved + ext;
        if (importGraph.has(candidate)) {
          dfs(candidate, [...visitPath, node]);
          break;
        }
      }
    }

    inStack.delete(node);
  }

  for (const file of importGraph.keys()) {
    if (!visited.has(file)) {
      dfs(file, []);
    }
  }

  // Deduplicate cycles (A->B->A is same as B->A->B)
  const seen = new Set<string>();
  for (const cycle of cycles) {
    const key = [...cycle].sort().join("->");
    if (seen.has(key)) continue;
    seen.add(key);

    const evidence: AuditEvidence[] = [];
    for (let i = 0; i < cycle.length; i++) {
      const next = cycle[(i + 1) % cycle.length]!;
      evidence.push({
        file: cycle[i]!,
        pattern: `imports from ${next}`,
      });
    }
    evidence.push({
      file: "graph",
      pattern: `Cycle: ${cycle.join(" → ")} → ${cycle[0]}`,
    });

    findings.push({
      ruleId: "CDEP-01",
      ruleName: "Circular Dependency Detected",
      ruleSource: "architecture/circular-dependency.rules.json",
      category: "architecture",
      evidence,
      affectedFiles: [...cycle],
    });
  }

  return findings;
}

function pathLibNormalize(dir: string, relative: string): string {
  const parts = dir.split("/").filter(Boolean);
  const relParts = relative.split("/").filter(Boolean);

  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }

  return parts.join("/");
}

/**
 * Detect large components (size violations).
 */
async function detectLargeComponents(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];
  const threshold = 250;

  for (const file of sourceFiles) {
    const content = await readFileSafe(file);
    if (!content) continue;

    // Only check component files
    const basename = path.basename(file);
    if (!basename.endsWith(".tsx") && !basename.endsWith(".jsx")) continue;
    // Skip test files
    if (/\.(test|spec)\./.test(basename)) continue;

    const lines = content.split("\n").length;

    if (lines > threshold) {
      const relative = path.relative(repoPath, file);
      findings.push({
        ruleId: "MOD-01",
        ruleName: "Component Size Violation",
        ruleSource: "architecture/component-modularity.rules.json",
        category: "architecture",
        evidence: [
          { file: relative, pattern: `${lines} lines (target: <${threshold})` },
        ],
        affectedFiles: [relative],
      });
    }
  }

  return findings;
}

/**
 * Detect missing test files.
 */
async function detectMissingTests(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];
  const testableFiles: string[] = [];

  for (const file of sourceFiles) {
    const ext = path.extname(file).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;
    const basename = path.basename(file);
    if (/\.(test|spec)\./.test(basename)) continue;
    if (basename.startsWith("index.")) continue;
    if (basename.endsWith(".d.ts")) continue;
    if (file.includes("/types/")) continue;
    if (file.includes("/constants/")) continue;

    testableFiles.push(file);
  }

  const filesWithoutTests: string[] = [];

  for (const file of testableFiles) {
    const dir = path.dirname(file);
    const basename = path.basename(file, path.extname(file));

    const testCandidates = [
      path.join(dir, `${basename}.test${path.extname(file)}`),
      path.join(dir, `${basename}.spec${path.extname(file)}`),
      path.join(dir, "__tests__", `${basename}.test${path.extname(file)}`),
      path.join(dir, "__tests__", `${basename}.spec${path.extname(file)}`),
    ];

    let hasTest = false;
    for (const candidate of testCandidates) {
      if (await fs.pathExists(candidate)) {
        hasTest = true;
        break;
      }
    }

    if (!hasTest) {
      filesWithoutTests.push(path.relative(repoPath, file));
    }
  }

  if (filesWithoutTests.length > 0) {
    const sample = filesWithoutTests.slice(0, 10);
    findings.push({
      ruleId: "TEST-01",
      ruleName: "Missing Test Coverage",
      ruleSource: "quality/testing.rules.json",
      category: "testing",
      evidence: [
        {
          file: "(multiple)",
          pattern: `${filesWithoutTests.length} source files without corresponding test files`,
        },
        ...sample.map((f) => ({ file: f, pattern: "No test file found" })),
      ],
      affectedFiles: sample,
    });
  }

  return findings;
}

/**
 * Detect security issues: hardcoded secrets, missing env validation.
 */
async function detectSecurityIssues(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];

  const secretPatterns = [
    { regex: /sk-[a-zA-Z0-9]{24,}/, name: "OpenAI API Key" },
    { regex: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key" },
    { regex: /ghp_[a-zA-Z0-9]{36}/, name: "GitHub PAT" },
    { regex: /mongodb\+srv:\/\/[^"'\s]+/, name: "MongoDB Connection String" },
    {
      regex: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"']{8,}["']/i,
      name: "Hardcoded Secret",
    },
  ];

  const affectedFiles: string[] = [];
  const evidence: AuditEvidence[] = [];

  for (const file of sourceFiles.slice(0, 150)) {
    const content = await readFileSafe(file);
    if (!content) continue;

    const relative = path.relative(repoPath, file);

    for (const { regex, name } of secretPatterns) {
      if (regex.test(content)) {
        affectedFiles.push(relative);
        evidence.push({ file: relative, pattern: `Potential ${name} detected` });
        break;
      }
    }
  }

  if (affectedFiles.length > 0) {
    findings.push({
      ruleId: "SEC-03",
      ruleName: "Hardcoded Secrets Detected",
      ruleSource: "quality/security-privacy.rules.json",
      category: "security",
      evidence,
      affectedFiles: [...new Set(affectedFiles)],
    });
  }

  // Check for missing .env.example
  if (!(await fs.pathExists(path.join(repoPath, ".env.example"))) &&
      (await fs.pathExists(path.join(repoPath, ".env")))) {
    findings.push({
      ruleId: "ENV-01",
      ruleName: "Missing .env.example",
      ruleSource: "quality/environment-consistency.rules.json",
      category: "security",
      evidence: [
        { file: ".env", pattern: ".env exists but no .env.example for documentation" },
      ],
      affectedFiles: [".env"],
    });
  }

  return findings;
}

/**
 * Detect accessibility issues in frontend files.
 */
async function detectAccessibilityIssues(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];
  const componentFiles = sourceFiles.filter(
    (f) => (f.endsWith(".tsx") || f.endsWith(".jsx")) && !f.includes("node_modules")
  );

  let missingAltCount = 0;
  let missingAriaCount = 0;
  const affectedFiles: string[] = [];
  const evidence: AuditEvidence[] = [];

  for (const file of componentFiles.slice(0, 100)) {
    const content = await readFileSafe(file);
    if (!content) continue;

    const relative = path.relative(repoPath, file);

    // Check for <img without alt
    const imgNoAlt = content.match(/<img(?![^>]*alt=)[^>]*>/g);
    if (imgNoAlt && imgNoAlt.length > 0) {
      missingAltCount += imgNoAlt.length;
      if (!affectedFiles.includes(relative)) affectedFiles.push(relative);
      evidence.push({
        file: relative,
        pattern: `${imgNoAlt.length} <img> tag(s) missing alt attribute`,
      });
    }

    // Check for interactive elements without aria-label
    const buttonsNoAria = content.match(
      /<(button|input|select|textarea)(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>/g
    );
    if (buttonsNoAria && buttonsNoAria.length > 0) {
      missingAriaCount += buttonsNoAria.length;
      if (!affectedFiles.includes(relative)) affectedFiles.push(relative);
      evidence.push({
        file: relative,
        pattern: `${buttonsNoAria.length} interactive element(s) missing ARIA label`,
      });
    }
  }

  if (missingAltCount > 0) {
    findings.push({
      ruleId: "A11Y-01",
      ruleName: "Missing Image Alt Text",
      ruleSource: "quality/accessibility.rules.json",
      category: "accessibility",
      evidence: evidence.filter((e) => e.pattern.includes("alt")),
      affectedFiles,
    });
  }

  if (missingAriaCount > 0) {
    findings.push({
      ruleId: "A11Y-02",
      ruleName: "Missing ARIA Labels",
      ruleSource: "quality/accessibility.rules.json",
      category: "accessibility",
      evidence: evidence.filter((e) => e.pattern.includes("ARIA")),
      affectedFiles,
    });
  }

  return findings;
}

/**
 * Detect error handling issues.
 */
async function detectErrorHandlingIssues(
  repoPath: string,
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];

  // Check for missing ErrorBoundary in React apps
  const componentFiles = sourceFiles.filter(
    (f) => (f.endsWith(".tsx") || f.endsWith(".jsx")) && !f.includes("node_modules")
  );

  let hasErrorBoundary = false;
  for (const file of componentFiles.slice(0, 50)) {
    const content = await readFileSafe(file);
    if (!content) continue;
    if (/ErrorBoundary|componentDidCatch|getDerivedStateFromError/i.test(content)) {
      hasErrorBoundary = true;
      break;
    }
  }

  if (componentFiles.length > 0 && !hasErrorBoundary) {
    findings.push({
      ruleId: "ERR-01",
      ruleName: "Missing Error Boundary",
      ruleSource: "quality/error-handling.rules.json",
      category: "quality",
      evidence: [
        {
          file: "(global scan)",
          pattern: "No ErrorBoundary component found in the codebase",
        },
      ],
      affectedFiles: [],
    });
  }

  // Check for uncaught promise patterns
  let unhandledCount = 0;
  const unhandledFiles: string[] = [];
  for (const file of sourceFiles.slice(0, 100)) {
    const content = await readFileSafe(file);
    if (!content) continue;

    // Look for async functions without try/catch
    const asyncFuncs = content.match(/async\s+(?:function\s+)?(?:\w+\s*)?\([^)]*\)\s*\{/g);
    const tryBlocks = content.match(/try\s*\{/g);

    if (asyncFuncs && asyncFuncs.length > 0) {
      const tryCount = tryBlocks?.length ?? 0;
      if (tryCount < asyncFuncs.length) {
        unhandledCount++;
        unhandledFiles.push(path.relative(repoPath, file));
      }
    }
  }

  if (unhandledCount > 3) {
    findings.push({
      ruleId: "ERR-02",
      ruleName: "Inconsistent Error Handling in Async Functions",
      ruleSource: "quality/error-handling.rules.json",
      category: "quality",
      evidence: [
        {
          file: "(multiple)",
          pattern: `${unhandledCount} file(s) with async functions that may lack try/catch`,
        },
        ...unhandledFiles.slice(0, 5).map((f) => ({
          file: f,
          pattern: "Async function without matching try/catch",
        })),
      ],
      affectedFiles: unhandledFiles.slice(0, 10),
    });
  }

  return findings;
}

/**
 * Detect TypeScript type safety issues.
 */
async function detectTypeSafetyIssues(
  sourceFiles: string[]
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];
  let anyCount = 0;
  const affectedFiles: string[] = [];
  const evidence: AuditEvidence[] = [];

  for (const file of sourceFiles.slice(0, 150)) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;

    const content = await readFileSafe(file);
    if (!content) continue;

    // Count `: any` usages (excluding comments)
    const lines = content.split("\n");
    let fileAnyCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      const matches = line.match(/:\s*any\b/g);
      if (matches) {
        fileAnyCount += matches.length;
      }
    }

    if (fileAnyCount > 0) {
      anyCount += fileAnyCount;
      affectedFiles.push(file);
      evidence.push({
        file,
        pattern: `${fileAnyCount} usage(s) of 'any' type`,
      });
    }
  }

  if (anyCount > 5) {
    findings.push({
      ruleId: "TYPE-01",
      ruleName: "Excessive 'any' Type Usage",
      ruleSource: "core/type-system.rules.json",
      category: "quality",
      evidence: [
        { file: "(multiple)", pattern: `${anyCount} total 'any' type usages found` },
        ...evidence.slice(0, 5),
      ],
      affectedFiles: affectedFiles.slice(0, 10),
    });
  }

  return findings;
}

/**
 * Detect dependency issues.
 */
async function detectDependencyIssues(
  repoPath: string
): Promise<ViolationFinding[]> {
  const findings: ViolationFinding[] = [];

  const pkgPath = path.join(repoPath, "package.json");
  if (!(await fs.pathExists(pkgPath))) return findings;

  try {
    const pkg = await fs.readJSON(pkgPath);
    const deps = (pkg.dependencies as Record<string, string>) ?? {};
    const devDeps = (pkg.devDependencies as Record<string, string>) ?? {};

    // Check for deprecated/unsafe patterns
    const deprecatedPackages = ["request", "node-uuid", "gulp-util", "babel-eslint"];
    const foundDeprecated = Object.keys(deps).filter((d) => deprecatedPackages.includes(d));

    if (foundDeprecated.length > 0) {
      findings.push({
        ruleId: "DEP-01",
        ruleName: "Deprecated Dependencies",
        ruleSource: "architecture/dependency-architecture.rules.json",
        category: "quality",
        evidence: foundDeprecated.map((d) => ({
          file: "package.json",
          pattern: `Deprecated package: ${d}`,
        })),
        affectedFiles: ["package.json"],
      });
    }

    // Check for duplicate deps in both deps and devDeps
    const duplicates = Object.keys(deps).filter((d) => d in devDeps);
    if (duplicates.length > 0) {
      findings.push({
        ruleId: "DEP-02",
        ruleName: "Duplicate Dependencies",
        ruleSource: "architecture/dependency-architecture.rules.json",
        category: "quality",
        evidence: duplicates.map((d) => ({
          file: "package.json",
          pattern: `"${d}" exists in both dependencies and devDependencies`,
        })),
        affectedFiles: ["package.json"],
      });
    }
  } catch {
    // ignore
  }

  return findings;
}

/**
 * Run the full codebase audit against loaded rules.
 */
export async function auditCodebase(
  repoPath: string,
  loadedRules: LoadedRuleFile[],
  profile: RepositoryProfile
): Promise<ViolationFinding[]> {
  const allFindings: ViolationFinding[] = [];

  const sourceFiles = await collectSourceFiles(repoPath);

  // Run all detection modules
  const [circularImports, largeComponents, missingTests, securityIssues, a11yIssues, errorHandling, typeSafety, depIssues] =
    await Promise.all([
      detectCircularImports(repoPath, sourceFiles),
      detectLargeComponents(repoPath, sourceFiles),
      detectMissingTests(repoPath, sourceFiles),
      detectSecurityIssues(repoPath, sourceFiles),
      profile.type === "frontend" || profile.type === "fullstack"
        ? detectAccessibilityIssues(repoPath, sourceFiles)
        : Promise.resolve([]),
      detectErrorHandlingIssues(repoPath, sourceFiles),
      profile.hasTypescript ? detectTypeSafetyIssues(sourceFiles) : Promise.resolve([]),
      detectDependencyIssues(repoPath),
    ]);

  allFindings.push(
    ...circularImports,
    ...largeComponents,
    ...missingTests,
    ...securityIssues,
    ...a11yIssues,
    ...errorHandling,
    ...typeSafety,
    ...depIssues
  );

  return allFindings;
}

// ============================================================
// Audit Orchestrator — ties all modules together
// ============================================================

import { resolveRulesDir, loadRulesIndex, loadRuleFiles } from "./rule-loader.js";
import { profileRepository } from "./repository-profiler.js";
import { generateIssues } from "./issue-generator.js";
import { groupIntoWorkstreams, planSprints } from "./sprint-planner.js";
import {
  getAuditOutputDir,
  writeAuditArtifacts,
  generateExecutiveSummary,
} from "./report-writer.js";
import type {
  AuditOptions,
  AuditReport,
  AuditFocus,
  Severity,
} from "./types.js";

export interface AuditRunResult {
  outputDir: string;
  files: string[];
  report: AuditReport;
}

/**
 * Run the full audit pipeline.
 *
 * This is the main entry point that orchestrates:
 * 1. Repository profiling
 * 2. Rule loading & selection
 * 3. Codebase scanning & issue detection
 * 4. Issue generation with evidence
 * 5. Workstream grouping
 * 6. Sprint planning
 * 7. Report generation (4 output files)
 */
export async function runFullAudit(
  repoPath: string,
  options: AuditOptions = {}
): Promise<AuditRunResult> {
  // Phase 1: Profile repository
  const profile = await profileRepository(repoPath);

  // Phase 2: Load & select rules
  const rulesDir = await resolveRulesDir(repoPath);
  const index = await loadRulesIndex(rulesDir);
  const loadedRules = await loadRuleFiles(rulesDir, index, profile, options.focus);

  // Phase 3: Scan codebase and detect violations
  const findings = await auditCodebase(repoPath, loadedRules, profile);

  // Phase 4: Generate structured issues
  const issues = generateIssues(findings, profile, loadedRules, options.focus);

  // Phase 5: Group into workstreams
  const workstreams = groupIntoWorkstreams(issues);

  // Phase 6: Plan sprints
  const sprints = planSprints(issues, workstreams);

  // Phase 7: Determine risk level
  const riskLevel = determineRiskLevel(issues);

  // Phase 8: Generate executive summary
  const executiveSummary = generateExecutiveSummary(profile, issues, riskLevel);

  // Phase 9: Build report
  const report: AuditReport = {
    metadata: {
      timestamp: new Date().toISOString(),
      repositoryPath: repoPath,
      auditMode: options.mode ?? "full",
      focusArea: options.focus,
      rulesetsApplied: loadedRules.map((r) => r.path),
      totalIssues: issues.length,
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    },
    profile,
    rulesApplied: loadedRules,
    issues,
    workstreams,
    sprints,
    riskLevel,
    executiveSummary,
  };

  // Phase 10: Write artifacts
  const outputDir = getAuditOutputDir(repoPath);
  const files = await writeAuditArtifacts(outputDir, report);

  return { outputDir, files, report };
}

function determineRiskLevel(issues: Array<{ severity: Severity }>): Severity {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "high")) return "high";
  if (issues.some((i) => i.severity === "medium")) return "medium";
  return "low";
}
