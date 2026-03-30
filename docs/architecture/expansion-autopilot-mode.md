

docs/architecture/autopilot-mode.md

# Autopilot Mode

## Purpose

This document defines how Vibe Driven Dev moves from a command-driven framework to a guided autopilot operating mode.

The goal is not to remove user control.

The goal is to let VDD:
- guide non-technical users through a logical workflow
- reduce command memorization
- ask only the most useful questions
- continue automatically when confidence is high enough
- pause only at meaningful decision points
- keep progress visible at all times
- coordinate specialist agents and external skills in the right order

## Why This Layer Exists

A well-structured workflow is not enough if the user still has to manually decide every next command.

Without an autopilot layer, the user experience tends to feel like:
- a command catalog
- a prompt kit
- a system that still depends on technical users to drive it

VDD should instead feel like:
- a guided operator
- a project director
- a workflow conductor that understands what should happen next

## Core Principle

Autopilot mode should automate sequencing, not judgment.

It should:
- continue by default when the path is clear
- stop when real ambiguity appears
- ask only the minimum number of questions needed
- preserve user approval for high-impact decisions
- keep every step explainable

## Relationship to the Core Journey

Autopilot mode sits above the canonical VDD journey.

It does not replace the journey.
It orchestrates movement through the journey.

The canonical stages remain:

- init
- plan
- research
- blueprint
- detail
- scaffold
- qa
- handoff

Autopilot mode is responsible for:
- deciding when to enter a stage
- deciding when a stage can continue automatically
- deciding when to pause
- deciding what the user should see
- deciding what the next best step is

## User Experience Goal

A non-technical user should be able to:

1. install VDD into a coding agent
2. describe the project in natural language
3. answer a small number of simple questions
4. watch VDD move the project forward automatically
5. understand what has been done and what comes next
6. approve only the decisions that truly need them

## Source-Aware Runtime Context

Autopilot mode should work cleanly across coding agents that support project-level configuration and specialization.

Claude Code supports custom subagents stored as Markdown files with YAML frontmatter in `.claude/agents/` at project level and `~/.claude/agents/` at user level, with project-level precedence. Subagents can have task-specific prompts, tools, and their own context window.  [oai_citation:0‡Claude API Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents?utm_source=chatgpt.com)

