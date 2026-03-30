---
name: skill-bootstrapper
description: Automatically discover, recommend, and install external skills from the open skills ecosystem after user intent is captured. Orchestrates find-skills installation, discovery queries, scoring, and phased install planning.
category: advisor
stage: any
version: 0.1.0
triggers:
  - /vibe.skills-bootstrap
  - auto-after-onboarding
  - auto-after-init
  - auto-after-plan
  - auto-after-scaffold
inputs:
  required:
    - project_state
    - project_root
  optional:
    - runtime
    - agent
    - max-install
    - autopilot
outputs:
  - skill-recommendations
  - skill-install-plan
  - skill-roadmap
  - bootstrap-readiness
  - user-summary
  - install-commands
state_effect: read
authority:
  final: orchestrator
compatibility:
  core: "0.1.x"
  skill_schema: "1.x"
---

# Skill Bootstrapper

## Purpose

Automatically equip the coding agent with the right external skills once VDD understands the project.

This skill is the auto-execution layer on top of the skill-recommender. While `/vibe.skills` is an advisory command, this skill runs the full bootstrap flow:

1. check readiness
2. detect runtime
3. **install find-skills** from the open skills ecosystem via CLI
4. build project profile
5. generate discovery queries
6. **run live discovery** against skills.sh via find-skills CLI
7. recommend and score skills (merged catalog + CLI results)
8. build a phased install plan
9. **execute Phase A installs** via Skills CLI
10. generate documentation artifacts
11. produce a user-facing summary

## When to Use

Use this skill when:

- user intent is captured (problem statement, target user, success definition exist)
- project type is identified or reasonably inferred
- runtime or target agent is detected or strongly inferred
- enough gaps are visible to justify external skills discovery
- the user is non-technical and benefits from automatic setup
- the project is entering a phase with clear specialized needs

Trigger moments:

- after onboarding completes (`/vibe.start`)
- after `/vibe.init`
- after `/vibe.plan`
- after `/vibe.scaffold`
- when the project moves into a phase with clear specialized needs

## When Not to Use

Do not use this skill when:

- the project context is too weak (no problem statement, no project type)
- the user explicitly wants manual control over every skill decision
- the runtime cannot be detected and no safe generic fallback exists
- the user is asking only for an advisory shortlist without installation

## Readiness Check

Before running the bootstrap flow, evaluate:

| Signal | Required | Weight |
|---|---|---|
| User intent captured | Yes | 30% |
| Project type identified | Yes | 20% |
| Runtime detected | Preferred | 25% |
| Gaps visible | Preferred | 25% |

Minimum confidence threshold: 0.5

If confidence is below threshold:

- **0.3–0.5**: defer — provide advisory output only, do not install
- **< 0.3**: block — inform user that more project context is needed

## Runtime Detection

Detect the active coding agent runtime from:

- `.claude/agents`, `.claude/skills` → Claude Code
- `.codex/skills` → Codex
- `.cursor/rules` → Cursor
- `.windsurf/rules` → Windsurf
- `opencode.json` / `opencode.jsonc` → OpenCode
- `.gemini/commands`, `.gemini/extensions` → Gemini CLI
- Fallback → generic AGENTS.md mode

Use the detected runtime to:

- target `--agent` flag in install commands
- select project-local installation scope by default
- fall back cleanly when runtime certainty is weak

## Find-Skills CLI Integration

The bootstrap flow executes real CLI commands. The sequence is:

