#!/usr/bin/env node

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import chalk from "chalk";
import { CommandParser } from "../../core/router/command-parser.js";
import { RouterEngine } from "../../core/router/engine.js";
import { StateManager } from "../../core/router/state-manager.js";
import { SourceLoader } from "../../core/runtime/source-loader.js";
import { addPack, listPacks } from "../../core/runtime/pack-loader.js";
import { SecurityGate } from "../../core/gates/security-gate.js";
import { AutopilotConductor } from "../../core/autopilot/conductor.js";
import { runInstallCommand } from "./commands/install.js";
import { runTargetsCommand } from "./commands/targets.js";
import { runAuditCommand } from "./commands/audit.js";
import { resolveVddPaths } from "../../core/install/paths.js";


// @ts-ignore - TS complains about import.meta in CommonJS target but this runs as ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();
const parser = new CommandParser();
const router = new RouterEngine();
const stateManager = new StateManager();
const sourceLoader = new SourceLoader();
const securityGate = new SecurityGate();
const autopilotConductor = new AutopilotConductor();


function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function printSection(title: string): void {
  console.log(chalk.bold.cyan(title));
}

function getRawRunCommand(commandParts: string[]): string {
  const runIndex = process.argv.findIndex((value) => value === "run");

  if (runIndex !== -1) {
    const trailing = process.argv.slice(runIndex + 1);
    if (trailing.length > 0) {
      return trailing.join(" ");
    }
  }

  return commandParts.join(" ");
}

// Read version from package.json at runtime
const packageJsonPath = path.resolve(__dirname, "../../../package.json");
let cliVersion = "0.0.0";
try {
  const pkg = await fs.readJson(packageJsonPath);
  cliVersion = pkg.version ?? cliVersion;
} catch { /* fallback */ }

program
  .name("vdd")
  .description(
    "Vibe Driven Dev: an agent-first orchestration framework for safe vibe coding."
  )
  .version(cliVersion);

program
  .command("init")
  .description("Initialize a Vibe Driven Dev project scaffold and state.")
  .option("--project-id <value>", "Project identifier")
  .option("--platform <value>", "Target platform or environment")
  .option("--target-user <value>", "Intended user or audience")
  .option("--success-definition <value>", "Success definition")
  .action(async (options) => {
    const exists = await stateManager.exists();

    if (exists) {
      console.log(chalk.yellow("A VDD project state already exists."));
      console.log(`State file: ${chalk.gray(stateManager.getStateFilePath())}`);
      return;
    }

    const state = await stateManager.init({
      projectId: options.projectId,
      platform: options.platform,
      targetUser: options.targetUser,
      successDefinition: options.successDefinition
    });

    printSection("VDD project initialized");
    console.log(`State file: ${chalk.gray(stateManager.getStateFilePath())}`);
    printJson(state);
  });

