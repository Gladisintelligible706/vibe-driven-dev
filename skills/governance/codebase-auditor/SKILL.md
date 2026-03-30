---
name: codebase-auditor
description: >
  Scan a repository against curated coding standards and produce a structured audit report,
  issue set, refactor plan, and sprint-based remediation roadmap. Use when the user invokes
  /vibe.audit or asks to review the codebase against established rules. Operates in full
  autopilot mode from repository scan to sprint plan output.
category: governance
stage: cross-stage
version: 0.1.0
triggers:
  - /vibe.audit
  - audit the codebase
  - review the code against our standards
  - scan for violations
  - code quality review
  - technical debt assessment
  - find issues in the codebase
flags:
  - "--focus architecture"
  - "--focus testing"
  - "--focus security"
  - "--focus performance"
  - "--focus events"
  - "--focus accessibility"
  - "--mode report"
  - "--mode fix-plan"
  - "--mode sprints"
inputs:
  required:
    - repository root path (or current working directory)
  optional:
    - architecture_baseline (if VDD artifacts exist)
    - vdd_state (if .vdd/state.json exists)
    - focus_area (from --focus flag)
    - audit_mode (from --mode flag)
outputs:
  - .vdd/audits/<timestamp>/Audit-Report.md
  - .vdd/audits/<timestamp>/Audit-Issues.json
  - .vdd/audits/<timestamp>/Refactor-Plan.md
  - .vdd/audits/<timestamp>/Sprint-Plan.md
  - .vdd/audits/<timestamp>/Rule-Coverage.md (optional)
authority:
  final: staff-engineering
compatibility:
  core: "0.1.x"
  skill_schema: "1.x"
rule_source_dir: >
  skills/governance/codebase-auditor/references/
  (symlinked or copied from coding-standards-skill/skills/coding-standards-enforcer/references/)
---

# Codebase Auditor

## Purpose

This skill drives the `/vibe.audit` command.

It turns curated coding standards into an operational review system.

The goal is to let the AI coding agent perform a full repository audit in autopilot mode — scanning the codebase, selecting the right rule packs, comparing code patterns against those rules, generating structured issues with evidence, and producing an actionable sprint-based remediation plan.

The output should feel like a **technical staff engineer audit**, not a lint dump.

---

## Core Rule

Do not produce noise. Produce judgment.

Every issue must be backed by evidence. Every finding must explain why it matters. Every remediation suggestion must be concrete and ordered.

---

## Autopilot Execution Flow

Run these phases in order. Do not skip phases. Do not require user input between phases unless a halt condition is reached.

---

### Phase 1 — Understand the Repository

Before applying any rule, understand what kind of project this is.

**Inspect the following:**

- root directory structure
- `package.json`, `pyproject.toml`, `cargo.toml`, or equivalent manifest
- key import patterns across source files
- presence of frontend frameworks (React, Next.js, Vue, Svelte)
- presence of backend frameworks (Express, FastAPI, Django, NestJS)
- presence of AI or LLM integrations
- presence of authentication systems
- presence of background jobs, queues, or workers
- presence of analytics or tracking hooks
- presence of a test directory and test files
- presence of a design system or styling tokens
- whether the project is a monorepo
- whether VDD artifacts exist (`.vdd/state.json`, `architecture-baseline.md`)
- whether this is a greenfield or brownfield repository

**Produce a repo shape summary:**

```
Project Type: [frontend-heavy | backend-heavy | full-stack | AI-native | mixed]
Languages: [list]
Frameworks: [list]
Has Auth: [yes | no | unclear]
Has Tests: [yes | minimal | no]
Has Design System: [yes | partial | no]
Has Event Patterns: [yes | partial | no]
Has Analytics: [yes | partial | no]
Has AI Features: [yes | no]
Is Monorepo: [yes | no]
Greenfield or Brownfield: [greenfield | brownfield]
VDD Artifacts Available: [yes | no]
```

---

### Phase 2 — Select Rule Packs

Do not apply every ruleset. Select based on the repo shape from Phase 1.

**Always apply these:**

- `master-rules.json`
- `testing.rules.json`
- `error-handling.rules.json`
- `dependency-architecture.rules.json`
- `circular-dependency.rules.json`
- `regression-prevention.rules.json`

**Apply if frontend-heavy or component-based:**

- `ui-ux-engineering.rules.json`
- `accessibility.rules.json`
- `component-modularity.rules.json`
- `styling-tokens.rules.json`
- `defensive-rendering.rules.json`
- `assets-handling.rules.json`
- `libraries-usage.rules.json`

**Apply if AI-native or workflow-heavy:**

- `memory-and-lifecycle.rules.json`
- `incremental-intelligence-architecture.rules.json`
- `tracking-standards.rules.json`

