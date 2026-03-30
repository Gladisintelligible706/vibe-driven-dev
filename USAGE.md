# USAGE.md — Vibe Driven Dev

> VDD governs the **pre-execution phase** of software development.
> Its job ends when your project is ready. Then it hands off to Spec-Kit or your coding agent.

---

## 1. Mental Model

```
Vague intent
    ↓
[ VDD Workflow ]   ← You are here
    ↓
Execution-ready specification
    ↓
[ Spec-Kit / AI Coding Agent ]
```

VDD does not write code. It makes sure the agent that writes code has everything it needs to do so correctly.

The VDD workflow produces a trusted set of bootstrap artifacts that your execution agent reads as ground truth.

The official VDD repository is part of that ground truth. A good coding agent should read the repo docs first, install VDD using the cleanest native project-level method, start with `/vibe.start`, onboard the user in plain language, and keep proposing the next best step automatically.

---

## 2. Core Journey

Each stage is invoked by running a public command through the VDD router.
For most users and agent-assisted setups, the preferred entrypoint is `/vibe.start`.

```bash
vdd run /vibe.start
vdd run /vibe.start --autopilot
vdd run /vibe.init
vdd run /vibe.plan
vdd run /vibe.research
vdd run /vibe.blueprint
vdd run /vibe.detail
vdd run /vibe.scaffold
vdd run /vibe.qa
vdd run /vibe.handoff-to-spec
```

### Stage Summary

| Command | Stage | Purpose |
|---|---|---|
| `/vibe.start` | guided entrypoint | Capture natural-language intent, normalize state, and let VDD choose the next valid steps |
| `/vibe.init` | init | Capture project intent, scope, and success definition |
| `/vibe.plan` | plan | Translate intent into a structured problem statement |
| `/vibe.research` | research | Validate assumptions against real-world constraints |
| `/vibe.blueprint` | blueprint | Produce architecture and stack decisions |
| `/vibe.detail` | detail | Technical detail for each system component |
| `/vibe.scaffold` | scaffold | Generate repository bootstrap files |
| `/vibe.audit` | audit | Scan codebase against canonical rules, generate issues and remediation plan |
| `/vibe.qa` | qa | Verify readiness before handoff |
| `/vibe.handoff-to-spec` | handoff | Transfer ownership to execution runtime |

Check current progress at any time:
```bash
vdd status
```

### Guided start

`/vibe.start` is the beginner-friendly entrypoint. It accepts natural-language project intent and translates it into normalized VDD state.

Use guided mode when you want the agent to keep asking a few plain-language questions:

```bash
vdd run /vibe.start --idea "AI assistant for small sales teams"
```

Use autopilot mode when you want onboarding to seed the state and then continue directly into the next valid workflow steps:

```bash
vdd run /vibe.start --autopilot --idea "AI assistant for small sales teams" --target-user "small B2B sales teams" --success-definition "A rep can send a useful first draft in under three minutes"
```

When the project intent is detailed enough, the same autopilot path can continue into `/vibe.plan`, `/vibe.research`, and `/vibe.blueprint` as well.

Autopilot now returns an `autopilotPlan` object with:
- the current mission
- the checkpoint before and after the run
- whether the system can continue automatically
- the internal steps it chose and why
- the human next step when approval or intervention is needed

---

## 3. Quickly Use With Your Favorite Coding Agent

Copy one of the prompts below and paste it directly into your coding agent.

The prompt should make the agent:
- understand what VDD is
- treat the official repository as the source of truth
- install VDD in the cleanest project-level way possible
- start with `/vibe.start`
- onboard you in plain language
- keep guiding the workflow and proposing the next best step automatically

### Runtime Fit

| Runtime | Best fit |
|---|---|
| Claude Code | Best native fit via project agents and project skills |
| Cursor / Windsurf / OpenCode | Best fit via `AGENTS.md` plus project rules or config |
| Gemini CLI | Best fit via project commands, extensions, and MCP-aware setup |

### Universal Prompt