program
  .command("doctor")
  .description("Inspect project health, runtime contracts, and source integrity.")
  .action(async () => {
    const projectRoot = process.cwd();
    printSection("VDD doctor");

    const checks: { label: string; ok: boolean; detail: string }[] = [];

    // 1. Project state check
    const stateExists = await stateManager.exists();
    let stageInfo = "—";
    if (stateExists) {
      try {
        const state = await stateManager.load();
        stageInfo = state?.stage ?? "unknown";
      } catch { /* ignore */ }
    }
    checks.push({
      label: ".vdd/project-state.json",
      ok: stateExists,
      detail: stateExists ? `stage: ${stageInfo}` : "not found — run `vdd init`"
    });

    // 2. Install manifest check
    const paths = resolveVddPaths(projectRoot);
    const manifestExists = await fs.pathExists(paths.manifestFile);
    let manifestInfo = "not found";
    if (manifestExists) {
      try {
        const manifest = await fs.readJson(paths.manifestFile);
        manifestInfo = `target: ${manifest.target ?? "?"}, scope: ${manifest.scope ?? "?"}, version: ${manifest.version ?? "?"}`;
      } catch { manifestInfo = "unreadable"; }
    }
    checks.push({
      label: ".vdd/install-manifest.json",
      ok: manifestExists,
      detail: manifestInfo
    });

    // 3. Claude agents check (project-local)
    const claudeAgentsDir = path.join(projectRoot, ".claude", "agents");
    const claudeAgentsExist = await fs.pathExists(claudeAgentsDir);
    let claudeAgentCount = 0;
    if (claudeAgentsExist) {
      const files = await fs.readdir(claudeAgentsDir);
      claudeAgentCount = files.filter((f) => f.startsWith("vdd-") && f.endsWith(".md")).length;
    }
    checks.push({
      label: ".claude/agents/ (Claude integration)",
      ok: claudeAgentsExist && claudeAgentCount > 0,
      detail: claudeAgentsExist ? `${claudeAgentCount} VDD agent(s) installed` : "not found — run `vdd install claude-code --project`"
    });

    // 4. Source scan
    let sourceCount = 0;
    try {
      const summary = await sourceLoader.summarize();
      sourceCount = summary.executable;
    } catch { /* ignore */ }
    checks.push({
      label: "Executable sources",
      ok: sourceCount > 0,
      detail: `${sourceCount} executable source(s) discovered`
    });

    // Render report
    console.log("");
    for (const check of checks) {
      const icon = check.ok ? chalk.green("✓") : chalk.yellow("⚠");
      const label = chalk.bold(check.label);
      console.log(`  ${icon}  ${label}`);
      console.log(`     ${chalk.gray(check.detail)}`);
    }
    console.log("");

    const allOk = checks.every((c) => c.ok);
    if (allOk) {
      console.log(chalk.green("✓ VDD environment is healthy."));
    } else {
      console.log(chalk.yellow("⚠ Some checks failed — see above for details."));
    }
  });

program
  .command("status")
  .description("Show the current project stage, readiness, and runtime summary.")
  .action(async () => {
    const state = await stateManager.load();

    if (!state) {
      console.log(chalk.yellow("No project state found."));
      console.log("Run `vdd init` first.");
      return;
    }

    const result = router.run({
      command: "/vibe.status",
      state
    });

    printSection("VDD status");
    printJson({
      state,
      routing: result
    });
  });

program
  .command("scan")
  .description("Discover skills, agents, add-ons, and archive learning sources.")
  .option("--json", "Print full scan results as JSON")
  .action(async (options) => {
    try {
      const [summary, all] = await Promise.all([
        sourceLoader.summarize(),
        sourceLoader.loadAll()
      ]);

      printSection("VDD scan");

      console.log(
        chalk.green(
          `Discovered ${summary.total} source(s): ` +
            `${summary.skills} skill(s), ${summary.agents} agent(s)`
        )
      );

      console.log(
        [
          `Executable: ${summary.executable}`,
          `Restricted: ${summary.restricted}`,
          `Learning-only: ${summary.learningOnly}`
        ].join(" | ")
      );

      if (options.json) {
        printJson({
          summary,
          sources: all
        });
        return;
      }

      if (all.length === 0) {
        console.log(chalk.yellow("No runtime sources were found."));
        return;
      }

      console.log("");

      for (const source of all) {
        const kind = chalk.cyan(source.kind);
        const eligibility =
          source.runtimeEligibility === "executable"
            ? chalk.green(source.runtimeEligibility)
            : source.runtimeEligibility === "restricted"
            ? chalk.yellow(source.runtimeEligibility)
            : chalk.gray(source.runtimeEligibility);

        console.log(
          `- ${chalk.bold(source.name)} ` +
            `[${source.fileType}] ` +
            `${kind} ` +
            `${eligibility}`
        );
        console.log(`  path: ${chalk.gray(source.relativePath)}`);

        if (source.description) {
          console.log(`  desc: ${source.description}`);
        }
      }
    } catch (error) {
      console.error(chalk.red("Scan failed."));

      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error");
      }

      process.exitCode = 1;
    }
  });

