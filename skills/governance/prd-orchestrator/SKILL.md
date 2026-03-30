---
name: prd-orchestrator
description: Orchestrate the phased installation and execution of external PRD skills to produce an execution-ready PRD with quality gates between each phase.
category: governance
stage: scaffold
version: 0.1.0
triggers:
  - prd writing
  - prd generation
  - product requirements
  - prd skill stack
inputs:
  required:
    - project-state
    - project-root
  optional:
    - prd-content
    - artifacts-created
    - runtime
    - accept-model-upgrade
    - prd-max-install
outputs:
  - PRD.md
  - Feature-Breakdown.md
  - Implementation-Plan.md
  - Execution-Issues.md
  - PRD-Skill-Bootstrap.md
  - prd-quality-gates
handoff:
  next:
    - vibe-detail
    - vibe-scaffold
    - vibe-qa
authority:
  final: orchestrator
compatibility:
  core: "0.1.x"
  skill_schema: "1.x"
---

# PRD Orchestrator

## Purpose

Orchestrate the phased installation and execution of external PRD skills so the coding agent produces an execution-ready PRD rather than a shallow or generic document.

This skill does not write the PRD itself.
It prepares the agent, installs the right skills at the right time, runs quality gates, and hands off to PRD generation with the correct capabilities active.

## Why This Skill Exists

A weak PRD usually fails in one of these ways:

- too vague
- too feature-list driven
- ignores constraints
- skips measurable success criteria
- hides non-goals
- cannot be turned cleanly into plan or issues

This orchestrator prevents that by installing specialized skills in phases and enforcing quality gates between each phase.

## Core Principle

Do not install every PRD skill at once.

Different skills play different roles at different times:

| Phase | Skills | Role |
|-------|--------|------|
| A | prd, write-a-prd | Discovery + drafting |
| B | prd-development, breakdown-feature-prd | PM refinement + feature breakdown |
| C | prd-to-plan, prd-to-issues | Execution conversion |

VDD remains the orchestrator.
External skills remain specialized helpers.

## Phase Definitions

### Phase A — PRD Foundation

**Triggers:** project intent is clear, target user is clear, success direction is visible.

**Skills to install:**

1. `github/awesome-copilot --skill prd` — Lead discovery skill. Forces problem clarification, success metrics, constraints, non-goals, and structured drafting.
2. `mattpocock/skills --skill write-a-prd` — Drafting support. Transforms clarified input into a complete PRD draft.

**Quality Gate (Gate 1 — Core Problem):**
- problem statement present
- target user present
- success definition present

**Expected artifact:** PRD.md

**Transition rule:** Phase A skills are installed first. Gate 1 must pass before the agent begins discovery.

### Phase B — PRD Refinement

**Triggers:** first PRD draft exists.

**Skills to install:**

1. `deanpeters/product-manager-skills --skill prd-development` — PM refinement. Strengthens product framing, prioritization, acceptance criteria, market context.
2. `github/awesome-copilot --skill breakdown-feature-prd` — Feature breakdown. Splits the PRD into feature units with clear hierarchy.

**Quality Gates (Gate 2 + Gate 3):**
- scope defined (in-scope, out-of-scope)
- non-goals listed
- constraints listed
- success criteria measurable
- acceptance criteria present

**Expected artifact:** Feature-Breakdown.md

**Transition rule:** Phase B installs after first draft. Gate 2 + Gate 3 must pass before refinement begins.

### Phase C — PRD to Execution

**Triggers:** PRD is stable.

**Skills to install:**

1. `mattpocock/skills --skill prd-to-plan` — Plan conversion. Translates PRD into execution plan with phases and milestones.
2. `mattpocock/skills --skill prd-to-issues` — Issue conversion. Converts PRD into actionable issues.

**Quality Gate (Gate 4 + Gate 5):**
- technical assumptions documented
- integration considerations addressed
- security/privacy noted (when relevant)
- Feature-Breakdown.md exists
- Implementation-Plan.md exists
- Execution-Issues.md exists

**Expected artifacts:** Implementation-Plan.md, Execution-Issues.md

## Orchestration Sequence