```text
You are my coding agent and setup operator.

You are going to install and activate Vibe Driven Dev for this project, then guide me through the first project-definition workflow in plain language.

Important context:
Vibe Driven Dev is an agent-first pre-execution framework for AI coding agents.
Its job is to turn vague product ideas into:
- structured planning
- bootstrap files
- stack decisions
- AI provider and model decisions
- handoff-ready workflows

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/model-escalation-policy.md

Your responsibilities:
1. Inspect the repository and understand VDD before doing anything else.
2. Detect which coding-agent runtime you are currently running inside.
3. Install VDD using the cleanest native project-level method supported by this runtime.
4. Keep the setup minimal and tidy.
5. Do not overwrite important files without warning me first.
6. After installation, do not stop at raw commands.
7. Immediately move me into a guided onboarding loop in simple non-technical language.

Guided onboarding rules:
- Assume I am a non-technical user.
- Ask only the minimum useful questions.
- Ask about the project idea in natural language.
- Help me describe what I want to build, who it is for, what problem it solves, and whether AI is part of the product.
- Do not overwhelm me with technical wording.
- Keep the conversation practical and calm.

Workflow rules:
- Translate my answers into the VDD workflow.
- Start by guiding or executing the equivalent of:
  - /vibe.start
  - /vibe.plan
  - /vibe.scaffold
- Always explain what stage we are in.
- Always tell me the next best step.
- Continue automatically unless a high-impact decision needs my approval.

Decision rules:
- If stack selection is needed, explain the top recommendation simply.
- If AI provider or model selection is needed for the product itself, explain the best fit simply.
- If this project would benefit from extra coding-agent skills, recommend them clearly.

PRD quality rule:
- Once you have enough information to create a serious PRD, tell me explicitly.
- At that point, recommend switching to a stronger model for the PRD-writing phase if appropriate.
- For Anthropic users, prefer the latest active flagship model available.
- For OpenAI/Codex users, prefer the strongest reasoning setting available for detailed PRD work.
- Do not force the switch, but explain why it would improve output quality.

Final behavior:
- be installation-aware
- be workflow-aware
- be next-step-aware
- be beginner-friendly
- do not leave me with a pile of commands and no guidance

At the end of each major step, tell me:
1. what you just did
2. what you learned
3. what stage we are in
4. what the next best step is
5. whether you need my approval or can continue automatically
```

### Claude Code Prompt

```text
You are running inside Claude Code.

Install and activate Vibe Driven Dev for this project using Claude Code native project-level integration.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/model-escalation-policy.md

Use Claude-native conventions:
- project subagents in .claude/agents/
- project skills in .claude/skills/

Your job:
- inspect the repository first
- install or scaffold Vibe Driven Dev cleanly for Claude Code
- use project-level setup, not user-level, unless project-level is impossible
- keep the installation minimal and tidy
- do not overwrite important files without warning me first
- start with /vibe.start
- ask simple onboarding questions in plain language
- continue into the next valid workflow steps once the project intent is clear
- explain the current stage and the next best step after every checkpoint
- before PRD-heavy scaffold work, recommend a stronger model temporarily if that would clearly improve the result

I am not technical, so explain each step in simple language.

At the end:
- summarize what you installed
- list the Claude-specific paths you used
- show me the current VDD stage or mission
- tell me the next command if I want to continue manually
```

### Cursor / Windsurf / OpenCode Prompt

```text
You are my coding agent.

Install and activate Vibe Driven Dev in this repository using the most native project-level integration available for this editor/runtime.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/model-escalation-policy.md

Preferred behavior:
- use AGENTS.md if this runtime supports it
- use project-local rules/config files if supported
- keep everything inside the project
- avoid unnecessary files
- do not overwrite important repository files without checking first

Your tasks:
1. Detect whether this runtime prefers AGENTS.md, project rules, custom agent files, or another native project-level setup.
2. Install or scaffold Vibe Driven Dev accordingly.
3. Keep the setup clean and understandable.
4. Start with /vibe.start.
5. Ask simple onboarding questions in plain language and keep the question budget small.
6. Continue into the next valid workflow steps only after the idea is grounded.
7. Explain the current stage or mission and the next best step after every checkpoint.
8. Before PRD-heavy scaffold work, recommend a stronger model temporarily if that would clearly improve the result.
9. Explain what you did in very simple language because I am a non-technical user.

At the end, show:
- detected runtime
- installation method used
- files created
- current VDD stage or mission
- next manual step
```

### Gemini CLI Prompt

```text
You are running inside Gemini CLI.

Please set up Vibe Driven Dev for this project using the most native Gemini CLI approach available.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/model-escalation-policy.md

Preferred Gemini-style behavior:
- use project-local commands if useful
- use project-local extensions if useful
- use MCP configuration only when it improves the setup clearly
- keep the setup minimal and understandable
- prefer project-level setup over user-level setup

Your tasks:
- inspect the repository
- determine the best Gemini CLI integration path
- install or scaffold Vibe Driven Dev cleanly
- start with /vibe.start
- ask simple onboarding questions in plain language
- continue into the next valid workflow steps only after the idea is grounded
- generate the essential bootstrap files when the workflow reaches scaffold
- explain the current stage or mission and the next best step after every checkpoint
- before PRD-heavy scaffold work, recommend a stronger model temporarily if that would clearly improve the result

I am a non-technical user, so explain each step simply.

At the end:
- tell me what Gemini-specific setup you used
- list the files or commands created
- tell me the current workflow stage or mission
- tell me the next step if I want to continue manually
```

