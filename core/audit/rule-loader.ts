/**
 * Rule Loader — loads and validates rule packs from the rules/ directory.
 *
 * Responsibilities:
 * - Load RULES_INDEX.json as the central registry
 * - Load individual rule files based on the index
 * - Filter rules by focus area
 * - Validate rule file structure
 */

import fs from "fs-extra";
import path from "node:path";
import type {
  LoadedRuleFile,
  RuleDefinition,
  RulesIndex,
  AuditFocus,
  RepositoryProfile,
  Severity,
} from "./types.js";

/**
 * Locate the rules/ directory by searching upward from the given start path.
 * Falls back to the VDD package's own rules/ if not found in the project.
 */
export async function resolveRulesDir(startPath: string): Promise<string> {
  let current = startPath;

  while (true) {
    const candidate = path.join(current, "rules", "RULES_INDEX.json");
    if (await fs.pathExists(candidate)) {
      return path.join(current, "rules");
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Fallback: VDD package rules (relative to this file's location)
  const fallback = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "..",
    "rules"
  );

  if (await fs.pathExists(path.join(fallback, "RULES_INDEX.json"))) {
    return fallback;
  }

  throw new Error(
    "Could not locate rules/ directory with RULES_INDEX.json. " +
      "Ensure the rules/ directory exists in your project or the VDD package."
  );
}

/**
 * Load the RULES_INDEX.json from the rules directory.
 */
export async function loadRulesIndex(rulesDir: string): Promise<RulesIndex> {
  const indexPath = path.join(rulesDir, "RULES_INDEX.json");

  if (!(await fs.pathExists(indexPath))) {
    throw new Error(`RULES_INDEX.json not found at ${indexPath}`);
  }

  const raw = await fs.readJSON(indexPath);

  if (!raw.ruleLoadOrder || !Array.isArray(raw.ruleLoadOrder)) {
    throw new Error("RULES_INDEX.json is missing or has invalid ruleLoadOrder");
  }

  return raw as RulesIndex;
}

/**
 * Extract rule definitions from a loaded rule file's raw JSON.
 * Handles various rule file formats (rules array, rules by category, etc.).
 */
function extractRules(raw: Record<string, unknown>): RuleDefinition[] {
  const rules: RuleDefinition[] = [];

  function pushRule(obj: Record<string, unknown>, fallbackCategory: string) {
    const rule: RuleDefinition = {
      ruleId: String(obj.ruleId ?? obj.id ?? "UNKNOWN"),
      name: String(obj.name ?? "Unnamed Rule"),
      description: String(obj.description ?? ""),
      severity: normalizeSeverity(String(obj.severity ?? obj.priority ?? "medium")),
      category: String(obj.category ?? fallbackCategory ?? "general"),
    };
    const g = obj.guidelines;
    if (Array.isArray(g)) rule.guidelines = g as string[];
    const s = obj.solutions;
    if (Array.isArray(s)) rule.solutions = s as string[];
    const f = obj.forbidden;
    if (Array.isArray(f)) rule.forbidden = f as string[];
    rules.push(rule);
  }

  // Format 1: Top-level "rules" array
  if (Array.isArray(raw.rules)) {
    for (const r of raw.rules) {
      if (typeof r === "object" && r !== null) {
        pushRule(r as Record<string, unknown>, "general");
      }
    }
  }

  // Format 2: Nested rules by category (e.g., master-rules.json)
  if (raw.rules && typeof raw.rules === "object" && !Array.isArray(raw.rules)) {
    const categories = raw.rules as Record<string, unknown>;
    for (const [catName, catValue] of Object.entries(categories)) {
      if (typeof catValue === "object" && catValue !== null) {
        const cat = catValue as Record<string, unknown>;
        if (Array.isArray(cat.rules)) {
          for (const r of cat.rules) {
            if (typeof r === "object" && r !== null) {
              pushRule(r as Record<string, unknown>, catName);
            }
          }
        }
      }
    }
  }

  return rules;
}

function normalizeSeverity(input: string): Severity {
  const lower = input.toLowerCase();
  if (lower === "blocking" || lower === "critical" || lower === "p0") return "critical";
  if (lower === "high" || lower === "p1") return "high";
  if (lower === "medium" || lower === "p2") return "medium";
  return "low";
}

/**
 * Determine the "selectedBecause" reason for a rule file based on the profile.
 */
function getSelectionReason(
  rulePath: string,
  _profile: RepositoryProfile,
  alwaysApplied: Set<string>
): string {
  if (alwaysApplied.has(rulePath)) {
    return "Always applied — core standard";
  }
  if (rulePath.includes("accessibility") || rulePath.includes("ui-ux")) {
    return "Frontend project detected";
  }
  if (rulePath.includes("api-consistency") || rulePath.includes("environment")) {
    return "Backend/fullstack project detected";
  }
  if (rulePath.includes("memory") || rulePath.includes("incremental-intelligence") || rulePath.includes("tracking")) {
    return "AI/event-driven features detected";
  }
  if (rulePath.includes("security")) {
    return "Auth/payments detected";
  }
  if (rulePath.includes("performance")) {
    return "Performance-sensitive project";
  }
  if (rulePath.includes("type-system") || rulePath.includes("path-resolution")) {
    return "TypeScript project detected";
  }
  return "Selected by rule index";
}

/**
 * Determine which rule files from the index should be applied for this project.
 */
export function selectRulePaths(
  index: RulesIndex,
  profile: RepositoryProfile,
  focus?: AuditFocus
): string[] {
  const alwaysApplied = new Set([
    "core/master-rules.json",
    "quality/testing.rules.json",
    "quality/error-handling.rules.json",
    "architecture/dependency-architecture.rules.json",
    "architecture/circular-dependency.rules.json",
    "core/regression-prevention.rules.json",
  ]);

  const selected = new Set<string>(alwaysApplied);

  // Frontend
  if (profile.type === "frontend" || profile.type === "fullstack") {
    selected.add("quality/accessibility.rules.json");
    selected.add("architecture/component-modularity.rules.json");
  }

  // Backend
  if (profile.type === "backend" || profile.type === "fullstack") {
    selected.add("architecture/api-consistency.rules.json");
    selected.add("quality/environment-consistency.rules.json");
  }

  // AI
  if (profile.hasAI || profile.hasEvents) {
    selected.add("quality/memory-and-lifecycle.rules.json");
    selected.add("core/incremental-intelligence-architecture.rules.json");
  }

  // Tracking
  if (profile.hasTracking) {
    selected.add("quality/tracking-standards.rules.json");
  }

  // Auth
  if (profile.hasAuth) {
    selected.add("quality/security-privacy.rules.json");
  }

  // TypeScript
  if (profile.hasTypescript) {
    selected.add("core/type-system.rules.json");
    selected.add("architecture/path-resolution.rules.json");
  }

  // Focus filter
  if (focus) {
    const focusMap: Record<AuditFocus, string[]> = {
      architecture: ["architecture", "dependency", "circular", "component"],
      testing: ["testing"],
      security: ["security", "environment"],
      performance: ["performance"],
      events: ["memory", "tracking", "incremental"],
      accessibility: ["accessibility", "ui-ux"],
    };

    const keywords = focusMap[focus] ?? [];
    const focused = new Set<string>();

    // Always keep master-rules and error-handling for any focus
    focused.add("core/master-rules.json");
    focused.add("quality/error-handling.rules.json");

    for (const p of selected) {
      const lower = p.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        focused.add(p);
      }
    }

    return index.ruleLoadOrder.filter((p) => focused.has(p));
  }

  return index.ruleLoadOrder.filter((p) => selected.has(p));
}

/**
 * Load all selected rule files from disk.
 */
export async function loadRuleFiles(
  rulesDir: string,
  index: RulesIndex,
  profile: RepositoryProfile,
  focus?: AuditFocus
): Promise<LoadedRuleFile[]> {
  const selectedPaths = selectRulePaths(index, profile, focus);
  const loaded: LoadedRuleFile[] = [];
  const alwaysApplied = new Set([
    "core/master-rules.json",
    "quality/testing.rules.json",
    "quality/error-handling.rules.json",
    "architecture/dependency-architecture.rules.json",
    "architecture/circular-dependency.rules.json",
    "core/regression-prevention.rules.json",
  ]);

  for (let i = 0; i < selectedPaths.length; i++) {
    const rulePath = selectedPaths[i]!; // safe: i < length
    const fullPath = path.join(rulesDir, rulePath);

    if (!(await fs.pathExists(fullPath))) {
      console.warn(`Rule file not found: ${fullPath}, skipping`);
      continue;
    }

    try {
      const raw = await fs.readJSON(fullPath);
      const rules = extractRules(raw);

      loaded.push({
        path: rulePath,
        category: rulePath.split("/")[0] ?? "unknown",
        name: String(raw.ruleSetName ?? raw.masterRuleSet ?? raw.name ?? rulePath),
        description: String(raw.description ?? ""),
        rules,
        raw,
        loadOrder: i,
        selectedBecause: getSelectionReason(rulePath, profile, alwaysApplied),
      });
    } catch (err) {
      console.warn(`Failed to load rule file ${rulePath}: ${err}`);
    }
  }

  return loaded;
}