```
1. Readiness check
   └─ Is the project ready for PRD work?
      ├─ No  → Stay in clarification mode
      └─ Yes → Continue to step 2

2. Install Phase A skills
   └─ npx skills add github/awesome-copilot --skill prd --agent <runtime> -y
   └─ npx skills add mattpocock/skills --skill write-a-prd --agent <runtime> -y

3. Run Gate 1 validation
   └─ Check: problemStatement, targetUser, successDefinition
      ├─ Blocked → Surface what's missing, ask clarifying questions
      └─ Passed → Continue to step 4

4. Discovery + Drafting (Phase A execution)
   └─ Lead skill interrogates user
   └─ Drafting skill generates PRD.md

5. Install Phase B skills
   └─ npx skills add deanpeters/product-manager-skills --skill prd-development --agent <runtime> -y
   └─ npx skills add github/awesome-copilot --skill breakdown-feature-prd --agent <runtime> -y

6. Run Gate 2 + Gate 3 validation
   └─ Check: scope, non-goals, constraints, success criteria, acceptance criteria
      ├─ Blocked → Refine, then re-check
      └─ Passed → Continue to step 7

7. Refinement + Breakdown (Phase B execution)
   └─ PM skill reviews and strengthens PRD
   └─ Breakdown skill produces Feature-Breakdown.md

8. Install Phase C skills
   └─ npx skills add mattpocock/skills --skill prd-to-plan --agent <runtime> -y
   └─ npx skills add mattpocock/skills --skill prd-to-issues --agent <runtime> -y

9. Run Gate 4 + Gate 5 validation
   └─ Check: technical bridge, execution artifacts
      ├─ Blocked → Generate missing artifacts, then re-check
      └─ Passed → PRD stage complete

10. Report completion
    └─ Announce artifacts created
    └─ Recommend next workflow step
```

## Quality Gate Details

### Gate 1 — Core Problem Gate
Validates that the project has enough intent to justify PRD work.
Checks: problem statement, target user, success definition.
Source: project state.

### Gate 2 — Scope Gate
Validates that the PRD defines boundaries.
Checks: in-scope items, out-of-scope items, non-goals, constraints.
Source: PRD content.

### Gate 3 — Success Gate
Validates that success is measurable.
Checks: success criteria, acceptance criteria, validation direction.
Source: PRD content.

### Gate 4 — Technical Bridge Gate
Validates that the PRD connects product thinking to technical execution.
Checks: technical assumptions, integration considerations, security/privacy.
Source: PRD content.

### Gate 5 — Execution Gate
Validates that the PRD has been converted into execution artifacts.
Checks: Feature-Breakdown.md, Implementation-Plan.md, Execution-Issues.md.
Source: artifact list.

## Model Escalation Policy

The PRD stage is one of the most model-sensitive parts of the VDD journey.

When the PRD requires deep synthesis, long-form structure, strong product reasoning, rich technical sections, measurable acceptance criteria, or risk and roadmap thinking, recommend temporarily switching to a stronger model.

Recommended guidance:
- Anthropic users: Claude Opus 4.6 where available
- OpenAI/Codex users: GPT-5.4 with xhigh reasoning
- Gemini users: Gemini 3.1 Pro

Do not force model switching. Explain the benefit clearly and let the user decide.

## Autopilot Policy

This skill supports autopilot behavior when:
- confidence is high
- user intent is stable
- no major contradictory answers remain

Pause for approval when:
- project intent is changing materially
- stack or provider tradeoffs are unresolved
- PRD has major open questions
- model escalation is recommended but not yet accepted

## Failure Handling

If any skill install fails:
- say exactly what failed
- preserve current project state
- continue with VDD-native drafting logic if possible
- produce manual install guidance when needed
- mark the related artifact as incomplete

If one conversion skill fails:
- keep the PRD stage alive
- mark the related execution artifact as incomplete
- do not pretend the PRD is done

## Output Contract

This skill produces:
- PRD.md — the main product requirements document
- Feature-Breakdown.md — features split into units
- Implementation-Plan.md — execution plan with phases
- Execution-Issues.md — actionable work items

Optional supporting outputs:
- Acceptance-Criteria.md
- Open-Questions.md
- Risk-Register.md
- PRD-Skill-Bootstrap.md — documentation of what was installed and why

## Anti-Fragility Rules

Do not:
- install every PRD skill at once
- let multiple skills compete for leadership simultaneously
- treat a pretty document as a complete PRD
- skip discovery
- skip non-goals
- skip measurable criteria
- convert to plan before the PRD is stable
- convert to issues before the plan is coherent

## Handoff Behavior

After successful PRD orchestration:
- all artifacts are written to disk
- quality gate results are documented
- the next recommended step is explicit
- deferred skills are documented in the roadmap
- the project moves toward detail, scaffold, or QA
