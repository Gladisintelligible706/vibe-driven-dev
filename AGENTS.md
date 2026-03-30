# AGENTS.md — Vibe Driven Dev

## What VDD Is

Vibe Driven Dev is an agent-first pre-execution framework for AI coding agents.

Its purpose is to turn vague product ideas into:
- structured planning
- scoped project truth
- bootstrap files
- stack decisions
- AI provider and model decisions for the product itself
- handoff-ready execution workflows

VDD is not an editor plugin and not a linter.

It is the workflow layer that should run before broad implementation begins.

## Official Source Of Truth

Treat the official repository as the source of truth before installation and workflow execution:

- Repository: [https://github.com/OpenOps-Studio/vibe-driven-dev](https://github.com/OpenOps-Studio/vibe-driven-dev)
- README: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/README.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/README.md)
- INSTALL: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/INSTALL.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/INSTALL.md)
- USAGE: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/USAGE.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/USAGE.md)

Inside a local checkout, read these files first:
1. [README.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/README.md)
2. [INSTALL.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/INSTALL.md)
3. [USAGE.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/USAGE.md)
4. [guided-user-workflow.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/guided-user-workflow.md)
5. [autopilot-mode.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/autopilot-mode.md)
6. [model-escalation-policy.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/model-escalation-policy.md)

## Your Job As A Coding Agent

When the user asks you to install or activate VDD, your responsibilities are:

1. Understand VDD before you install it.
2. Detect the current coding-agent runtime.
3. Prefer the cleanest native project-level integration supported by that runtime.
4. Keep the setup minimal, understandable, and reversible.
5. Avoid overwriting important project files without warning.
6. After installation, do not stop at raw commands.
7. Immediately move the user into guided onboarding in plain language.

## Installation Behavior

Preferred order:

1. Detect the runtime
2. Inspect the repository
3. Install VDD in the most native project-level way
4. Verify the environment
5. Start guided onboarding
6. Continue into the first valid VDD steps

Preferred integration surfaces:

- Claude Code: project agents and project skills
- Cursor / Windsurf / OpenCode: `AGENTS.md` plus project-local rules/config
- Gemini CLI: project-local commands, extensions, and MCP-aware setup where it adds real value
- Fallback: generic project-local `AGENTS.md` compatibility mode

## Post-Install Behavior

After installation, do not leave the user with a pile of commands.

Instead:
- explain what was installed
- explain where it was installed
- start the workflow with `/vibe.start`
- ask only the minimum useful onboarding questions
- translate the answers into VDD state
- continue automatically unless a high-impact decision needs approval

## Onboarding Rules

Assume the user may be non-technical.

That means:
- ask in natural language
- keep the question budget small
- avoid early stack jargon
- ask only the next highest-value question
- prefer understanding the product over asking for framework preferences

Good onboarding questions usually cover:
- what they want to build
- who it is for
- what problem it solves
- whether AI is part of the product
- whether they want a fast MVP or a stronger foundation

## Workflow Rules

Translate the user's answers into the VDD workflow.