**Apply if security-sensitive (auth, payments, personal data):**

- `security-privacy.rules.json`
- `environment-consistency.rules.json`
- `api-consistency.rules.json`

**Apply if performance-sensitive (customer-facing, high-traffic):**

- `performance.rules.json`

**Apply if TypeScript or strongly-typed:**

- `type-system.rules.json`
- `path-resolution.rules.json`

**Record the selected rule packs and the rationale for each selection.**

---

### Phase 3 — Load and Parse Rule Packs

For each selected rule pack:

1. Read the rule file from the reference directory
2. Parse the rules and their enforcement criteria
3. Understand what the rule is looking for and what constitutes a violation
4. Note the severity weight each rule assigns to violations

Reference all rule files from:

```
skills/governance/codebase-auditor/references/
```

If a referenced file is missing, note the gap in `Rule-Coverage.md` and continue with available rules.

---

### Phase 4 — Scan and Compare

Scan the codebase and compare patterns against the selected rules.

**What to look at:**

- file and directory structure (architecture and layering)
- import and dependency graphs (circular deps, direction violations)
- component shapes and sizes (SRP, modularity)
- state management patterns (lifecycle, memory leaks)
- async and event patterns (side effects, ownership)
- test file presence, shape, and coverage indicators
- error handling patterns (propagation, recovery, logging)
- typing patterns (any usage, missing guards)
- environment and secrets handling
- analytics and tracking call patterns
- accessibility attributes and landmark usage
- styling approach (tokens vs ad-hoc values)
- API shape and naming consistency

**For each comparison:**

- determine whether the rule is satisfied, violated, or not applicable
- if violated: collect specific evidence (file path, pattern, description)
- if not applicable: note why and record in Rule-Coverage.md

---

### Phase 5 — Generate Issues

For each violation found, generate a structured issue.

**Issue format:**

```json
{
  "issue_id": "AUD-001",
  "title": "Concise, specific description of the problem",
  "severity": "critical | high | medium | low",
  "category": "architecture | modularity | testing | security | accessibility | performance | api | events | typing | styling | environment | dependencies",
  "rule_source": "filename.rules.json",
  "why_it_matters": "1-2 sentences explaining the real impact on the project",
  "evidence": [
    "path/to/file.ts: specific pattern or violation observed",
    "path/to/other.ts: related violation confirming the pattern"
  ],
  "affected_files": ["path/to/file.ts", "path/to/other.ts"],
  "suggested_remediation": "Concrete, actionable direction for fixing this",
  "sprint_recommendation": 1,
  "dependency_notes": "Does this need to be resolved before other issues? Which ones?"
}
```

**Severity assignment guide:**

- **Critical**: Immediate structural or risk issue. Threatens correctness, security, or maintainability right now.
- **High**: Should be addressed early. Blocks scalability or safe iteration if left alone.
- **Medium**: Meaningful quality gap. Should be planned, does not block immediate progress.
- **Low**: Useful improvement. Can wait for a polish sprint.

**Evidence rule:** If you cannot point to a specific file or pattern, do not include the issue. Vague findings destroy audit credibility.

---

### Phase 6 — Group Into Workstreams

Group issues into workstreams before creating the sprint plan.

| Workstream | What it covers |
|---|---|
| Architecture Cleanup | Dependency violations, layer breaks, structural anti-patterns |
| Event and Lifecycle | Async side effects, event ownership, lifecycle clarity |
| Testing Foundation | Missing tests, coverage gaps, unreliable patterns |
| Dependency Hygiene | Circular imports, version issues, unsafe packages |
| Security Hardening | Auth gaps, env leaks, data handling issues |
| UI and Accessibility | Component quality, WCAG, ARIA, keyboard navigation |
| Performance | Bundle, render, network, runtime efficiency |
| API and Environment | Contract consistency, config hygiene |
| Modularity and Coupling | SRP violations, tight coupling, missing boundaries |
| Type Safety | TypeScript gaps, `any` usage, missing type guards |

---

### Phase 7 — Build Sprint Plan

Assign each issue to a sprint based on severity, dependency order, and architectural leverage.

**Sprint 1 — Blockers and High Risk**  
Critical and high-severity issues with the largest blast radius or dependency chains.  
If left unfixed, Sprint 2 and 3 work will be unstable or require rework.

**Sprint 2 — Structural Improvements**  
Issues that unlock maintainability and reduce future change cost.  
Fixes here should make the codebase safer to iterate on.

**Sprint 3 — Quality, Polish, and Consistency**  
Medium and low-severity issues.  
Improvements that raise quality and reduce technical debt without unblocking anything critical.

**Sprint grouping must be defensible.** For each sprint, explain why these issues belong together and why they come before the next sprint.

