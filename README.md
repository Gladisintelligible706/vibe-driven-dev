# Vibe Driven Dev

**Build fast. Think clearly. Hand off cleanly.**

![Status](https://img.shields.io/badge/status-active-2563eb?style=flat-square)
![Stage](https://img.shields.io/badge/stage-pre--execution-7c3aed?style=flat-square)
![License](https://img.shields.io/github/license/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D20-5fa04e?style=flat-square&logo=nodedotjs&logoColor=white)
![Runtime](https://img.shields.io/badge/runtime-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![npm version](https://img.shields.io/npm/v/vibe-driven-dev?style=flat-square&logo=npm&logoColor=white)
![Stars](https://img.shields.io/github/stars/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Issues](https://img.shields.io/github/issues/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Codex](https://img.shields.io/badge/target-Codex-111827?style=flat-square)
![Claude Code](https://img.shields.io/badge/target-Claude%20Code-d97706?style=flat-square)
![Gemini CLI](https://img.shields.io/badge/target-Gemini%20CLI-1d4ed8?style=flat-square)

Vibe Driven Dev is the **pre-execution layer for AI coding agents**.
It helps founders, product builders, vibe coders, and teams move from a vague idea to a structured, execution-ready project.

Instead of starting with scattered prompts and jumping straight into code, VDD helps you:

- understand what you are actually building
- define the scope before implementation drifts
- create durable project artifacts instead of hiding the logic in chat history
- choose the right stack and AI provider for the product itself
- prepare a clean handoff into implementation systems such as Spec Kit
- audit an existing codebase and turn problems into a repair plan

## Source of truth

Use this repository as the source of truth for what VDD is, how it installs, and how the workflow should run.

- [Repository](https://github.com/OpenOps-Studio/vibe-driven-dev)
- [INSTALL.md](./INSTALL.md)
- [USAGE.md](./USAGE.md)
- [AGENTS.md](./AGENTS.md)

## What VDD is

VDD is not a linter, not a one-shot prompt pack, and not a replacement for implementation tools.

It is the operating layer that runs **before broad implementation begins**.

It exists because most vibe coding failures come from one root problem:

**people start generating code before they have enough structure.**

That usually creates:

- weak scope
- fragile architecture
- hidden assumptions
- stale dependency choices
- poor AI provider decisions
- chaotic project setup
- unusable handoff before execution

VDD slows down the right part and speeds up the useful part.

## Who VDD is for

- founders building MVPs or PoCs
- product innovators working with AI coding agents
- non-technical builders who need guidance in plain language
- developers who want a safer pre-execution workflow
- teams that want stronger handoff discipline before implementation starts

## Quick start

Install globally:

```bash
npm install -g vibe-driven-dev
```

Or run it without a global install:

```bash
npx vibe-driven-dev install claude-code --project
```

Then verify the environment and start the workflow:

```bash
vdd doctor
vdd run /vibe.start
```

For full setup details, see [INSTALL.md](./INSTALL.md).

## Human Guide

This section is for people who want to understand **how to use VDD step by step**.

### Step 1: Start with your idea

You do **not** need to begin with technical language.

A good starting input is something like:

> I want to build an AI tool that helps small businesses write better sales emails and follow-up messages.

VDD should take that raw idea, ask a few smart questions, and help shape it into a real project.

### Step 2: Let VDD guide the intake

The recommended entrypoint is:

```bash
vdd run /vibe.start
```

A good coding agent should then:

- start guided onboarding in plain language
- ask a small number of useful questions
- build each next question from your previous answer
- stop asking once it understands the project well enough
- move automatically into the first valid workflow step

### Step 3: Let VDD build the project truth

After the intake, VDD should begin creating the durable artifacts that define the project properly.

That means it should help generate things like:

- PRD files
- scope and logic documents
- technical and execution decisions
- implementation planning artifacts
- audit and remediation artifacts when needed

### Step 4: Use the next step VDD suggests

You should not have to memorize the full command set.

A good VDD-driven agent should always tell you:

- what it just did
- what it learned
- what stage the project is in
- what the next best step is
- whether it can continue automatically or needs your approval

## Workflow Guide

VDD works in stages.

The user-facing mental model should feel like:

1. understand the idea
2. structure the project
3. lock the technical direction
4. prepare the execution package
5. begin implementation from solid ground

### Main commands

| Command | What it does | Why it matters |
| --- | --- | --- |
| `/vibe.start` | Beginner-friendly entrypoint that begins onboarding and routes into the right early steps. | Best starting point for humans and coding agents. |
| `/vibe.init` | Captures the project intent, audience, scope seed, and success direction. | Turns a vague idea into usable project state. |
| `/vibe.plan` | Shapes the problem statement, product direction, and delivery logic. | Stops the project from becoming feature soup. |
| `/vibe.research` | Checks assumptions, feasibility, dependencies, and external constraints. | Catches weak assumptions before they become expensive mistakes. |
| `/vibe.blueprint` | Produces system direction, architecture shape, and major technical choices. | Creates technical clarity before deeper implementation work. |
| `/vibe.detail` | Expands the blueprint into implementation-level detail. | Makes the project easier to build consistently. |
| `/vibe.scaffold` | Generates the bootstrap and execution-readiness artifacts. | Gives the project a real foundation instead of relying on chat memory. |
| `/vibe.audit` | Scans the repo against canonical rules and generates issues, remediation plans, and sprint groupings. | Helps rescue or improve existing codebases with structure. |
| `/vibe.qa` | Reviews readiness, risks, quality gates, and handoff integrity. | Prevents shallow or dishonest “we are ready” claims. |
| `/vibe.handoff-to-spec` | Packages the project for downstream execution systems such as Spec Kit. | Creates a cleaner transition into implementation workflows. |

### Supporting commands

These commands are not usually the first commands you run.
They are helper commands that keep the workflow moving when you need clarity, recovery, or explicit decisions.

| Command | When to use it | What it helps with |
| --- | --- | --- |
| `/vibe.next` | Use it when you are not sure what should happen next. | Suggests the next best step based on the current stage, existing artifacts, and open gaps. |
| `/vibe.resume` | Use it when the chat was interrupted, the coding agent lost context, or you are returning later. | Reconstructs the current project state and helps the agent continue from the correct point instead of restarting or guessing. |
| `/vibe.status` | Use it when you want a fast project snapshot. | Shows where the project currently stands, what artifacts already exist, what is still missing, and what is blocking progress. |
| `/vibe.assumptions` | Use it when you want to inspect or challenge what the system is currently assuming. | Surfaces hidden assumptions, uncertain decisions, and places where VDD is moving forward with partial confidence. |
| `/vibe.decide` | Use it when there is a real fork in the road and a human decision is needed. | Helps compare options such as stack direction, provider choice, architecture style, or scope tradeoffs before the system proceeds. |

### Quick examples

```bash
# I do not know what the next step should be
vdd run /vibe.next

# We stopped yesterday and I want the agent to continue cleanly
vdd run /vibe.resume

# I want a snapshot of the current project state
vdd run /vibe.status

# I want to see what assumptions VDD is currently making
vdd run /vibe.assumptions

# I need help choosing between two meaningful directions
vdd run /vibe.decide
```

### Simple mental model

- Use the **main commands** to move the project forward.
- Use the **supporting commands** to recover context, inspect the state, surface uncertainty, and make better decisions.

If you are unsure, start with `/vibe.next` or `/vibe.status`.

## What VDD creates

VDD can help generate a full execution-readiness package instead of leaving key decisions inside chat.

Common artifacts include:

- `PRD.draft.md`
- `PRD.full.md`
- `Scope.md`
- `Open-Questions.md`
- `Logic.md`
- `Architecture.md`
- `ADR-0001-initial-decisions.md`
- `Stack-Decision.md`
- `Dependencies.md`
- `Validation-Plan.md`
- `Test-Strategy.md`
- `Implementation-Plan.md`
- `Execution-Issues.md`
- `Risk-Register.md`
- `AI-Provider-Decision.md`
- `Event-Architecture.md`
- `Memory.md`
- `anti-hallucination.md`
- `repo.md`
- `Runbook.md`

## Code Audit & Remediation

`/vibe.audit` scans your codebase against the canonical rule packs in `rules/RULES_INDEX.json` and generates a full audit package.

```bash
vdd audit
```

Focused audit examples:

```bash
vdd audit --focus architecture
vdd audit --focus testing
vdd audit --focus security
vdd audit --focus performance
vdd audit --focus events
vdd audit --focus accessibility
```

### What it detects

- circular import dependencies
- component size violations
- missing test coverage
- hardcoded secrets and security issues
- accessibility gaps
- inconsistent error handling
- unsafe type usage
- duplicate or fragile dependency patterns

### What it generates

Audit output is written to `.vdd/audits/<timestamp>/` and typically includes:

| File | Contains |
| --- | --- |
| `Audit-Report.md` | Executive summary, repository profile, major risks, and top findings |
| `Audit-Issues.json` | Machine-readable issue list with evidence, severity, and remediation data |
| `Refactor-Plan.md` | Workstream-based remediation strategy |
| `Sprint-Plan.md` | Sprint grouping based on severity, dependency order, and leverage |

### Audit engine structure

```txt
cli/src/commands/audit.ts        # thin CLI wrapper
core/audit/
  rule-loader.ts                 # loads and selects canonical rule packs
  repository-profiler.ts         # detects project shape and stack
  codebase-auditor.ts            # audit orchestrator and detection passes
  issue-generator.ts             # converts findings into structured issues
  sprint-planner.ts              # groups work into workstreams and sprints
  report-writer.ts               # writes audit output artifacts
```

## Agent support

VDD is designed to integrate cleanly with coding-agent environments such as:

- Claude Code
- Codex
- Cursor
- Windsurf
- OpenCode
- Gemini CLI

The goal is not to force one runtime model everywhere.
The goal is to keep one canonical VDD system and export it in the cleanest native shape for each target.

## Use with your favorite coding agent

A good coding agent should be able to:

- detect the current runtime
- install or scaffold VDD in the cleanest project-local way
- treat this repository as the source of truth before installation and workflow execution
- start with `/vibe.start`
- run guided onboarding in plain language
- continue into the next useful workflow steps automatically
- propose the next best step after each checkpoint

For runtime-specific prompts and setup flows, see [INSTALL.md](./INSTALL.md).
For repo-native behavior rules, see [AGENTS.md](./AGENTS.md).

## Repository structure

```txt
agents/
cli/
core/
docs/
rules/
skills/
templates/
tests/
```

## Documentation map

Use these files depending on what you need:

- [INSTALL.md](./INSTALL.md) for installation and runtime setup
- [USAGE.md](./USAGE.md) for workflow usage
- [AGENTS.md](./AGENTS.md) for coding-agent behavior rules
- [docs/architecture/](./docs/architecture/) for architecture, policies, and roadmap
- [rules/README.md](./rules/README.md) for the canonical rules system

## Current status

VDD is in active build-out.

The strongest parts today are:

- workflow architecture
- staged project thinking
- PRD generation strategy
- post-PRD artifact expansion strategy
- code audit and remediation direction
- agent-first product positioning

Current work focuses on:

- production hardening
- test coverage
- artifact registry
- intelligence runtime implementation
- installation targets for major coding agents
- autopilot mode

## Philosophy

VDD is built on a few simple rules:

- do not start coding from chaos
- do not hide assumptions
- do not trust imported sources automatically
- do not confuse polish with readiness
- do not hand off a project dishonestly
- keep durable artifacts instead of burying important decisions in chat

## Roadmap

Current emphasis:

- stronger autopilot behavior
- deeper audit coverage
- event architecture analysis
- design token enforcement
- rule extraction and standardization
- install targets for major coding agents

## License

[MIT](./LICENSE)

## Created by

Mamdouh Aboammar
