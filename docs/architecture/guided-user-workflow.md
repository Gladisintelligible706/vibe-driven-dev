# Guided User Workflow

## Purpose

This document defines how Vibe Driven Dev should guide a non-technical user after installation.

The system must not assume that a user remembers commands, understands stage names, or knows when to move from planning into execution.

The workflow must behave like a guided product conversation first and a command system second.

## Why This Matters

VDD is intended to be usable by people who can describe a business idea or a product need but cannot reliably operate an engineering workflow manually.

If the system only exposes commands such as `/vibe.init`, `/vibe.plan`, and `/vibe.scaffold`, then the burden remains on the user.

That is the wrong operating model for the target user.

After install, the system should:
- welcome the user in plain language
- gather the minimum necessary project intent
- translate answers into authoritative state
- propose the next best step clearly
- continue step by step with explicit checkpoints

## Core Principle

The non-technical user should experience:
- a guided conversation
- a visible workflow
- clear next-step recommendations
- simple language
- minimal command memorization

The internal system should still preserve:
- explicit stages
- trusted state
- deterministic artifacts
- guarded transitions
- specialist delegation

For the autopilot operating contract that sits above the stage router, see `autopilot-mode.md`.

## User Persona

This workflow is designed for a user who:
- can describe a project idea in business or product language
- may not know what stack or provider to choose
- does not want to manage command syntax
- wants the system to explain what it is doing
- needs gentle protection from random workflow jumps

## Workflow Layers

The guided workflow should operate across four layers:

1. Welcome and intent capture
2. Translation into VDD state
3. Guided next-step suggestions
4. Optional autopilot with checkpoints

## 1. Welcome and Intent Capture

### Role

The system should begin with a human-oriented conversation instead of asking which command to run.

### Question Budget

The onboarding layer should ask at most five primary questions before it starts moving.

Recommended questions:
1. What kind of project do you want to build
2. Who is this for
3. What problem does it solve
4. Does the product itself use AI
5. Do you want a fast MVP or a stronger foundation

### Language Rules

Questions should:
- avoid engineering jargon
- avoid requiring exact architecture terms
- avoid asking for stack choice too early
- stay concrete and easy to answer

The system should not ask:
- which framework should we use
- which database do you prefer
- which auth library do you want

Those are internal translation concerns unless the user explicitly cares.

## 2. Translation Into VDD State

### Role

The system should translate the onboarding answers into structured VDD state.

### Required Internal Outputs

At minimum, onboarding should produce:
- `project type`
- `target user`
- `success definition`
- `constraints`
- `AI usage`
- `delivery preference`
- `stage = init`

### Translation Rule

The user should not need to say the exact internal field names.

The onboarding layer should infer and normalize them.

Example:
- "I want a small tool for sales teams" -> `project type = internal-tool`
- "It should help users draft outreach emails with AI" -> `has AI features = true`
- "I want something quick" -> `delivery preference = MVP`

### Command Handoff

