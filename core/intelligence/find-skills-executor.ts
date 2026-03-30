/**
 * Find-Skills CLI Executor
 *
 * Handles real interaction with the Skills CLI ecosystem:
 * 1. Installs find-skills via: npx skills add https://github.com/vercel-labs/skills --skill find-skills
 * 2. Runs discovery queries via: npx skills find <query>
 * 3. Parses CLI output into structured results
 * 4. Installs recommended skills via: npx skills add <owner>/skills --skill <name> --agent <agent> -y
 *
 * This module bridges the gap between VDD's intelligence layer and the
 * actual skills.sh ecosystem. It executes real CLI commands and returns
 * structured data the orchestrator can consume.
 */

import { execSync, type ExecSyncOptions } from "node:child_process";
import type { RuntimeDetectionResult } from "./agent-runtime-detector.js";

export interface FindSkillsInstallResult {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  error?: string | undefined;
}

export interface FindSkillsSearchResult {
  query: string;
  skills: DiscoveredSkill[];
  rawOutput: string;
  success: boolean;
  error?: string | undefined;
}

export interface DiscoveredSkill {
  id: string;
  name: string;
  owner: string;
  description: string;
  source: "cli-output";
}

export interface SkillInstallResult {
  skillId: string;
  command: string;
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string | undefined;
}

const FSKILLS_REPO = "https://github.com/vercel-labs/skills";
const EXEC_TIMEOUT_MS = 30_000;

function getExecOptions(): ExecSyncOptions {
  return {
    encoding: "utf-8",
    timeout: EXEC_TIMEOUT_MS,
    stdio: ["pipe", "pipe", "pipe"]
  } as ExecSyncOptions & { encoding: "utf-8" };
}

/**
 * Build the find-skills install command for the given runtime.
 *
 * @example
 * buildFindSkillsInstallCommand({ runtime: "claude-code", agentArg: "claude-code", ... })
 * // => "npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent claude-code -y"
 */
export function buildFindSkillsInstallCommand(runtime: RuntimeDetectionResult): string {
  const parts = ["npx skills add", FSKILLS_REPO, "--skill find-skills"];

  if (runtime.agentArg && runtime.confidence !== "none") {
    parts.push(`--agent ${runtime.agentArg}`);
  }

  parts.push("-y");
  return parts.join(" ");
}

/**
 * Build a search command for the given query.
 *
 * @example
 * buildSearchCommand("react testing")
 * // => "npx skills find react testing"
 */
export function buildSearchCommand(query: string): string {
  return `npx skills find ${query}`;
}

/**
 * Build an install command for a specific skill.
 *
 * @example
 * buildSkillInstallCommand("vercel-labs/systematic-debugging", { runtime: "claude-code", agentArg: "claude-code", ... })
 * // => "npx skills add vercel-labs/skills --skill systematic-debugging --agent claude-code -y"
 */
export function buildSkillInstallCommand(
  skillId: string,
  runtime: RuntimeDetectionResult
): string {
  const parts = ["npx skills add"];

  const slashIndex = skillId.indexOf("/");
  if (slashIndex > 0) {
    parts.push(skillId.substring(0, slashIndex) + "/skills");
    parts.push(`--skill ${skillId.substring(slashIndex + 1)}`);
  } else {
    parts.push(skillId);
  }

  if (runtime.agentArg && runtime.confidence !== "none") {
    parts.push(`--agent ${runtime.agentArg}`);
  }

  parts.push("-y");
  return parts.join(" ");
}

/**
 * Execute a shell command safely. Returns result object instead of throwing.
 */
function safeExec(command: string): { stdout: string; stderr: string; success: boolean; error?: string } {
  try {
    const stdout = execSync(command, getExecOptions()) as string;
    return { stdout: stdout.trim(), stderr: "", success: true };
  } catch (err: unknown) {
    const error = err as { stdout?: Buffer | string; stderr?: Buffer | string; message?: string };
    return {
      stdout: typeof error.stdout === "string" ? error.stdout : error.stdout?.toString("utf-8") ?? "",
      stderr: typeof error.stderr === "string" ? error.stderr : error.stderr?.toString("utf-8") ?? "",
      success: false,
      error: error.message ?? "Unknown execution error"
    };
  }
}

/**
 * Install find-skills from the vercel-labs/skills repository.
 *
 * This is Step 1 of the auto-skill-bootstrap flow.
 * It runs: npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent <agent> -y
 */
export function installFindSkills(runtime: RuntimeDetectionResult): FindSkillsInstallResult {
  const command = buildFindSkillsInstallCommand(runtime);
  const result = safeExec(command);

  return {
    success: result.success,
    command,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error
  };
}

/**
 * Run a single discovery query against the skills ecosystem.
 *
 * This executes: npx skills find <query>
 * and parses the output into structured DiscoveredSkill objects.
 *
 * The CLI output format may vary. This parser handles common patterns:
 * - Lines with "owner/skill-name" format
 * - Lines with "name: description" format
 * - JSON output if available
 */