---

### Phase 8 — Write Output Artifacts

Write all four required artifacts. Use the output directory:

```
.vdd/audits/<ISO-timestamp>/
```

---

#### `Audit-Report.md` — Executive Summary

Structure:

```markdown
# Audit Report — [Project Name or Directory]
**Date:** [ISO date]  
**Rulesets Applied:** [count]  
**Issues Found:** [count by severity]

## Repository Shape
[Summary from Phase 1]

## Rulesets Applied
[List with rationale for each selected pack]

## Top Risks
[Top 3-5 critical and high issues in plain language]

## Strengths Observed
[What the codebase does well — be honest, include real positives]

## Issues by Severity
| Severity | Count |
|---|---|
| Critical | N |
| High | N |
| Medium | N |
| Low | N |

## Recommendation Summary
[2-4 sentences telling the user what to do next and whether the codebase is safe to keep building on as-is]
```

---

#### `Audit-Issues.json` — Machine-Readable Issue Set

```json
{
  "audit_id": "<timestamp>",
  "project": "<directory or name>",
  "rulesets_applied": ["list"],
  "generated_at": "<ISO timestamp>",
  "issues": [
    { ... issue objects ... }
  ],
  "summary": {
    "critical": N,
    "high": N,
    "medium": N,
    "low": N,
    "total": N
  }
}
```

---

#### `Refactor-Plan.md` — Grouped Remediation Plan

Structure:

```markdown
# Refactor Plan — [Project Name]

## Overview
[1 paragraph: what this plan addresses and why]

## Workstream 1: [Name]
**Why this matters:** [Impact statement]  
**Issues covered:** [AUD-001, AUD-003...]  
**Dependencies:** [Does this need to come before another workstream?]  
**Suggested approach:** [Concrete direction]

[Repeat for each active workstream]

## Dependency Map
[Summary of which fixes must precede others]
```

---

#### `Sprint-Plan.md` — Prioritized Execution Roadmap

Structure:

```markdown
# Sprint Plan — [Project Name]

## Sprint 1: Blockers and High Risk
**Goal:** [What completion of Sprint 1 achieves]

| Issue ID | Title | Severity | Workstream |
|---|---|---|---|
| AUD-001 | ... | Critical | Architecture |

**Why these issues come first:** [Rationale]

---

## Sprint 2: Structural Improvements
**Goal:** [What completion of Sprint 2 achieves]

[Table of issues]

**Why these come after Sprint 1:** [Rationale]

---

## Sprint 3: Quality and Polish
**Goal:** [What completion of Sprint 3 achieves]

[Table of issues]

---

## Sprint Dependencies
[Any cross-sprint blockers noted here]
```

---

#### `Rule-Coverage.md` — Optional Coverage Map

```markdown
# Rule Coverage Report — [Project Name]

## Applied Rulesets
| Ruleset | Applied | Issues Found | Reason for Application |
|---|---|---|---|

## Excluded Rulesets
| Ruleset | Excluded | Reason |
|---|---|---|

## Coverage Notes
[Any gaps in coverage due to missing rule files or language limitations]
```

---

## Halt Conditions

Stop and ask the user before continuing if:

- the repository root cannot be determined
- the codebase is too large for an honest full scan without scoping (recommend `--focus`)
- no rule files are accessible in the references directory
- the project type is completely ambiguous and would require guessing

Do not silently skip phases or produce partial output without noting what was skipped and why.

---

## If `--focus <area>` Is Provided

Run only Phases 1, 2 (filtered), 3, 4, 5, 6, 7, 8.

Phase 2 selects only rule packs relevant to the focus area:

| Focus | Rule Packs |
|---|---|
| `architecture` | `master-rules.json`, `dependency-architecture.rules.json`, `circular-dependency.rules.json` |
| `testing` | `testing.rules.json`, `regression-prevention.rules.json` |
| `security` | `security-privacy.rules.json`, `environment-consistency.rules.json`, `api-consistency.rules.json` |
| `performance` | `performance.rules.json` |
| `events` | `tracking-standards.rules.json`, `memory-and-lifecycle.rules.json`, `dependency-architecture.rules.json` |
| `accessibility` | `accessibility.rules.json`, `ui-ux-engineering.rules.json` |

Sprint Plan is still produced even in focused mode.

---

## Safety Rule

Do not edit any source file during this skill.

This skill reads. It reports. It plans.

No mutation of the codebase is permitted.

---

## Quality Expectation

The output should feel like something a senior engineer wrote after spending real time in the codebase.

It should not feel like a formatted lint report.

The difference is judgment:
- knowing which issues matter most
- knowing which issues are symptoms of a deeper structural problem
- knowing the right order to fix things
- explaining why each issue matters in the context of this specific project