program
  .command("validate")
  .description("Validate a skill, agent, add-on, or project runtime contract.")
  .argument("<sourceId>", "The ID of the source to validate (e.g. archive-learning-skill:path/to/skill)")
  .action(async (sourceId: string) => {
    printSection(`VDD validate: ${sourceId}`);

    const all = await sourceLoader.loadAll();
    const source = all.find((s) => s.id === sourceId);

    if (!source) {
      console.log(chalk.red(`Source not found with ID: ${sourceId}`));
      process.exitCode = 1;
      return;
    }

    const audit = await securityGate.audit(source.body, source.relativePath);

    const report = {
      name: source.name,
      id: source.id,
      eligibility: source.runtimeEligibility,
      trustTier: source.trustTier,
      frontmatter: {
        present: Object.keys(source.frontmatter).length > 0,
        name: !!source.frontmatter.name,
        description: !!source.frontmatter.description
      },
      security: audit
    };

    if (audit.passed) {
      console.log(chalk.green("✓ Validation passed."));
    } else {
      console.log(chalk.yellow("⚠ Validation failed or has warnings."));
    }

    printJson(report);
  });

program
  .command("audit")
  .description("Run comprehensive code audit & remediation analysis on the current project.")
  .option("--focus <area>", "Focus audit on specific area: architecture|testing|security|performance|events|accessibility", undefined)
  .option("--mode <mode>", "Output mode: report|fix-plan|sprints|full", "full")
  .option("--verbose", "Show detailed progress", false)
  .action(async (options) => {
    try {
      await runAuditCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red("Audit error: " + error.message));
      } else {
        console.error(chalk.red("Unknown audit error"));
      }
      process.exitCode = 1;
    }
  });

program
  .command("targets")
  .description("List supported install targets, export modes, and implementation status.")
  .action(() => {
    runTargetsCommand();
  });

program
  .command("install")
  .description("Install VDD agents and workspace files for a specific AI coding runtime.")
  .argument(
    "<target>",
    "Target runtime: claude-code | codex | cursor | windsurf | opencode | gemini-cli | generic-agents-md"
  )
  .option("--project", "Install in project scope (default)", false)
  .option("--global", "Install in user-global scope", false)
  .action(async (target: string, options) => {
    await runInstallCommand(target, options);
  });

program
  .command("promote")
  .description("Promote an eligible add-on from restricted or learning-only status.")
  .argument("<sourceId>", "The ID of the source to promote (e.g. archive-learning-skill:path/to/skill)")
  .option("--force", "Force promotion even if validation fails", false)
  .action(async (sourceId: string, options) => {
    printSection(`VDD promote: ${sourceId}`);

    const all = await sourceLoader.loadAll();
    const source = all.find((s) => s.id === sourceId);

    if (!source) {
      console.log(chalk.red(`Source not found with ID: ${sourceId}`));
      process.exitCode = 1;
      return;
    }

    if (source.runtimeEligibility === "executable" && !options.force) {
      console.log(chalk.yellow("Source is already in an executable context."));
      return;
    }

    const audit = await securityGate.audit(source.body, source.relativePath);

    if (!audit.passed && !options.force) {
      console.log(chalk.red("Promotion blocked: Validation failed."));
      console.log(chalk.yellow("Use --force to bypass security gate (not recommended)."));
      printJson(audit);
      process.exitCode = 1;
      return;
    }

    let targetPath: string;
    const projectRoot = process.cwd();

    if (source.fileType === "skill") {
      targetPath = path.join(projectRoot, "skills", path.basename(path.dirname(source.absolutePath)), "SKILL.md");
    } else {
      targetPath = path.join(projectRoot, "agents", path.basename(path.dirname(source.absolutePath)), "AGENT.md");
    }

    if (await fs.pathExists(targetPath)) {
      console.log(chalk.red(`Promotion target already exists: ${path.relative(projectRoot, targetPath)}`));
      process.exitCode = 1;
      return;
    }

    await fs.ensureDir(path.dirname(targetPath));
    // Move the entire directory if possible, or just the file
    // For simplicity, we move the directory containing the file to ensure related assets are moved
    const sourceDir = path.dirname(source.absolutePath);
    await fs.move(sourceDir, path.dirname(targetPath));

    console.log(chalk.green("✓ Promotion successful."));
    console.log(`Source moved to: ${chalk.gray(path.relative(projectRoot, targetPath))}`);
    console.log(`Trust level upgraded to: ${chalk.green("trusted-core / executable")}`);
  });

