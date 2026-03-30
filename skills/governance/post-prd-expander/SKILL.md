---
name: post-prd-expander
description: Expand a completed PRD into the full execution-readiness artifact package across 3 ordered layers with quality gates, post-PRD skill bootstrapping, and autopilot decision checkpoints.
category: governance
stage: scaffold
version: 0.1.0
triggers:
  - post-prd expansion
  - artifact expansion
  - execution readiness
  - after prd
  - expand prd
inputs:
  required:
    - project-state
    - project-root
    - prd-content
  optional:
    - runtime
    - agent
    - accept-decisions
outputs:
  - Scope.md
  - Open-Questions.md
  - Logic.md
  - Stack-Decision.md
  - AI-Provider-Decision.md
  - Architecture.md
  - ADR-0001-initial-decisions.md
  - Dependencies.md
  - Event-Architecture.md
  - repo.md
  - Validation-Plan.md
  - Test-Strategy.md
  - Implementation-Plan.md
  - Execution-Issues.md
  - Risk-Register.md
  - Memory.md
  - anti-hallucination.md
  - Runbook.md
  - Post-PRD-Expansion.md
handoff:
  next:
    - vibe-qa
    - vibe-handoff-to-spec
authority:
  final: orchestrator
compatibility:
  core: "0.1.x"
  skill_schema: "1.x"
---

# Post-PRD Expander

## Purpose

Expand a completed PRD into the full execution-readiness artifact package.

A good PRD is necessary but not sufficient. A project is still not execution-ready if it lacks:
- explicit scope boundaries
- open questions tracking
- business and system logic clarity
- architecture decisions
- dependency and stack rationale
- validation and test planning
- implementation and issue breakdown
- risk visibility
- memory and anti-hallucination guardrails
- operational runbook context

This skill bridges the gap between a strong PRD and a truly build-ready project package.

## When to Use

Use this skill when:
- PRD.md exists and has passed PRD quality gates
- The PRD contains scope, success criteria, and constraints
- The project has enough context (problem statement, target user)
- The project is ready to move from specification into execution preparation

## When Not to Use

Do not use this skill when:
- The PRD is still in discovery-only form
- The PRD lacks scope, success criteria, or constraints
- The project context is too weak (no problem statement, no target user)
- The user wants to stay in PRD refinement mode

## Entry Rule

The expansion starts only when all of the following are true:
- the problem statement is stable enough
- the target user is stable enough
- core success criteria are visible
- major constraints are visible
- the PRD is no longer in discovery-only form
- the PRD can already support breakdown into implementation planning

## Post-PRD Skill Bootstrap

Before generating artifacts, install these skills in order:

### Install-Now Skills

```bash
npx skills add github/awesome-copilot --skill breakdown-feature-prd --agent <runtime> -y
npx skills add mattpocock/skills --skill prd-to-plan --agent <runtime> -y
npx skills add mattpocock/skills --skill prd-to-issues --agent <runtime> -y
npx skills add deanpeters/product-manager-skills --skill prd-development --agent <runtime> -y
npx skills add github/awesome-copilot --skill agentic-eval --agent <runtime> -y
```

| Skill | Role |
|---|---|
| breakdown-feature-prd | Splits PRD into feature structure |
| prd-to-plan | Converts PRD into implementation planning |
| prd-to-issues | Converts PRD into actionable work units |
| prd-development | PM refinement pass on product framing |
| agentic-eval | Generate → Evaluate → Critique → Refine loop |

## Ordered Expansion Model

Artifacts are generated in 3 layers. No artifact in a deeper layer should be treated as final if a shallower layer is still unstable.

### Layer 1: Lock the Execution Truth

Generate first:
- `Scope.md` — in-scope, out-of-scope, non-goals, future work
- `Open-Questions.md` — unresolved choices, blocked assumptions, external unknowns
- `Logic.md` — business logic, user flows, state transitions, operational rules
- `Stack-Decision.md` — selected stack, rejected alternatives, rationale, revisit conditions
- `AI-Provider-Decision.md` — (conditional) provider/model choice, rationale, alternatives

**Why Layer 1 comes first:** These files lock down what is in and out, what is still unknown, how the system should behave, and what technical direction is assumed. Without these, deeper design artifacts become fragile.

### Layer 2: Design the System Shape

Generate second:
- `Architecture.md` — major components, boundaries, data flow, external systems
- `ADR-0001-initial-decisions.md` — architecture decisions with context and trade-offs
- `Dependencies.md` — major libraries, services, rationale, risks
- `Event-Architecture.md` — (conditional) event-driven patterns, async flows, ordering
- `repo.md` — repository layout, folder purpose, conventions

**Why Layer 2 comes second:** These files depend on a stable problem frame and execution truth. They define system boundaries, architectural rationale, dependency choices, and repository structure.

### Layer 3: Prepare Execution and Quality

Generate third:
- `Validation-Plan.md` — how success will be checked, what evidence counts
- `Test-Strategy.md` — unit, integration, E2E coverage plan, deferral decisions
- `Implementation-Plan.md` — execution phases, order, dependencies, cut lines
- `Execution-Issues.md` — discrete work units with priorities and dependencies
- `Risk-Register.md` — technical, product, and dependency risks with mitigation
- `Memory.md` — stable project truths and persistent agent context
- `anti-hallucination.md` — guardrails for what the agent must not invent
- `Runbook.md` — operational steps: setup, reset, recovery, error handling

