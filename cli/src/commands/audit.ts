#!/usr/bin/env node

/**
 * Vibe Driven Dev — Code Audit Command
 *
 * Thin CLI wrapper that delegates to core/audit/ modules.
 *
 * Usage:
 *   vdd audit
 *   vdd audit --focus architecture
 *   vdd audit --focus testing
 *   vdd audit --focus security
 *   vdd audit --focus performance
 *   vdd audit --focus events
 *   vdd audit --focus accessibility
 *   vdd audit --mode report
 *   vdd audit --mode fix-plan
 *   vdd audit --mode sprints
 */

import path from "node:path";
import chalk from "chalk";
import type { AuditOptions, AuditFocus, AuditMode } from "../../../core/audit/types.js";
import { runFullAudit } from "../../../core/audit/codebase-auditor.js";

const VALID_FOCUSES = ["architecture", "testing", "security", "performance", "events", "accessibility"];
const VALID_MODES = ["report", "fix-plan", "sprints", "full"];

export async function runAuditCommand(options: {
  focus?: string;
  mode?: string;
  verbose?: boolean;
}): Promise<void> {
  // Validate options
  const focus: AuditFocus | undefined =
    options.focus && VALID_FOCUSES.includes(options.focus)
      ? (options.focus as AuditFocus)
      : undefined;

  if (options.focus && !focus) {
    console.error(chalk.red(`Invalid focus: ${options.focus}`));
    console.error(chalk.gray(`Valid values: ${VALID_FOCUSES.join(", ")}`));
    process.exitCode = 1;
    return;
  }

  const mode: AuditMode =
    options.mode && VALID_MODES.includes(options.mode)
      ? (options.mode as AuditMode)
      : "full";

  const auditOptions: AuditOptions = { focus, mode, verbose: options.verbose };

  const repoPath = process.cwd();

  try {
    console.log(chalk.bold.cyan("\n 🔍 Code Audit in Progress...\n"));

    // Run the full audit pipeline
    const result = await runFullAudit(repoPath, auditOptions);

    const { outputDir, files, report } = result;
    const { metadata, profile, issues, riskLevel } = report;

    // Display summary
    console.log(chalk.green(`  ✓ Detected: ${profile.type} project`));
    console.log(
      chalk.green(`  ✓ Applied ${metadata.rulesetsApplied.length} rule packs`)
    );
    console.log(chalk.green(`  ✓ Found ${metadata.totalIssues} issues`));
    console.log(chalk.green(`  ✓ Generated ${files.length} output files`));

    // Risk assessment
    const riskEmoji: Record<string, string> = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    };
    console.log(
      chalk.bold(
        `\n ${riskEmoji[riskLevel] ?? "⚪"} Overall Risk: ${riskLevel.toUpperCase()}`
      )
    );

    // Issue breakdown
    if (metadata.critical > 0) {
      console.log(chalk.red(`   🔴 ${metadata.critical} critical`));
    }
    if (metadata.high > 0) {
      console.log(chalk.yellow(`   🟠 ${metadata.high} high`));
    }
    if (metadata.medium > 0) {
      console.log(chalk.cyan(`   🟡 ${metadata.medium} medium`));
    }
    if (metadata.low > 0) {
      console.log(chalk.gray(`   🔵 ${metadata.low} low`));
    }

    // Top issues preview
    if (issues.length > 0) {
      console.log(chalk.bold("\n 📋 Top Issues:\n"));
      for (const issue of issues.slice(0, 5)) {
        const emoji = riskEmoji[issue.severity] ?? "⚪";
        console.log(`   ${emoji} ${issue.id}: ${issue.title}`);
        console.log(chalk.gray(`      ${issue.evidence[0]?.pattern ?? ""}`));
      }
    }

    // Output files
    const relOutputDir = path.relative(repoPath, outputDir);
    console.log(chalk.bold.cyan(`\n 📁 Results saved to: ${chalk.bold(relOutputDir)}\n`));
    for (const file of files) {
      console.log(`   - ${path.relative(repoPath, file)}`);
    }

    // Next steps
    console.log(chalk.yellow("\n 📖 Next steps:"));
    console.log(`   1. Review Audit-Report.md for executive summary`);
    console.log(`   2. Review Sprint-Plan.md for execution order`);
    console.log(`   3. Assign Sprint 1 issues to team\n`);
  } catch (error) {
    console.error(chalk.red(`\n ❌ Audit failed: ${error}\n`));
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}