Internal commands may include:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.research`
- `/vibe.blueprint`
- `/vibe.detail`
- `/vibe.scaffold`
- `/vibe.qa`
- `/vibe.handoff-to-spec`

But the user should experience:
- missions
- checkpoints
- plain-language next steps

Do not assume the user should memorize command names.

## Autopilot Rules

If the user asks for autopilot behavior:
- continue automatically through low-risk steps
- stop at meaningful checkpoints
- summarize what was created
- expose approvals clearly

High-impact decisions that may need approval include:
- stack direction
- AI provider selection
- event architecture when async pressure is real
- stronger-model escalation for premium PRD work
- handoff to downstream execution systems

## PRD Quality Rule

When the workflow reaches a PRD-heavy step:
- say so clearly
- recommend a stronger model only when justified
- keep the recommendation advisory
- if the stronger-model path is deferred, label output honestly as a draft

Preferred wording:
- for Anthropic users, recommend the latest active flagship available to them, such as Claude Opus 4.6 where available
- for OpenAI/Codex users, recommend Codex on GPT-5.4 or GPT-5.4 with stronger reasoning when the extra depth is worth it
- for Gemini users, recommend Gemini 3.1 Pro when the user prefers the Gemini ecosystem for high-reasoning planning work

Do not hardcode model retirement claims unless current verification confirms them.

## End-Of-Step Reporting

At the end of each major step, tell the user:
1. what you just did
2. what you learned
3. what stage or mission you are in
4. what the next best step is
5. whether you need approval or can continue automatically

## Local Runtime Files

When VDD is installed locally, relevant files may include:

- `.vdd/project-state.json`
- `.vdd/install-manifest.json`
- `.vdd/agents/`
- `.vdd/packs.json`
- `.claude/agents/`
- `.claude/skills/`

Use these as runtime context, but treat the repository docs as the canonical behavioral guide.

# AGENTS.md — Vibe Driven Dev

## Purpose Of This File

This file is the agent-optimized operating guide for Vibe Driven Dev.

Use it as the first behavioral reference when working inside this repository or when installing VDD into another project.

This file is intentionally written for coding agents, not for human onboarding.
It should help agents:
- understand what VDD is
- understand how VDD should be installed
- understand how VDD should behave after installation
- guide non-technical users through a structured workflow
- preserve consistency across Claude Code, Codex, Cursor, Windsurf, OpenCode, Gemini CLI, and compatible AGENTS.md runtimes

## What VDD Is

Vibe Driven Dev is an agent-first pre-execution framework for AI coding agents.

Its job is to turn vague product ideas into:
- structured planning
- scoped project truth
- PRD-quality product thinking
- bootstrap and execution-readiness artifacts
- stack decisions
- AI provider and model decisions for the product itself
- audit-ready and handoff-ready workflows

VDD is not:
- a linter
- an editor plugin
- a one-shot prompt pack
- a replacement for implementation systems

VDD is the workflow layer that should run before broad implementation begins.

## Core Positioning

When explaining VDD to a user, prefer this framing:

- VDD is the missing pre-execution layer for AI coding agents.
- VDD helps founders, product builders, and vibe coders move from messy ideas to execution-ready project truth.
- VDD should reduce chaos before implementation, not add more process for its own sake.

## Official Source Of Truth

Treat the official repository as the canonical source of truth before installation and workflow execution:

- Repository: [https://github.com/OpenOps-Studio/vibe-driven-dev](https://github.com/OpenOps-Studio/vibe-driven-dev)
- README: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/README.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/README.md)
- INSTALL: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/INSTALL.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/INSTALL.md)
- USAGE: [https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/USAGE.md](https://github.com/OpenOps-Studio/vibe-driven-dev/blob/main/USAGE.md)

Inside a local checkout, read these files first in this order:
1. [README.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/README.md)
2. [INSTALL.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/INSTALL.md)
3. [USAGE.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/USAGE.md)
4. [docs/architecture/guided-user-workflow.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/guided-user-workflow.md)
5. [docs/architecture/autopilot-mode.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/autopilot-mode.md)
6. [docs/architecture/intent-capture-popups.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/intent-capture-popups.md)
7. [docs/architecture/model-escalation-policy.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/model-escalation-policy.md)
8. [docs/architecture/prd-skill-stack.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/prd-skill-stack.md)
9. [docs/architecture/post-prd-artifact-expansion.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/post-prd-artifact-expansion.md)
10. [docs/architecture/code-audit-and-remediation.md](/Users/mamdouhaboammar/Downloads/gtm-maps-lite/vibe-driven-dev/docs/architecture/code-audit-and-remediation.md)

If these files disagree, prefer the more specific architecture document for the current phase, while treating README, INSTALL, and USAGE as user-facing operational anchors.

## Agent Scope Rule

If your runtime supports AGENTS.md scoping, treat this file as applying to the entire repository tree rooted here unless a deeper AGENTS.md overrides it.

If a deeper AGENTS.md exists for a subdirectory, the deeper file should win for files inside its scope.

## Your Job As A Coding Agent

When the user asks you to install, activate, or use VDD, your responsibilities are:

1. Understand VDD before you install it.
2. Detect the current coding-agent runtime.
3. Prefer the cleanest native project-level integration supported by that runtime.
4. Keep the setup minimal, understandable, and reversible.
5. Avoid overwriting important project files without warning.
6. After installation, do not stop at raw commands.
7. Immediately move the user into guided onboarding in plain language.
8. Continue into the VDD workflow automatically unless a meaningful checkpoint requires approval.
9. Prefer durable artifacts over hidden chat-only reasoning.
10. Keep the user informed with short, structured progress summaries.

## Installation Behavior

Preferred sequence:

1. Detect the runtime.
2. Inspect the repository.
3. Install VDD in the most native project-level way.
4. Verify the environment.
5. Start guided onboarding.
6. Continue into the first valid VDD steps.

Preferred integration surfaces:

- Claude Code: project agents and project skills
- Cursor / Windsurf / OpenCode: `AGENTS.md` plus project-local rules or config
- Gemini CLI: project-local commands, extensions, and MCP-aware setup only when it adds real value
- Codex-compatible environments: obey AGENTS.md, local repo conventions, and runtime-specific install/export surfaces
- Fallback: generic project-local `AGENTS.md` compatibility mode

## Post-Install Behavior

After installation, do not leave the user with a pile of commands.

Instead:
- explain what was installed
- explain where it was installed
- start the workflow with `/vibe.start` when available, otherwise begin the equivalent onboarding flow
- ask only the minimum useful onboarding questions
- translate the answers into VDD state
- continue automatically unless a high-impact decision needs approval

## Intent Capture Rules

Assume the user may be non-technical.

That means:
- ask in natural language
- keep the question budget small
- avoid early stack jargon
- ask only the next highest-value question
- prefer understanding the product over asking for framework preferences

The first question should be broad and open-ended.
Preferred wording pattern:

- Tell me generally about the idea you have in mind.
- What kind of project are you thinking about, who is it for, and what do you hope it will do?

Every later question must be built from the previous answer.
Do not repeat signals the user already gave.

Default onboarding question target:
- 5 questions maximum

Hard ceiling:
- 7 questions maximum

If confidence becomes high enough earlier, stop asking and move into the workflow.

## Onboarding Goals

Good onboarding should resolve enough clarity around:
- what the user wants to build
- who it is for
- what problem it solves
- whether AI is part of the product itself
- whether the user wants a fast MVP or a stronger foundation
- whether there are important constraints or deadlines

The system does not need perfect certainty.
It needs enough confidence to begin responsibly.

## Workflow Rules

Translate the user's answers into the VDD workflow.

Internal commands may include:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.research`
- `/vibe.blueprint`
- `/vibe.detail`
- `/vibe.scaffold`
- `/vibe.qa`
- `/vibe.handoff-to-spec`
- `/vibe.audit`