program
  .command("add")
  .description("Add an external skill pack from a local path or GitHub.")
  .argument("<source>", "Pack source: local path (e.g. ../coding-standards-skill) or github:<user/repo>")
  .option("--name <value>", "Override the pack name (default: directory name)")
  .option("--version <value>", "Pack version label", "0.1.0")
  .action(async (source: string, options) => {
    const projectRoot = process.cwd();
    const name =
      options.name ??
      source
        .replace(/^local:/, "")
        .replace(/^github:/, "")
        .split("/")
        .filter(Boolean)
        .pop() ??
      source;

    printSection("vdd add");

    const result = await addPack(projectRoot, name, source, options.version);

    if (result.success) {
      console.log(chalk.green(result.message));
      console.log(chalk.gray(`Run \`vdd scan\` to verify the pack was discovered.`));
    } else {
      console.log(chalk.red(result.message));
      process.exitCode = 1;
    }
  });

program
  .command("packs")
  .description("List installed external skill packs.")
  .option("--json", "Print full packs list as JSON")
  .action(async (options) => {
    const projectRoot = process.cwd();
    const packs = await listPacks(projectRoot);

    printSection("vdd packs");

    if (packs.length === 0) {
      console.log(chalk.yellow("No packs installed."));
      console.log(chalk.gray(`Use \`vdd add <path>\` to install a pack.`));
      return;
    }

    if (options.json) {
      printJson(packs);
      return;
    }

    for (const pack of packs) {
      console.log(`- ${chalk.bold(pack.name)} @ ${chalk.gray(pack.version)}`);
      console.log(`  source: ${chalk.gray(pack.source)}`);
      if (pack.description) {
        console.log(`  desc:   ${pack.description}`);
      }
    }
  });

