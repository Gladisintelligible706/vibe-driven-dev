/**
 * Agent Runtime Detector
 *
 * Detects the active coding-agent runtime from the project filesystem
 * and environment signals. Used by skill-bootstrap and skill-recommender
 * to target install commands correctly.
 *
 * Detection is filesystem-first: it checks for known agent directories,
 * config files, and conventions before falling back to inference heuristics.
 */

import fs from "fs-extra";
import path from "node:path";
import type { InstallTargetId } from "../install/target-types.js";

export interface RuntimeDetectionResult {
  runtime: InstallTargetId | "unknown";
  confidence: "high" | "medium" | "low" | "none";
  signals: RuntimeSignal[];
  fallbackReason?: string | undefined;
  recommendedInstallScope: "project" | "global";
  agentArg: string | undefined;
}

export interface RuntimeSignal {
  source: "filesystem" | "env" | "config" | "inference";
  target: InstallTargetId;
  evidence: string;
  weight: number;
}

interface DetectionCandidate {
  target: InstallTargetId;
  agentArg: string;
  fsSignals: Array<{
    path: string;
    weight: number;
    description: string;
  }>;
  envVars: string[];
}

const CANDIDATES: DetectionCandidate[] = [
  {
    target: "claude-code",
    agentArg: "claude-code",
    fsSignals: [
      { path: ".claude/agents", weight: 10, description: "Claude Code agents directory" },
      { path: ".claude/skills", weight: 10, description: "Claude Code skills directory" },
      { path: ".claude/commands", weight: 8, description: "Claude Code commands directory" },
      { path: ".claude/settings.json", weight: 6, description: "Claude Code settings" },
      { path: "CLAUDE.md", weight: 4, description: "Claude Code project instructions" }
    ],
    envVars: ["CLAUDE_CODE_ENTRYPOINT"]
  },
  {
    target: "codex",
    agentArg: "codex",
    fsSignals: [
      { path: ".codex/skills", weight: 10, description: "Codex skills directory" },
      { path: ".codex/config.json", weight: 6, description: "Codex config" }
    ],
    envVars: ["CODEX_HOME"]
  },
  {
    target: "cursor",
    agentArg: "cursor",
    fsSignals: [
      { path: ".cursor/rules", weight: 10, description: "Cursor rules directory" },
      { path: ".cursor/config.json", weight: 6, description: "Cursor config" }
    ],
    envVars: ["CURSOR_HOME"]
  },
  {
    target: "windsurf",
    agentArg: "windsurf",
    fsSignals: [
      { path: ".windsurf/rules", weight: 10, description: "Windsurf rules directory" },
      { path: ".windsurf/config.json", weight: 6, description: "Windsurf config" }
    ],
    envVars: ["WINDSURF_HOME"]
  },
  {
    target: "opencode",
    agentArg: "opencode",
    fsSignals: [
      { path: "opencode.json", weight: 10, description: "OpenCode config" },
      { path: "opencode.jsonc", weight: 10, description: "OpenCode config (JSONC)" }
    ],
    envVars: ["OPENCODE_HOME"]
  },
  {
    target: "gemini-cli",
    agentArg: "gemini-cli",
    fsSignals: [
      { path: ".gemini/commands", weight: 10, description: "Gemini CLI commands directory" },
      { path: ".gemini/extensions", weight: 8, description: "Gemini CLI extensions directory" },
      { path: ".gemini/settings.json", weight: 6, description: "Gemini CLI settings" }
    ],
    envVars: ["GEMINI_HOME"]
  }
];

function collectFilesystemSignals(projectRoot: string): RuntimeSignal[] {
  const signals: RuntimeSignal[] = [];

  for (const candidate of CANDIDATES) {
    for (const fsSignal of candidate.fsSignals) {
      const fullPath = path.join(projectRoot, fsSignal.path);
      if (fs.existsSync(fullPath)) {
        signals.push({
          source: "filesystem",
          target: candidate.target,
          evidence: fsSignal.description,
          weight: fsSignal.weight
        });
      }
    }
  }

  return signals;
}

