/**
 * Core types for the VDD audit system.
 * These types are shared across all audit modules.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type ProjectType = "frontend" | "backend" | "fullstack" | "monorepo" | "ai-native";

export type AuditFocus = "architecture" | "testing" | "security" | "performance" | "events" | "accessibility";

export type AuditMode = "report" | "fix-plan" | "sprints" | "full";

export interface AuditOptions {
  focus?: AuditFocus | undefined;
  mode?: AuditMode | undefined;
  verbose?: boolean | undefined;
}

export interface RepositoryProfile {
  type: ProjectType;
  languages: Record<string, number>;
  frameworks: string[];
  hasTests: boolean;
  hasAuth: boolean;
  hasAI: boolean;
  hasEvents: boolean;
  hasTracking: boolean;
  isMonorepo: boolean;
  totalFiles: number;
  totalLOC: number;
  packageManager: string;
  testFramework: string | null;
  ciConfig: string | null;
  hasDesignSystem: boolean;
  hasTypescript: boolean;
  dependencyCount: number;
}

export interface RuleDefinition {
  ruleId: string;
  name: string;
  description: string;
  severity: Severity;
  category: string;
  guidelines?: string[] | undefined;
  solutions?: string[] | undefined;
  forbidden?: string[] | undefined;
}

export interface LoadedRuleFile {
  path: string;
  category: string;
  name: string;
  description: string;
  rules: RuleDefinition[];
  raw: Record<string, unknown>;
  loadOrder: number;
  selectedBecause: string;
}

export interface AuditEvidence {
  file: string;
  pattern: string;
  lineRange?: [number, number] | undefined;
  snippet?: string | undefined;
}

export interface AuditIssue {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  ruleSource: string;
  ruleId: string;
  whyItMatters: string;
  evidence: AuditEvidence[];
  affectedFiles: string[];
  suggestedRemediation: string;
  estimatedEffortHours: number;
  sprintAssignment: number;
  blocks: string[];
  dependsOn: string[];
  workstream: string;
}

export interface Workstream {
  name: string;
  priority: Severity;
  effort: string;
  issues: AuditIssue[];
  dependsOn: string[];
  whyItMatters: string;
  successCriteria: string[];
}

export interface SprintPlan {
  sprint: number;
  name: string;
  duration: string;
  priority: Severity;
  goal: string;
  issues: AuditIssue[];
  successCriteria: string[];
}

export interface AuditReport {
  metadata: {
    timestamp: string;
    repositoryPath: string;
    auditMode: AuditMode;
    focusArea?: AuditFocus | undefined;
    rulesetsApplied: string[];
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  profile: RepositoryProfile;
  rulesApplied: LoadedRuleFile[];
  issues: AuditIssue[];
  workstreams: Workstream[];
  sprints: SprintPlan[];
  riskLevel: Severity;
  executiveSummary: string;
}

export interface RulesIndexEntry {
  path: string;
  name: string;
  applies_to?: string[];
  key_constraints?: string[];
  key_rule?: string;
  violations_cost?: string;
  requirements?: string[];
  tools?: string[];
  pattern?: string;
  purpose?: string;
}

export interface RulesIndexCategory {
  description: string;
  files: RulesIndexEntry[];
}

export interface RulesIndex {
  schemaVersion: string;
  ruleSetName: string;
  version: string;
  ruleLoadOrder: string[];
  ruleCategories: Record<string, RulesIndexCategory>;
  priorityMatrix: Record<string, { color: string; description: string; rules: string[] }>;
}