export function runDiscoveryQuery(query: string): FindSkillsSearchResult {
  const command = buildSearchCommand(query);
  const result = safeExec(command);

  if (!result.success) {
    return {
      query,
      skills: [],
      rawOutput: result.stderr || result.stdout,
      success: false,
      error: result.error
    };
  }

  const skills = parseCliOutput(result.stdout);

  return {
    query,
    skills,
    rawOutput: result.stdout,
    success: true
  };
}

/**
 * Parse the raw CLI output from `npx skills find` into structured skill entries.
 *
 * Handles multiple output formats:
 * 1. JSON array output (if CLI supports --json)
 * 2. Line-by-line "owner/skill-name — description" format
 * 3. Line-by-line "owner/skill-name: description" format
 * 4. Line-by-line "owner/skill-name" format (no description)
 */
function parseCliOutput(rawOutput: string): DiscoveredSkill[] {
  const skills: DiscoveredSkill[] = [];
  const lines = rawOutput.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try JSON first
  for (const line of lines) {
    if (line.startsWith("[") || line.startsWith("{")) {
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            if (entry.name || entry.skill || entry.id) {
              skills.push({
                id: entry.id ?? entry.skill ?? entry.name,
                name: entry.name ?? entry.skill ?? entry.id,
                owner: entry.owner ?? extractOwner(entry.id ?? entry.skill ?? ""),
                description: entry.description ?? entry.summary ?? "",
                source: "cli-output"
              });
            }
          }
          if (skills.length > 0) return skills;
        }
      } catch {
        // Not JSON, continue with line parsing
      }
    }
  }

  // Parse line-by-line formats
  for (const line of lines) {
    // Skip header/footer/separator lines
    if (line.startsWith("#") || line.startsWith("---") || line.startsWith("===") || line.length < 3) {
      continue;
    }

    // Pattern: "owner/skill-name — description" or "owner/skill-name - description"
    const dashMatch = line.match(/^([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\s*[—–-]\s*(.+)$/);
    if (dashMatch) {
      const [, id, desc] = dashMatch;
      skills.push({
        id: id!,
        name: extractSkillName(id!),
        owner: extractOwner(id!),
        description: desc!.trim(),
        source: "cli-output"
      });
      continue;
    }

    // Pattern: "owner/skill-name: description"
    const colonMatch = line.match(/^([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+):\s*(.+)$/);
    if (colonMatch) {
      const [, id, desc] = colonMatch;
      skills.push({
        id: id!,
        name: extractSkillName(id!),
        owner: extractOwner(id!),
        description: desc!.trim(),
        source: "cli-output"
      });
      continue;
    }

    // Pattern: just "owner/skill-name"
    const idMatch = line.match(/^([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)$/);
    if (idMatch) {
      const id = idMatch[1]!;
      skills.push({
        id,
        name: extractSkillName(id),
        owner: extractOwner(id),
        description: "",
        source: "cli-output"
      });
    }
  }

  return skills;
}

function extractOwner(skillId: string): string {
  const slashIndex = skillId.indexOf("/");
  return slashIndex > 0 ? skillId.substring(0, slashIndex) : "unknown";
}

function extractSkillName(skillId: string): string {
  const slashIndex = skillId.indexOf("/");
  return slashIndex > 0 ? skillId.substring(slashIndex + 1) : skillId;
}

/**
 * Run multiple discovery queries in sequence.
 *
 * Deduplicates results by skill id and collects all raw outputs.
 * Returns combined results for the orchestrator to score.
 */
export function runDiscoveryQueries(queries: string[]): FindSkillsSearchResult[] {
  const results: FindSkillsSearchResult[] = [];

  for (const query of queries) {
    const result = runDiscoveryQuery(query);
    results.push(result);

    // Brief pause between queries to avoid rate limiting
    if (queries.indexOf(query) < queries.length - 1) {
      try {
        execSync("sleep 1", { encoding: "utf-8", timeout: 5000 });
      } catch {
        // ignore timeout
      }
    }
  }

  return results;
}

/**
 * Install a single skill via the Skills CLI.
 */
export function installSkill(
  skillId: string,
  runtime: RuntimeDetectionResult
): SkillInstallResult {
  const command = buildSkillInstallCommand(skillId, runtime);
  const result = safeExec(command);

  return {
    skillId,
    command,
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error
  };
}

/**
 * Install multiple skills in sequence.
 *
 * Returns results for each skill. Does not stop on failure —
 * continues with remaining skills and reports individual failures.
 */
export function installSkills(
  skillIds: string[],
  runtime: RuntimeDetectionResult
): SkillInstallResult[] {
  return skillIds.map((skillId) => installSkill(skillId, runtime));
}

/**
 * Deduplicate discovered skills across multiple query results.
 */
export function deduplicateSkills(results: FindSkillsSearchResult[]): DiscoveredSkill[] {
  const seen = new Set<string>();
  const deduped: DiscoveredSkill[] = [];

  for (const result of results) {
    for (const skill of result.skills) {
      const key = skill.id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(skill);
      }
    }
  }

  return deduped;
}