The open Skills CLI supports many agent runtimes and supports installing skills from GitHub URLs or shorthand, targeting specific agents with `--agent`, and installing project-local by default or globally with `-g`.  [oai_citation:1‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

These runtime realities mean VDD should adapt autopilot behavior to the current environment rather than assuming one fixed install or orchestration model.  [oai_citation:2‡Claude API Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents?utm_source=chatgpt.com)

## Autopilot Modes

VDD should support at least three user-facing operating modes.

### 1. Guided Mode

Use when:
- the user is non-technical
- the user wants more explanation
- the project is ambiguous
- the workflow is early and unstable

Behavior:
- asks more clarifying questions
- explains each stage in plain language
- pauses more often
- continues only when confidence is acceptable

### 2. Autopilot Mode

Use when:
- the user wants speed
- the project intent is clear enough
- the workflow path is obvious enough
- the system has enough confidence to continue

Behavior:
- asks fewer questions
- runs multiple steps automatically
- pauses only at high-impact checkpoints
- keeps progress summaries short and clear

### 3. Expert Mode

Use when:
- the user wants direct control
- the user is comfortable with commands
- the user wants minimal explanation
- the workflow needs manual steering

Behavior:
- exposes commands directly
- reduces onboarding language
- allows more direct control over stage transitions

## Entry Point

Autopilot mode should preferably begin through a user-facing entry such as:

- `/vibe.start`

This entry point should:
- welcome the user
- explain what VDD does
- begin intent capture
- choose an operating mode
- translate the conversation into project state
- start the first workflow steps automatically

## Guided Onboarding Loop

The first responsibility of autopilot mode is intent capture.

The system should not begin by asking the user which command to run.

Instead, it should ask simple questions such as:

- What kind of project do you want to build
- Who is it for
- What problem does it solve
- Is AI part of the product itself
- Do you want a fast MVP or a stronger long-term foundation
- Are there any important constraints or deadlines

The goal is not to collect a full form.
The goal is to gather the minimum useful project truth.

## Question Budget

Autopilot mode should keep the initial onboarding question budget small.

Recommended target:
- 5 to 7 questions maximum in the first pass

The system should prefer:
- high-leverage questions
- adaptive follow-up questions
- natural language prompts
- no unnecessary technical jargon

## Adaptive Questioning

Questions should be adaptive, not static.

That means:
- each answer should reduce uncertainty
- obvious facts should not be re-asked
- follow-up questions should depend on project shape
- repeated generic questioning should be avoided

Example:
If the user already said the product is an AI copywriting SaaS, the system should not ask whether the product uses AI.
It should ask the next useful question instead.

## Internal Translation Layer

After onboarding, the system should translate user answers into structured project state such as:

- project type
- target user
- problem statement seed
- product category
- AI-native flag
- speed versus robustness preference
- initial constraints
- current stage readiness

This translation should happen automatically and should not require the user to speak in product-management terminology.

## Auto-Continue Rule

Autopilot mode should continue automatically unless blocked.

This should be the default posture.

The system should not ask:
- “Should I continue?”
after every minor step.

Instead, it should continue until one of the following happens:
- a high-impact decision is required
- confidence falls below threshold
- contradictory information appears
- a quality gate fails
- the user explicitly wants to take over

## Confidence Engine

Autopilot mode should use explicit confidence logic.

Recommended categories:

### High confidence
The system knows enough to continue safely.

### Medium confidence
The system can continue with visible assumptions.

### Low confidence
The system should ask one or more clarifying questions.

### Blocking uncertainty
The system must pause because continuing would be misleading or risky.

## Assumption Policy

Autopilot mode may continue with assumptions only when:
- the assumptions are low-risk
- the assumptions are clearly labeled
- the assumptions do not lock major technical or product decisions
- the user can review them later

Autopilot mode must not silently assume:
- final stack choices
- provider choices
- security claims
- event architecture requirements
- compliance or production guarantees

## Checkpoint Model

Autopilot mode should organize progress around checkpoints rather than isolated commands.

Recommended checkpoints:

### Checkpoint A: Intent Captured
The project idea, target user, and core problem are clear enough.

### Checkpoint B: PRD Ready
The system has enough structured product truth to generate a serious PRD.

### Checkpoint C: Post-PRD Expansion Ready
The PRD is stable enough to expand into execution-readiness artifacts.

### Checkpoint D: Technical Direction Locked
The stack, dependencies, and major architecture direction are stable enough.

### Checkpoint E: Execution Ready
The artifact package is complete enough to begin implementation.

### Checkpoint F: Audit Complete
The repository has been evaluated and a remediation plan exists.

### Checkpoint G: Handoff Ready
The project can be handed into structured execution or ongoing implementation safely.

## What Happens at Each Checkpoint

At every checkpoint, autopilot mode should summarize:

1. what was completed
2. what was learned
3. what remains open
4. what the next best step is
5. whether user approval is required

This summary should be written in plain language.

## Mission-Driven Orchestration

The user-facing autopilot should think in missions, not raw commands.

Example missions:

### Mission 1
Turn the idea into a scoped project

### Mission 2
Generate a strong PRD

### Mission 3
Expand the PRD into execution artifacts

### Mission 4
Lock technical direction

### Mission 5
Prepare for implementation

### Mission 6
Audit and improve the codebase

Commands still exist internally, but missions are easier for non-technical users to follow.

## Stage Sequencing

Autopilot mode should typically drive this early sequence:

1. onboarding
2. `/vibe.init`
3. `/vibe.plan`
4. `/vibe.scaffold`
5. PRD stage
6. post-PRD artifact expansion
7. technical direction lock
8. implementation preparation

The exact path may vary, but the sequencing should remain intentional.

## Specialist Agent Delegation

Autopilot mode should not do all work inside one generalist loop.

It should delegate to specialist agents when the stage requires it.

Example delegation:

- planner for problem framing
- researcher for open questions and alternatives
- architect for system shape and boundaries
- detailer for implementation-ready structure
- qa-guardian for readiness review
- handoff-manager for final handoff packaging

Claude Code’s subagent model is especially aligned with this pattern because subagents are purpose-built, can have separate tool permissions, and operate in separate context windows, which helps preserve clarity and reduce context pollution.  [oai_citation:3‡Claude API Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents?utm_source=chatgpt.com)

## External Skill Coordination

Autopilot mode should coordinate external skills only when they clearly improve the current phase.

Examples:
- install `find-skills` when external skill discovery becomes justified
- install PRD-related skills when entering the PRD stage
- install post-PRD expansion skills when entering artifact expansion
- install focused implementation or quality skills when their phase begins

The Skills CLI is suited to this model because it supports installing only specific skills with `--skill`, targeting specific agents with `--agent`, and project-local installation by default.  [oai_citation:4‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

## Model Escalation Policy

Autopilot mode should support stage-aware model escalation recommendations.

Example trigger conditions:
- detailed PRD generation
- complex architecture synthesis
- long-form execution package generation
- high-stakes document quality tasks

For these cases, VDD may recommend temporarily switching to a stronger model.

OpenAI describes GPT-5.4 as its most capable and efficient frontier model for professional work and notes strong document-generation and knowledge-work performance, with `xhigh` reasoning used in document evaluations.  [oai_citation:5‡OpenAI](https://openai.com/index/introducing-gpt-5-4/?utm_source=chatgpt.com)

Autopilot mode should not force the switch.
It should explain why the stronger model helps at this stage.

## Suggested User-Facing Language for Model Escalation

A recommended explanation pattern is:

"We now have enough clarity to generate a serious document. I can continue with the current model, but if you want a stronger and more detailed result, I recommend temporarily switching to a stronger model for this stage."

## Pause Conditions

Autopilot mode should pause when:

- stack choice is still materially disputed
- AI provider choice is still materially disputed
- event architecture becomes relevant and underdefined
- quality gates fail
- multiple artifacts contradict each other
- user answers shift project direction materially
- the current runtime environment is too uncertain for safe automation

## Artifact Awareness

Autopilot mode should treat artifacts as durable project truth.

That means it should know:
- which artifacts already exist
- which artifacts are missing
- which artifacts are stale
- which artifacts are blockers for the next phase

This allows the system to suggest the next best step based on what is actually present, not just on a generic flow chart.

## Suggested Internal Components

The implementation should eventually include modules such as:

```txt
core/
  autopilot/
    conductor.ts
    question-engine.ts
    checkpoint-policy.ts
    confidence-engine.ts
    next-step-engine.ts
    escalation-policy.ts
    mission-router.ts
    progress-summarizer.ts

These names are conceptual and may evolve.

Suggested Internal Skill and Agent

The system will likely benefit from:
	•	skills/governance/onboarding-guide/SKILL.md
	•	skills/governance/checkpoint-summarizer/SKILL.md
	•	agents/onboarding-guide/AGENT.md

These should support:
	•	onboarding
	•	adaptive questioning
	•	natural-language simplification
	•	checkpoint summaries
	•	next-step suggestions

Output Requirements

Autopilot mode should make its state visible.

A good autopilot summary should answer:
	•	what stage are we in
	•	what just happened
	•	what we learned
	•	what remains uncertain
	•	what the next best step is
	•	whether the system can continue automatically

Failure Handling

If autopilot cannot safely continue, it should:
	•	say exactly why
	•	identify the blocking uncertainty
	•	ask the smallest useful next question
	•	avoid pretending progress
	•	preserve the current state cleanly

Contribution Rule

Contributors extending autopilot mode must declare:
	•	what stage or mission they affect
	•	what triggers continuation or pause
	•	what assumptions they introduce
	•	what checkpoint they strengthen or weaken
	•	how they keep the system explainable

This keeps the orchestration layer inspectable.

V1 Boundary

V1 should support:
	•	guided onboarding
	•	adaptive questioning
	•	checkpoint summaries
	•	auto-continue unless blocked
	•	mission-driven user experience
	•	specialist agent delegation
	•	stage-aware model escalation recommendations
	•	artifact-aware next-step suggestions

V1 should not yet support:
	•	invisible fully autonomous long-horizon execution with no checkpoints
	•	silent high-impact decisions
	•	opaque black-box continuation logic
	•	bypassing core quality gates
	•	replacing the canonical VDD journey with improvisation

The first version should feel clear, helpful, deliberate, and trustworthy.

المفاهيم المتعلقة بـ project-level subagents، YAML frontmatter، tool-specific delegation، separate context windows، وأولوية `.claude/agents/` على `~/.claude/agents/` مبنية على docs الرسمية لـ Claude Code subagents. أما ربط الـ autopilot بتثبيت skills واستخدام `--agent` وproject-local install فهو مبني على docs الرسمية لـ `vercel-labs/skills`. وتوصية model escalation المبنية على document-heavy work تعتمد على وصف OpenAI الرسمي لـ GPT-5.4 وأدائه في professional knowledge work والوثائق.  [oai_citation:6‡Claude API Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents?utm_source=chatgpt.com)

الخطوة التالية المنطقية جدًا هي:
`skills/governance/onboarding-guide/SKILL.md`