program
  .command("run")
  .description("Run a public Vibe Driven Dev command through the router.")
  .allowUnknownOption(true)
  .argument("<commandParts...>", "Public VDD command such as /vibe.init or /vibe.skills --top 5")
  .action(async (commandParts: string[]) => {
    try {
      const rawCommand = getRawRunCommand(commandParts);
      const parsed = parser.parse(rawCommand);

      let state = await stateManager.load();

      if (parsed.normalized === "/vibe.start") {
        const result = router.run({
          command: parsed.normalized,
          state,
          args: parsed.args,
          projectRoot: process.cwd()
        });

        const onboarding = result.intelligence?.onboarding;

        if (onboarding?.canInitializeState) {
          if (!state) {
            state = await stateManager.init({
              platform: onboarding.seed.platform,
              projectType: onboarding.seed.projectType,
              problemStatement: onboarding.seed.problemStatement,
              targetUser: onboarding.seed.targetUser,
              successDefinition: onboarding.seed.successDefinition,
              hasAiFeatures: onboarding.seed.hasAiFeatures,
              deliveryPreference: onboarding.seed.deliveryPreference
            });

            state = await stateManager.update((current) => ({
              ...current,
              assumptions: Array.from(
                new Set([
                  ...current.assumptions,
                  ...onboarding.seed.assumptions,
                  ...onboarding.seed.constraints.map(
                    (constraint) => `Constraint: ${constraint}`
                  )
                ])
              )
            }));
          } else if (state.stage === "init") {
            state = await stateManager.update((current) => ({
              ...current,
              platform: current.platform ?? onboarding.seed.platform,
              projectType: current.projectType ?? onboarding.seed.projectType,
              problemStatement: current.problemStatement ?? onboarding.seed.problemStatement,
              targetUser: current.targetUser ?? onboarding.seed.targetUser,
              successDefinition: current.successDefinition ?? onboarding.seed.successDefinition,
              hasAiFeatures: current.hasAiFeatures ?? onboarding.seed.hasAiFeatures,
              deliveryPreference: current.deliveryPreference ?? onboarding.seed.deliveryPreference,
              assumptions: Array.from(
                new Set([
                  ...current.assumptions,
                  ...onboarding.seed.assumptions,
                  ...onboarding.seed.constraints.map(
                    (constraint) => `Constraint: ${constraint}`
                  )
                ])
              )
            }));
          }
        }

        const autopilotResults: unknown[] = [];
        const autopilotPlan =
          onboarding && state
            ? autopilotConductor.plan({
                onboarding,
                currentStage: state.stage,
                currentStatus: state.status,
                artifactsPresent: state.artifacts ?? [],
                hasBlockers: result.blockers.length > 0,
                contradictions: []
              })
            : null;

        // Show adaptive questions if the autopilot identified them
        if (autopilotPlan && autopilotPlan.questions.length > 0) {
          printSection("Adaptive Questions");
          for (const q of autopilotPlan.questions) {
            console.log(chalk.yellow(`  [${q.leverage}] ${q.plainLanguage}`));
          }
        }

        // Show pause decision if the autopilot decided to pause
        if (autopilotPlan?.pauseDecision && autopilotPlan.pauseDecision.verdict !== "continue") {
          printSection("Autopilot Decision");
          console.log(chalk[autopilotPlan.pauseDecision.verdict === "stop" ? "red" : "yellow"](
            `  Verdict: ${autopilotPlan.pauseDecision.verdict}`
          ));
          console.log(`  ${autopilotPlan.pauseDecision.explanation}`);
          if (autopilotPlan.pauseDecision.suggestedAction) {
            console.log(chalk.cyan(`  Suggested: ${autopilotPlan.pauseDecision.suggestedAction}`));
          }
        }

        if (autopilotPlan?.continueAutomatically && state && autopilotPlan.pauseDecision?.verdict === "continue") {
          for (const step of autopilotPlan.steps) {
            // Re-evaluate checkpoint before each step
            const stepCheckpoint = autopilotConductor.plan({
              onboarding: onboarding!,
              currentStage: state.stage,
              currentStatus: state.status,
              artifactsPresent: state.artifacts ?? [],
              hasBlockers: false,
              contradictions: []
            });

            if (stepCheckpoint.pauseDecision?.verdict === "stop") {
              autopilotResults.push({
                command: step.command,
                reason: step.reason,
                status: "stopped",
                pauseReason: stepCheckpoint.pauseDecision.explanation
              });
              break;
            }

            if (stepCheckpoint.pauseDecision?.verdict === "pause") {
              autopilotResults.push({
                command: step.command,
                reason: step.reason,
                status: "paused",
                pauseReason: stepCheckpoint.pauseDecision.explanation,
                requiresApproval: stepCheckpoint.pauseDecision.requiresHumanApproval
              });
              break;
            }

            const autoResult = router.run({
              command: step.command,
              state,
              projectRoot: process.cwd()
            });

            autopilotResults.push({
              command: step.command,
              reason: step.reason,
              result: autoResult
            });

            if (!autoResult.ok) {
              break;
            }

            if (autoResult.stageAfter && autoResult.stageAfter !== state.stage) {
              const nextStatus =
                autoResult.statusAfter && autoResult.statusAfter !== state.status
                  ? autoResult.statusAfter
                  : undefined;

              state = await stateManager.markStage(autoResult.stageAfter, nextStatus);
            }

            if (autoResult.artifactsCreated.length > 0) {
              state = await stateManager.addArtifacts(autoResult.artifactsCreated);
            }
          }
        }

        // Generate checkpoint summary if autopilot ran
        if (autopilotPlan && autopilotResults.length > 0) {
          const summary = autopilotConductor.generateCheckpointSummary(
            autopilotPlan.checkpointAfter,
            autopilotPlan.mission,
            autopilotResults.flatMap((r: any) => r.result?.artifactsCreated ?? []),
            autopilotPlan.confidence,
            autopilotPlan.mode
          );
          printSection("Checkpoint Summary");
          console.log(summary);
        }

        printSection("VDD run");
        printJson({
          parsed,
          result,
          ...(autopilotPlan ? {
            autopilotPlan: {
              mode: autopilotPlan.mode,
              mission: autopilotPlan.mission,
              checkpointBefore: autopilotPlan.checkpointBefore,
              checkpointAfter: autopilotPlan.checkpointAfter,
              continueAutomatically: autopilotPlan.continueAutomatically,
              summary: autopilotPlan.summary,
              confidence: {
                level: autopilotPlan.confidence.level,
                decision: autopilotPlan.confidence.decision,
                score: autopilotPlan.confidence.score,
                maxScore: autopilotPlan.confidence.maxScore,
                signals: autopilotPlan.confidence.signals,
                assumptionRisks: autopilotPlan.confidence.assumptionRisks,
                blockingUncertainties: autopilotPlan.confidence.blockingUncertainties
              },
              pauseDecision: autopilotPlan.pauseDecision,
              questions: autopilotPlan.questions,
              humanNextStep: autopilotPlan.humanNextStep
            }
          } : {}),
          ...(autopilotResults.length > 0 ? { autopilot: autopilotResults } : {}),
          state: state ?? (await stateManager.load())
        });
        return;
      }

      if (parsed.normalized === "/vibe.init") {
        if (!state) {
          state = await stateManager.init();
        }

        const result = router.run({
          command: parsed.normalized,
          state,
          args: parsed.args,
          projectRoot: process.cwd()
        });

        printSection("VDD run");
        printJson({
          parsed,
          result,
          state: await stateManager.load()
        });
        return;
      }

      if (!state) {
        console.log(chalk.red("No project state found."));
        console.log("Run `vdd start` or `vdd init` first.");
        process.exitCode = 1;
        return;
      }

      const result = router.run({
        command: parsed.normalized,
        state,
        args: parsed.args,
        projectRoot: process.cwd()
      });

      if (!result.ok) {
        printSection("VDD run blocked");
        printJson({
          parsed,
          result
        });
        process.exitCode = 1;
        return;
      }

      if (result.stageAfter && result.stageAfter !== state.stage) {
        const nextStatus =
          result.statusAfter && result.statusAfter !== state.status
            ? result.statusAfter
            : undefined;

        state = await stateManager.markStage(result.stageAfter, nextStatus);
      }

      if (result.artifactsCreated.length > 0) {
        state = await stateManager.addArtifacts(result.artifactsCreated);

        if (
          parsed.normalized === "/vibe.scaffold" &&
          result.artifactsCreated.some((artifact) => artifact === "PRD.full.md" || artifact === "PRD.draft.md")
        ) {
          const selectedPrdArtifact = result.artifactsCreated.includes("PRD.full.md")
            ? "PRD.full.md"
            : "PRD.draft.md";

          state = await stateManager.update((current) => ({
            ...current,
            artifacts: current.artifacts.filter(
              (artifact) =>
                artifact !== "PRD.full.md" &&
                artifact !== "PRD.draft.md" ||
                artifact === selectedPrdArtifact
            )
          }));
        }
      }

      if (parsed.normalized === "/vibe.qa") {
        state = await stateManager.setHandoffReady(true);
      }

      if (parsed.normalized === "/vibe.handoff-to-spec") {
        state = await stateManager.markStage("handoff", "completed");
      }

      if (parsed.normalized === "/vibe.scaffold") {
        // Actually generate the files
        console.log(chalk.cyan("Writing bootstrap artifacts..."));
        const targetDir = process.cwd();
        const templatesDir = path.resolve(__dirname, "../../../templates/bootstrap");
        const templateOverrides: Record<string, string> = {
          "PRD.full.md": "PRD.full.md",
          "PRD.draft.md": "PRD.draft.md"
        };
        
        for (const file of result.artifactsCreated) {
          const templateName = templateOverrides[file] ?? file;
          const srcPath = path.join(templatesDir, templateName);
          const destPath = path.join(targetDir, file);
          if (await fs.pathExists(srcPath)) {
            await fs.copy(srcPath, destPath, { overwrite: false });
            console.log(chalk.green(`  ✓ Created ${file}`));
          } else {
            console.log(chalk.yellow(`  ⚠ Template for ${file} not found, skipping.`));
          }
        }
      }

      printSection("VDD run");
      printJson({
        parsed,
        result,
        state
      });
    } catch (error) {
      console.error(chalk.red("Fatal run error"));

      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error");
      }

      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(chalk.red("Fatal CLI error"));

  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  console.error("Unknown error");
  process.exit(1);
});