**Why Layer 3 comes last:** These files should be based on stable scope, logic, architecture, and dependency choices. If generated too early, they become shallow or misleading.

## Evaluation and Refinement Loop

After each layer, run a quality pass using the agentic-eval pattern:

For each layer:
1. generate artifacts
2. evaluate them
3. identify contradictions or weak sections
4. refine them
5. only then continue to the next layer

### Refinement Questions

Ask these for each artifact:
- is this artifact grounded in the PRD
- does it contradict another artifact
- is it too vague for execution
- does it hide major assumptions
- does it omit non-goals or constraints
- is it specific enough to guide implementation
- does it create a misleading sense of certainty

## Autopilot Behavior

This skill supports autopilot mode, but not reckless autopilot.

**Continue automatically when:**
- the PRD is stable
- the project profile is stable
- the current layer has no major contradictions
- the skill installs succeeded
- no major high-impact decision is still unresolved

**Pause when:**
- stack choice is still disputed
- AI provider choice is still disputed
- event architecture becomes relevant and underdefined
- multiple artifacts begin to contradict each other
- the user's answers materially change the direction of the project
- the quality loop concludes that the PRD is not strong enough after all

## High-Impact Decision Points

The expansion flow stops for user review at these points:

### 1. Stack Lock Point
Before Stack-Decision.md is finalized if multiple viable options remain.

### 2. AI Provider Lock Point
Before AI-Provider-Decision.md is finalized when the product is AI-native.

### 3. Event Relevance Lock Point
Before Event-Architecture.md is finalized when the system becomes async-heavy.

### 4. Execution Commitment Point
Before Implementation-Plan.md and Execution-Issues.md are treated as execution truth.

## Artifact-Specific Notes

| Artifact | Must Contain |
|---|---|
| Scope.md | in scope, out of scope, non-goals, future work |
| Open-Questions.md | unresolved choices, blocked assumptions, external unknowns, decisions waiting on input |
| Logic.md | business logic, user flow logic, state transitions, operational rules |
| Architecture.md | major components, boundaries, data flow, external systems, responsibility split |
| ADR-0001-initial-decisions.md | key decision, context, options considered, choice made, tradeoffs, revisit conditions |
| Stack-Decision.md | selected stack, rejected alternatives, why the choice won, what could change later |
| Dependencies.md | major libraries, why they are used, risks or constraints |
| Validation-Plan.md | how success will be checked, what evidence counts, what experiments matter |
| Test-Strategy.md | unit tests, integration tests, E2E coverage, what is deferred |
| Implementation-Plan.md | execution phases, order of implementation, dependency relationships, cut lines |
| Execution-Issues.md | discrete work units, issue-ready descriptions, priorities, dependencies |
| Risk-Register.md | technical risks, product risks, provider risks, mitigation direction |
| AI-Provider-Decision.md | provider choice, model choice, why it fits, when to revisit |
| Event-Architecture.md | events, consumers, ordering, idempotency, correlation IDs |
| Memory.md | stable project truths, recurring assumptions, persistent context |
| anti-hallucination.md | what must not be invented, what must be TBD, what needs verification |
| repo.md | repo layout, folder purpose, where new files should live |
| Runbook.md | setup, reset, seed, recovery, error handling steps |

## Quality Gates for Expansion Completion

The post-PRD expansion is not complete until:

**Gate 1:** Layer 1 artifacts exist and are internally consistent.

**Gate 2:** Layer 2 artifacts exist and are internally consistent.

**Gate 3:** Layer 3 artifacts exist and are actionable.

**Gate 4:** No critical contradictions remain across artifacts.

**Gate 5:** The project has enough durable execution context for implementation to begin without relying on hidden chat memory.

## Sequencing Rule

No artifact in a deeper layer should be treated as final if an artifact in a shallower layer is still unstable.

That means:
- do not finalize architecture before scope and logic stabilize
- do not finalize implementation plan before architecture stabilizes
- do not finalize issues before the implementation plan stabilizes

## Failure Handling

If skill installation fails:
- state exactly what failed
- preserve current state
- continue with internal fallback logic where possible
- produce a manual install plan if needed
- do not pretend the skill stack is active

If artifact generation fails for a layer:
- stop at that layer
- summarize what is complete
- summarize what is incomplete
- state what blocks the next layer

## User-Facing Language

A recommended explanation is:

> We have a strong PRD now. I am going to expand it into the rest of the execution package in stages. First I will lock the scope and logic, then define architecture and technical decisions, then prepare the build and validation plan.

## Anti-Fragility Rules

Do not:
- generate all 18 artifacts at once
- create artifacts in random order
- treat every artifact as equally urgent
- replace user approval at major lock points
- pretend a PRD alone is execution-ready
- finalize downstream artifacts before upstream ones stabilize

## Handoff Behavior

After successful expansion:
- all 18 artifacts are written to disk
- quality gate results are documented
- high-impact decisions are flagged for approval
- the next recommended step is explicit
- the project moves toward QA or handoff