### What the Agent Should Do

A good setup flow should:
- detect the current runtime
- understand VDD from the repository before acting
- prefer project-level installation
- keep the setup tidy
- avoid unnecessary files
- start with `/vibe.start`
- onboard the user in plain language
- continue into the next valid workflow steps automatically when safe
- explain the current stage, mission, and next best step
- explain clearly what was installed and where

If the runtime does not support native agents or skills well, the agent should fall back to a clean generic project-local setup instead of forcing a bad integration

### What the Agent Must Do After Install

After install, the agent should:
- say which runtime it detected
- say what it installed and where
- start with `/vibe.start`
- ask the minimum useful onboarding questions
- translate the answers into VDD workflow state
- continue automatically unless a high-impact decision needs approval
- explain the current stage or mission
- propose the next best step after each checkpoint

### What the User Should Expect

After a good setup run, the agent should tell you:
- which runtime it detected
- which installation method it used
- which files it created or updated
- which VDD stage or mission the project is currently in
- which command to type next if you want to continue manually

---

## 4. Bootstrap Files

`/vibe.scaffold` generates these files in your project root:

| File | Contains |
|---|---|
| `PRD.draft.md` | Default PRD when stronger-model escalation is recommended but not yet accepted |
| `PRD.full.md` | Deeper PRD when stronger-model escalation is explicitly accepted |
| `Logic.md` | Business logic and core system behaviors |
| `Structure.md` | File and module architecture |
| `Dependencies.md` | Tech stack with rationale and version guidance |
| `Memory.md` | Architectural decisions and rationale log |
| `anti-hallucination.md` | Explicit prohibitions and boundaries for the coding agent |
| `repo.md` | Repository conventions, branching, naming rules |
| `Design.md` | UI/UX and design system guidance |
| `Constraints.md` | Hard limits: time, budget, scope, tech constraints |

When scaffold recommends a stronger planning model, you can keep the draft path:

```bash
vdd run /vibe.scaffold
```

Or explicitly accept the stronger-model path for the deeper PRD artifact:

```bash
vdd run /vibe.scaffold --accept-model-upgrade
```

When the stronger-model path is deferred, scaffold now returns an explicit handoff prompt telling the user to switch to Claude Opus 4.6 where available, Codex on GPT-5.4 or GPT-5.4 with `xhigh` reasoning, or Gemini 3.1 Pro, then re-run scaffold. The router also returns `nextRecommendedCommand: /vibe.qa` plus a `humanNextStep` list that makes the tradeoff explicit.

These files are the handoff artifacts. They are the source of truth for the execution agent.

---

## 5. Stack Selection

VDD uses the `stack-advisor` skill to suggest the best technology stack based on your project type, platform, and constraints.

This runs automatically during `/vibe.init` and `/vibe.plan`. The recommendation appears in the routing result.

Stack recommendations are based on:
- Declared platform
- Target user type
- Declared constraints
- Available packs and their stack preferences

---

## 6. AI Provider Selection

The `ai-provider-selector` skill recommends the best AI API provider for your *product* (not for VDD itself).

If your project is an AI-powered application, VDD will surface a recommendation during `/vibe.plan` covering:
- Anthropic Claude (reasoning, long context, agent use)
- Google Gemini (multimodal, grounding, search integration)
- OpenAI GPT (broad ecosystem, tool use)
- DeepSeek (cost-efficiency, code focus)

The recommendation is returned in the routing result with rationale. It does not auto-configure anything.

---

## 7. Learning Sources and Add-ons

VDD separates knowledge into trust tiers:

| Tier | Path | Trust |
|---|---|---|
| Core | `skills/`, `agents/` | Executable — always trusted |
| Installed Pack | `.vdd/addons/installed/` | Executable — explicitly added |
| Archive | `archive/learning-sources/` | Learning-only — never auto-executed |

Add an external pack:
```bash
vdd add ../my-coding-standards
```

Inspect archive sources and promote trusted ones:
```bash
vdd scan
vdd validate archive-learning-skill:archive/learning-sources/my-skill/SKILL.md
vdd promote archive-learning-skill:archive/learning-sources/my-skill/SKILL.md
```