### Step 1: Install find-skills

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent <detected-agent> -y
```

This installs the discovery skill from the vercel-labs/skills repository. The `--agent` flag targets the detected runtime. The `-y` flag skips interactive confirmation.

If find-skills installation fails, the system falls back to catalog-based recommendations only.

### Step 2: Run discovery queries

```bash
npx skills find <query>
```

For each query generated from the project profile, the system runs a live search against the skills ecosystem. Results are parsed into structured skill entries and deduplicated.

### Step 3: Install Phase A skills

```bash
npx skills add <owner>/skills --skill <skill-name> --agent <detected-agent> -y
```

Only Phase A (install-now) skills are installed automatically. Phase B and C skills are documented in the roadmap for later installation.

### CLI Output Parsing

The executor handles multiple output formats:
- JSON arrays (if CLI supports structured output)
- Line-by-line "owner/skill-name — description" format
- Line-by-line "owner/skill-name: description" format
- Line-by-line "owner/skill-name" format (no description)

## Discovery Query Generation

Generate search queries from the project profile based on:

### Gap Categories

- planning
- design
- frontend
- backend
- auth
- database
- testing
- debugging
- performance
- security
- MCP
- docs
- deployment
- AI integration
- product polish

### Stack-Specific Queries

| Stack Signal | Queries |
|---|---|
| Next.js | `nextjs`, `react performance` |
| React (no Next) | `react testing` |
| AI features | `ai agent`, `mcp`, `prompt engineering` |
| Auth needed | `auth best practices`, `security` |
| Database | `database` |
| Design-sensitive | `web design`, `accessibility` |
| Performance-sensitive | `performance` |
| Wrapper app | `tool calling` |

### Universal Queries

Always include:

- `systematic debugging`
- `testing`
- `pr review`

### Stage-Dependent Queries

| Stage | Queries |
|---|---|
| init | `project setup` |
| plan | `spec writing`, `requirements` |
| research | `architecture` |
| blueprint | `design system`, `system design` |
| detail | `code review` |
| scaffold | `deployment`, `ci cd` |
| qa | `e2e testing`, `playwright` |
| handoff | `changelog`, `release notes` |

## Scoring Model

Each discovered skill is scored on:

| Dimension | Weight |
|---|---|
| Project fit | 30% |
| Runtime compatibility | 20% |
| Stack fit | 15% |
| Install signal | 15% |
| Source quality | 10% |
| Overlap penalty | -10% |

Overlapping skills (already installed or covered) receive a penalty.

## Phased Installation Model

Skills are classified into phases:

### Phase A — Install Now

- debugging
- testing
- planning
- docs
- Skills addressing urgent gaps (auth, security, MCP, AI) with score >= 50

### Phase B — Install at Scaffold

- auth
- design
- MCP
- deployment
- security
- frontend
- backend
- AI integration

### Phase C — Defer for Later

- performance
- product polish
- database
- PR review
- changelog generation

## Installation Safety Rules

- install max 3 skills automatically in the first pass
- prefer project-local installation by default
- use `--agent <detected-agent>` when runtime is known
- never install skills that duplicate already-installed capabilities
- defer everything else into Skill-Roadmap.md

## Canonical Install Command

```bash
npx skills add <owner>/skills --skill <skill-name> --agent <detected-agent> -y
```

For find-skills specifically:

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent <detected-agent> -y
```

## Documentation Artifacts

The skill generates three files:

### Skill-Recommendations.md

Human-readable explanation of what was found, what was installed, and why.

### Skill-Install-Plan.md

Exact install sequence with:

- detected runtime
- installation scope
- search queries used
- shortlisted skills with scores
- install commands
- phase classification

### Skill-Roadmap.md

Skills queued for future phases with:

- scaffold-phase skills
- post-scaffold / mature-phase skills
- project gaps these skills address

## User-Facing Summary

When bootstrap completes, explain in plain language:

1. what the project seems to need
2. what was installed now
3. why these skills matter
4. what will improve because of them
5. what skills are queued for later
6. what the next VDD step is

Example:

> I understand the kind of project you want to build. Before we go further, I'll equip your coding agent with a few extra skills that fit this project.
>
> **Installing now:** systematic-debugging, test-driven-development, find-skills
> **Why:** Your project needs stronger support in testing, debugging, and planning.
> **Queued for later:** 3 additional skills are in the roadmap for when the project enters the scaffold phase.
>
> This keeps the setup focused and avoids clutter.

## Failure Handling

If any part of the bootstrap fails:

- say clearly what failed
- preserve the current project state
- avoid partial silent installation claims
- produce an install-plan fallback
- continue the core VDD workflow when possible

Specific failures:

| Failure | Response |
|---|---|
| Runtime detection fails | Fall back to generic install planning |
| find-skills install fails | Fall back to catalog-only recommendations, produce manual install guidance |
| find-skills search fails | Use catalog-based discovery only, document failed queries |
| CLI install of a Phase A skill fails | Record failure, continue with remaining installs, note in artifacts |
| Search quality is weak | Produce recommendation-only mode |
| No skills match | Explain why and suggest next steps |
| CLI timeout | Cancel query, continue with remaining queries, note timeout in output |

## Autopilot Policy

Auto skill bootstrap is allowed in autopilot mode only when:

- runtime confidence is "high" or "medium"
- project profile confidence >= 0.5
- the skill clearly improves the current phase
- overlap is low
- the total automatic install count remains small

Otherwise, VDD should:

- recommend
- explain
- wait for approval

## Halt Conditions

This skill must halt or degrade gracefully when:

- no credible project signals exist
- runtime detection is unavailable and no safe generic fallback exists
- the candidate catalog is empty
- the system cannot distinguish installed skills from new skills at all

In a degraded case, return:

- what is missing
- what safe fallback is still possible

## Handoff Behavior

After successful completion:

- do not mutate project state
- return structured install plan that the orchestrator can present
- write artifacts to project root
- recommend the next best action such as:
  - review Skill-Recommendations.md
  - continue the current VDD workflow
  - run `/vibe.skills` later for refresh