function collectEnvSignals(): RuntimeSignal[] {
  const signals: RuntimeSignal[] = [];

  for (const candidate of CANDIDATES) {
    for (const envVar of candidate.envVars) {
      if (process.env[envVar]) {
        signals.push({
          source: "env",
          target: candidate.target,
          evidence: `Environment variable ${envVar} is set`,
          weight: 7
        });
      }
    }
  }

  return signals;
}

function collectInferenceSignals(projectRoot: string): RuntimeSignal[] {
  const signals: RuntimeSignal[] = [];

  // AGENTS.md with vdd references suggests generic agent usage
  const agentsMdPath = path.join(projectRoot, "AGENTS.md");
  if (fs.existsSync(agentsMdPath)) {
    try {
      const content = fs.readFileSync(agentsMdPath, "utf-8").toLowerCase();
      if (content.includes("claude")) {
        signals.push({
          source: "inference",
          target: "claude-code",
          evidence: "AGENTS.md references Claude",
          weight: 3
        });
      }
      if (content.includes("cursor")) {
        signals.push({
          source: "inference",
          target: "cursor",
          evidence: "AGENTS.md references Cursor",
          weight: 3
        });
      }
      if (content.includes("gemini")) {
        signals.push({
          source: "inference",
          target: "gemini-cli",
          evidence: "AGENTS.md references Gemini",
          weight: 3
        });
      }
    } catch {
      // ignore read errors
    }
  }

  return signals;
}

function resolveTopCandidate(
  signals: RuntimeSignal[]
): { target: InstallTargetId | "unknown"; confidence: "high" | "medium" | "low" | "none" } {
  if (signals.length === 0) {
    return { target: "unknown", confidence: "none" };
  }

  const scores = new Map<InstallTargetId, number>();
  for (const signal of signals) {
    const current = scores.get(signal.target) ?? 0;
    scores.set(signal.target, current + signal.weight);
  }

  let bestTarget: InstallTargetId = "generic-agents-md";
  let bestScore = 0;

  for (const [target, score] of scores) {
    if (score > bestScore) {
      bestTarget = target;
      bestScore = score;
    }
  }

  if (bestScore >= 10) {
    return { target: bestTarget, confidence: "high" };
  }

  if (bestScore >= 6) {
    return { target: bestTarget, confidence: "medium" };
  }

  if (bestScore >= 3) {
    return { target: bestTarget, confidence: "low" };
  }

  return { target: "unknown", confidence: "none" };
}

function getAgentArg(target: InstallTargetId | "unknown"): string | undefined {
  if (target === "unknown") {
    return undefined;
  }

  const candidate = CANDIDATES.find((c) => c.target === target);
  return candidate?.agentArg;
}

/**
 * Detects the active agent runtime from the project directory.
 *
 * Returns a structured result with the detected runtime, confidence,
 * all signals collected, and the recommended install scope.
 */
export function detectAgentRuntime(
  projectRoot: string,
  explicitRuntime?: string | undefined
): RuntimeDetectionResult {
  // If the caller already knows the runtime, trust it
  if (explicitRuntime) {
    const known = CANDIDATES.find(
      (c) =>
        c.target === explicitRuntime ||
        c.agentArg === explicitRuntime ||
        c.target === explicitRuntime.replace(/-/g, "")
    );

    if (known) {
      return {
        runtime: known.target,
        confidence: "high",
        signals: [
          {
            source: "config",
            target: known.target,
            evidence: "Runtime explicitly provided by caller",
            weight: 15
          }
        ],
        recommendedInstallScope: "project",
        agentArg: known.agentArg
      };
    }
  }

  const fsSignals = collectFilesystemSignals(projectRoot);
  const envSignals = collectEnvSignals();
  const inferenceSignals = collectInferenceSignals(projectRoot);
  const allSignals = [...fsSignals, ...envSignals, ...inferenceSignals];
  const { target, confidence } = resolveTopCandidate(allSignals);

  return {
    runtime: target,
    confidence,
    signals: allSignals,
    fallbackReason:
      confidence === "none"
        ? "No agent runtime signals found. Falling back to generic AGENTS.md mode."
        : undefined,
    recommendedInstallScope: "project",
    agentArg: getAgentArg(target)
  };
}