Once the minimum intent is captured, the system should internally move into:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.research`

This may happen in guided mode one step at a time, or in autopilot mode with checkpoints.

## 3. Guided Next-Step Suggestions

### Role

After every meaningful step, the system must explain:
- where the user is now
- what was created or decided
- what the next best step is
- why that step is next

### Required Output Shape

Every stage-facing response should include:
1. current stage
2. plain-language explanation
3. next recommended command
4. whether the system can continue automatically

Example:

"We are now in the planning stage. I translated your idea into a structured problem statement and a first scope boundary. The next best step is a quick research pass so we can avoid obvious stack or product mistakes. If you want, I can continue automatically."

### Safety Rule

The system should not jump several stages without either:
- being in autopilot mode, or
- clearly informing the user what it is doing

## PRD Threshold And Model Escalation

When the workflow reaches a PRD-heavy or architecture-heavy step, the system should recommend a stronger model temporarily instead of pretending every model produces the same quality.

Typical trigger points:
- scaffold
- deep blueprint synthesis
- detailed product specification

Recommended wording:
- explain that the current step creates long-form project truth
- recommend a stronger model only for this phase
- allow the user to continue with the current model if they prefer

Recommended options:
- latest active Anthropic flagship where available, currently Claude Opus 4.6
- Codex on GPT-5.4 or GPT-5.4, with `xhigh` reasoning when the extra depth is worth the latency
- Gemini 3.1 Pro when the user prefers the Gemini ecosystem for high-reasoning planning

## 4. Optional Autopilot With Checkpoints

### Role

Some users want the system to keep moving unless a meaningful decision is required.

### Modes

The workflow should support:
- `guided`
- `autopilot`

#### Guided Mode

The system:
- proposes the next step
- explains why
- waits for user confirmation

#### Autopilot Mode

The system may continue through:
- `init`
- `plan`
- `research`
- `blueprint`
- `detail`
- `scaffold`

But it must stop or checkpoint for heavier decisions such as:
- stack choice
- AI provider choice
- security-sensitive architecture decisions
- readiness for handoff

### Checkpoint Rule

Autopilot is not permission to hide decisions.

It is permission to continue through low-risk workflow transitions while keeping major decisions visible.

## Entry Point

## `/vibe.start`

The recommended user-facing entry point for non-technical onboarding is `/vibe.start`.

### Purpose

This command should:
- begin the onboarding conversation
- gather minimum intent
- create or update initial project state
- launch the first valid VDD steps
- keep the user informed in plain language

### Why Not Reuse `/vibe.init` Directly

`/vibe.init` is still the correct internal workflow step.

But `/vibe.start` is a better user-facing command because it communicates:
- beginning
- guidance
- low cognitive load

The runtime may still translate `/vibe.start` into `/vibe.init` plus guided follow-through.

## Onboarding Script Policy

The onboarding system should follow a deterministic question policy.

### Rules

- ask the fewest questions needed to establish direction
- prefer defaults over open-ended engineering questionnaires
- infer rather than escalate when safe
- document assumptions internally
- keep answers in user language and internal state in normalized language

### Assumption Policy

If the user gives partial answers, the system should choose the safest reasonable default and continue.

Example defaults:
- unclear delivery ambition -> assume MVP
- unclear platform -> assume web app
- unclear AI usage -> assume no embedded AI until stated

## Next-Action Policy

Every stage should define:
- user-friendly explanation
- next command
- why it is next
- whether it may auto-run

### Stage Guidance Examples

#### After Init

Explain that the system captured the idea and created the initial project state.

Recommend `/vibe.plan`.

#### After Plan

Explain that the idea has been translated into a structured problem statement and first scope.

Recommend `/vibe.research`.

#### After Research

Explain that the system has gathered risks and alternatives.

Recommend `/vibe.blueprint`.

#### After Blueprint

Explain that the system now has a system shape and major decisions.

Recommend `/vibe.detail`.

#### After Detail

Explain that execution-ready details exist and the next step is to scaffold repository grounding files.

Recommend `/vibe.scaffold`.

#### After Scaffold

Explain that the project now has foundation files and should choose or confirm stack, provider, and skill bundles.

Recommend `/vibe.skills` or the relevant advisor command.

## Agent Responsibilities

The guided workflow should be orchestrated by the central runtime, but handled through explicit responsibilities.

### Orchestrator

Owns:
- stage integrity
- delegation
- state continuity
- next-step visibility

### Onboarding Guide

Owns:
- initial welcome
- question asking
- plain-language translation
- non-technical user handling

### Planner, Architect, Researcher, QA Guardian

Remain specialist agents and should receive delegated work only after the onboarding layer has captured enough context.

## Runtime-Specific Behavior

### Claude Code

Project-level agents and skills make the guided workflow feel natural through orchestration and delegation.

The onboarding guide should be available as a project-local specialist agent.

### Gemini CLI

The guided workflow should be surfaced through project-local commands and, later, extension or MCP-backed flows.

`/vdd:start`, `/vdd:next`, and `/vdd:status` are reasonable runtime-native equivalents.

### AGENTS.md Family

Cursor, Windsurf, OpenCode, and similar runtimes should receive the same onboarding logic through AGENTS.md and project rule/config exports.

## V1 Boundary

V1 should include:
- onboarding contract
- non-technical question budget
- guided vs autopilot policy
- next-step suggestion policy
- `/vibe.start` architecture decision

V1 does not need:
- rich UI
- multi-user sessions
- persistent conversation replay
- full natural-language ambiguity resolution

## Success Criteria

The guided workflow is successful when:
- the user can begin without remembering commands
- the first five answers are enough to create initial state
- the system always explains what happened and what comes next
- the user is protected from random stage jumps
- the system can continue with either guided confirmations or checkpointed autopilot

## Next Implementation Steps

1. Add onboarding skill contract in `skills/governance/onboarding-guide/SKILL.md`
2. Add onboarding specialist agent in `agents/onboarding-guide/AGENT.md`
3. Add `/vibe.start` as a public command
4. Add router support for guided mode and autopilot mode
5. Connect next-action messaging to router results and project state