---

## 8. Handoff to Spec-Kit

When VDD marks the project as handoff-ready, it transfers ownership to Spec-Kit:

```bash
vdd run /vibe.handoff-to-spec
```

At this point:
- All bootstrap files are written to the project root
- The state is marked `stage: handoff, status: completed`
- Spec-Kit or your coding agent can now read the scaffold and begin implementation

VDD's job is done.

---

## 9. Code Audit & Remediation

`/vibe.audit` scans your codebase against the canonical rules defined in `rules/RULES_INDEX.json` and produces a full audit with structured issues, workstream grouping, and sprint-based execution plans.

### Run a full audit

```bash
vdd audit
```

### Run a focused audit

```bash
vdd audit --focus architecture    # Circular deps, dependency flow, component size
vdd audit --focus testing         # Missing tests, coverage gaps
vdd audit --focus security        # Hardcoded secrets, missing .env.example
vdd audit --focus performance     # Large components, bundle concerns
vdd audit --focus events          # Event architecture, lifecycle, tracking
vdd audit --focus accessibility   # Missing alt text, ARIA labels
```

### Output modes

```bash
vdd audit --mode full       # All 4 artifacts (default)
vdd audit --mode report     # Audit-Report.md only
vdd audit --mode fix-plan   # Refactor-Plan.md only
vdd audit --mode sprints    # Sprint-Plan.md only
```

### What it detects

| Module | Checks for |
|---|---|
| Circular imports | Import cycles via DFS dependency graph |
| Component size | Files exceeding 250 lines |
| Missing tests | Source files without corresponding `.test.` / `.spec.` files |
| Security | Hardcoded API keys, connection strings, secrets |
| Accessibility | Missing `alt` attributes, missing ARIA labels |
| Error handling | Missing ErrorBoundary, unprotected async functions |
| Type safety | Excessive `any` usage in TypeScript files |
| Dependencies | Deprecated or duplicate packages |

### Generated artifacts

Four files are written to `audit-artifacts/<timestamp>/`:

| File | Format | Contains |
|---|---|---|
| `Audit-Report.md` | Markdown | Executive summary, repo profile, risk level, top findings with evidence |
| `Audit-Issues.json` | JSON | Machine-readable issues with severity, category, rule source, evidence, remediation |
| `Refactor-Plan.md` | Markdown | Workstream grouping with effort estimates, dependencies, and success criteria |
| `Sprint-Plan.md` | Markdown | 3-sprint execution roadmap with issue assignments and effort summary |

### Audit engine architecture

The audit system is modular, located in `core/audit/`:

```
core/audit/
  types.ts                   -- shared types (AuditIssue, SprintPlan, RepositoryProfile, etc.)
  rule-loader.ts             -- loads RULES_INDEX.json, selects rules by project profile
  repository-profiler.ts     -- detects project type, frameworks, features
  codebase-auditor.ts        -- orchestrator + 8 detection modules
  issue-generator.ts         -- converts raw findings to structured issues
  sprint-planner.ts          -- groups issues into workstreams and sprints
  report-writer.ts           -- generates all 4 output artifacts
```

---

## 10. CLI Reference

```bash
# Installation
npx vibe-driven-dev install claude-code --project    # Install for Claude Code (project)
npx vibe-driven-dev install claude-code --global     # Install for Claude Code (user-level)
npx vibe-driven-dev install generic-agents-md --project
vdd targets                                          # Show supported runtime targets

# Project lifecycle
vdd init                                       # Initialize project state
vdd run <command>                              # Run a VDD journey command
vdd status                                     # Show current stage and readiness
vdd doctor                                     # Full environment health check

# Code audit
vdd audit                                      # Run full codebase audit
vdd audit --focus architecture                 # Audit architecture rules only
vdd audit --focus testing                      # Audit testing rules only
vdd audit --focus security                     # Audit security rules only
vdd audit --focus performance                  # Audit performance rules only
vdd audit --focus events                       # Audit event/lifecycle rules only
vdd audit --focus accessibility                # Audit accessibility rules only
vdd audit --mode report                        # Generate report only
vdd audit --mode fix-plan                      # Generate fix plan only
vdd audit --mode sprints                       # Generate sprint plan only
vdd audit --verbose                            # Show detailed progress

# Source management
vdd scan                                       # Discover all agents and skills
vdd validate <source-id>                       # Audit a source for security and compliance
vdd promote <source-id>                        # Upgrade a source to executable trust tier

# Pack management
vdd add <path>                                 # Add a skill pack
vdd packs                                      # List installed packs
```