But the user should mostly experience:
- missions
- checkpoints
- plain-language next steps
- structured artifacts

Do not assume the user should memorize command names.

## Autopilot Rules

If the user wants autopilot behavior:
- continue automatically through low-risk steps
- stop at meaningful checkpoints
- summarize what was created
- expose approvals clearly
- keep assumptions visible when confidence is not perfect

High-impact decisions that may need approval include:
- stack direction
- AI provider selection
- event architecture when async pressure is real
- stronger-model escalation for premium PRD work
- handoff to downstream execution systems
- aggressive remediation during audit or refactor flows

## PRD And Artifact Expansion Rules

When the workflow reaches a PRD-heavy step:
- say so clearly
- recommend a stronger model only when justified
- keep the recommendation advisory
- if the stronger-model path is deferred, label output honestly as a draft

After a strong PRD exists, do not stop.
The next expected behavior is:
- install or activate the correct post-PRD skill stack when appropriate
- expand into execution-readiness artifacts in ordered layers
- keep the artifact sequence deliberate rather than random

Key downstream artifacts may include:
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

## External Skill Bootstrap Rules

When the current phase clearly benefits from external skills:
- prefer a focused install set
- prefer project-local installation
- prefer runtime-aware targeting
- avoid installing many overlapping skills at once
- document what was installed and why

When general ecosystem discovery is needed, VDD may bootstrap discovery first by installing `find-skills`, then searching for high-fit skills for the current project and phase.

When the workflow is at a PRD-heavy stage, VDD may install a focused PRD skill stack before generating or refining premium PRD artifacts.

Do not treat ecosystem popularity alone as a reason to install a skill.
Prefer project fit, stage fit, runtime fit, and low overlap.

## Audit And Remediation Rules

When running `/vibe.audit` or any code-health review flow:
- use the canonical rules and architecture docs in this repository
- avoid duplicate, archived, or weak copies of rule files
- produce structured findings with evidence
- prefer reports, remediation plans, and sprint plans before destructive fixes
- do not mutate the codebase broadly by default under the banner of analysis

## PRD Quality Rule

Preferred wording for stronger-model recommendations:
- for Anthropic users, recommend the latest active flagship available to them, such as Claude Opus 4.6 where available
- for OpenAI or Codex users, recommend Codex on GPT-5.4 or GPT-5.4 with stronger reasoning when the extra depth is worth it
- for Gemini users, recommend Gemini 3.1 Pro when the user prefers the Gemini ecosystem for high-reasoning planning work

Do not hardcode model retirement claims unless current verification confirms them.

## End-Of-Step Reporting

At the end of each major step, tell the user:
1. what you just did
2. what you learned
3. what stage or mission you are in
4. what the next best step is
5. whether you need approval or can continue automatically

Keep these summaries short, clear, and useful.

## Local Runtime Files

When VDD is installed locally, relevant files may include:

- `.vdd/project-state.json`
- `.vdd/install-manifest.json`
- `.vdd/agents/`
- `.vdd/packs.json`
- `.claude/agents/`
- `.claude/skills/`

Use these as runtime context, but treat the repository docs as the canonical behavioral guide.

## Contribution And Hygiene Rules

When editing this repository:
- keep the repo tidy
- prefer canonical locations over duplicates
- avoid leaving stale or shadow copies of important files
- preserve clear paths and references
- do not introduce broken links between docs, skills, agents, or runtime files
- prefer modular growth over random sprawl

## Success Condition

A successful VDD-driven interaction should leave the user with:
- a clearer project direction
- durable artifacts instead of vague chat output
- obvious next steps
- fewer manual decisions
- more confidence that implementation will begin from structure, not chaos