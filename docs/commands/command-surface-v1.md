# Command Surface V1

## Purpose

This document defines the first stable command surface for Vibe Driven Dev.

Its job is to make the system predictable, learnable, and extensible.

The command layer is not just syntax.
It is the public operating interface for the framework.

Every command must map cleanly to:
- a system stage
- a state transition
- a skill or internal orchestration flow
- one or more expected artifacts
- clear failure or halt behavior

This document is versioned because command behavior is part of the product contract.

## Command Design Goals

The command surface must be:

### Clear
A user should understand what a command does from its name alone.

### Stage-aware
Commands should reflect the current project state and not allow incoherent jumps.

### Small in V1
The first release should expose only the commands required to run the core journey.

### Extensible
New commands may be added later through packs or future versions, without breaking the core model.

### Handoff-friendly
The command surface must support a clean transition into Spec-Kit when the project is ready.

## Core Rule

Vibe Driven Dev owns pre-execution clarity.

Spec-Kit owns structured execution.

Therefore, Vibe Driven Dev commands should focus on:
- framing
- scoping
- research
- blueprinting
- safety and readiness
- handoff preparation

They should not try to replicate the full downstream execution workflow.

## Command Naming Convention

All public commands use the following format:

`/vibe.<action>`

Examples:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.research`
- `/vibe.blueprint`

This keeps the command surface:
- namespaced
- readable
- scalable
- easy to extend in packs later

## V1 Public Commands

### `/vibe.init`

#### Purpose
Start a new Vibe Driven Dev journey.

#### What it does
This command initializes the project context and establishes the minimum required execution frame.

It should collect or confirm:
- target platform or environment
- intended user or audience
- success definition

If additional information is helpful but non-critical, the system may ask a small number of clarification questions or proceed with explicitly labeled assumptions.

#### Outputs
- initial project state
- initial assumptions log
- journey entry confirmation

#### Transition
Moves the system into the initial planning state.

#### Refusal or Halt Conditions
- no usable platform context
- no intended user
- no success definition

---

### `/vibe.plan`

#### Purpose
Turn vague intent into a defined problem worth solving.

#### What it does
This command frames the project in product terms before any execution logic begins.

It should produce:
- problem statement
- target user framing
- scope boundaries
- non-goals
- success metrics draft
- kill criteria

#### Outputs
- `problem-statement.md`
- `scope.md`
- `success-definition.md`

#### Transition
Moves the system from raw intent into a valid planning state.

#### Refusal or Halt Conditions
- unresolved ambiguity that affects core scope
- feature list without problem framing
- success cannot be measured

---

### `/vibe.research`

#### Purpose
Ground the project in evidence instead of momentum.

#### What it does
This command turns the initial plan into a better-informed foundation.

It should examine:
- market or domain context
- alternatives
- known patterns
- visible risks
- assumptions that need evidence

Research may be lightweight in an MVP flow, but it must still make contradictions and uncertainties visible.

#### Outputs
- `research-summary.md`
- `risk-register.md`
- `assumptions-log.md`

#### Transition
Moves the system from scoped intent to evidence-backed design readiness.

#### Refusal or Halt Conditions
- planning has not been completed
- claims are purely opinion-based
- major assumptions are invisible

---

### `/vibe.blueprint`

#### Purpose
Design a viable system before implementation begins.

#### What it does
This command creates the high-level system direction.

It should define:
- architecture baseline
- system boundaries
- major components
- data and flow expectations
- core feature grouping
- measurement and analytics outline

#### Outputs
- `architecture-baseline.md`
- `system-boundaries.md`
- `analytics-outline.md`

#### Transition
Moves the project into a buildable but not yet execution-approved state.

#### Refusal or Halt Conditions
- planning is incomplete
- research is missing when needed
- architecture is inconsistent with scope
- the system is clearly overbuilt for the intended stage

---

### `/vibe.detail`

#### Purpose
Translate the blueprint into execution-ready detail.

#### What it does
This command turns the high-level system shape into artifacts that downstream execution can use.

It may define:
- technical specifications
- validation paths
- prompt kits
- flow details
- schemas
- key implementation constraints

#### Outputs
- `technical-detail.md`
- `validation-plan.md`
- `execution-notes.md`

#### Transition
Moves the project toward readiness review.

#### Refusal or Halt Conditions
- no approved blueprint
- undefined system behavior remains
- validation logic is absent

---

### `/vibe.qa`

#### Purpose
Check whether the project is safe and coherent enough to proceed.

#### What it does
This command runs the final pre-handoff review.

It must evaluate:
- security and privacy risk visibility
- tracking and measurement readiness
- execution reality check
- unresolved assumptions
- major technical tradeoffs
- readiness for downstream execution

#### Outputs
- `qa-report.md`
- `go-no-go.md`
- updated `assumptions-log.md`
- any required decision records

#### Transition
If successful, the system becomes eligible for handoff.

#### Refusal or Halt Conditions
- critical risk remains unresolved
- measurement path is missing
- architecture is not feasible enough for execution
- security concerns are ignored

---

### `/vibe.next`

#### Purpose
Advance intelligently from the current state.

#### What it does
This is the smart navigation command.

Instead of forcing the user to remember the exact next stage, it reads the current project state and recommends or executes the next valid step.

It should:
- inspect current round
- inspect completed artifacts
- inspect open assumptions
- inspect failed or pending gates
- route to the next valid command

#### Outputs
- next step recommendation
- blocking issues, if any
- optional automatic routing

#### Transition
Depends on current state.

#### Refusal or Halt Conditions
- state file missing or invalid
- current stage is inconsistent
- unresolved blockers prevent forward movement

---

### `/vibe.resume`

#### Purpose
Resume work from an existing Vibe Driven Dev state.

#### What it does
This command reloads the active context from existing artifacts and project state.

It is used when:
- work is continued in a later session
- the user returns after interruption
- the system needs to reconstruct context without restarting the journey

#### Outputs
- restored project state
- summary of current stage
- open assumptions
- next recommended action

#### Transition
Returns the user to the correct current stage.

#### Refusal or Halt Conditions
- no recoverable state exists
- artifacts are incomplete or corrupted
- the project state cannot be trusted

---

### `/vibe.status`

#### Purpose
Show where the project currently stands.

#### What it does
This command provides a concise operational summary.

It should show:
- current stage
- completed artifacts
- pending artifacts
- open assumptions
- decision count
- gate status
- handoff readiness

#### Outputs
- state summary
- readiness snapshot

#### Transition
No state transition.
This is a read-only command.

---

### `/vibe.assumptions`

#### Purpose
Inspect or update visible assumptions.

#### What it does
This command exposes the assumptions layer directly so the system never hides uncertain reasoning.

It should support:
- listing assumptions
- marking assumptions as validated
- marking assumptions as risky
- attaching assumptions to a stage or artifact

#### Outputs
- updated `assumptions-log.md`

#### Transition
No required stage change.

---

### `/vibe.decide`

#### Purpose
Record a major product or technical decision.

#### What it does
This command creates a formal decision record whenever the project makes a meaningful choice.

Examples:
- choosing a stack
- selecting an auth pattern
- cutting scope
- accepting a risk
- choosing a model or vendor
- selecting a handoff boundary

#### Outputs
- `decision-records/DEC-xxxx.json`

#### Transition
No direct stage transition, but the decision becomes part of the authoritative project state.

#### Refusal or Halt Conditions
- the decision is vague
- no rationale is provided
- no assumptions or tradeoffs are visible

---

### `/vibe.handoff-to-spec`

#### Purpose
Transfer a project from Vibe Driven Dev into structured execution.

#### What it does
This command prepares the project for Spec-Kit.

It should:
- verify handoff readiness
- collect required artifacts
- summarize decisions
- summarize assumptions
- define execution entry context
- tell the user exactly what to do next in Spec-Kit

This command does not execute the full implementation workflow itself.

#### Outputs
- `spec-handoff.md`
- `initial-decisions.json`
- `execution-entry-summary.md`

#### Transition
Ends the Vibe Driven Dev pre-execution journey and prepares the project for Spec-Kit.

#### Refusal or Halt Conditions
- planning is incomplete
- no valid blueprint exists
- QA has not passed
- critical unresolved risk remains

---

### `/vibe.audit`

#### Purpose
Audit a repository against curated coding standards and produce a structured remediation roadmap.

#### What it does
This command scans the codebase, selects the relevant rule packs based on project shape, compares implementation patterns against those rules, generates structured issues with evidence, and produces a prioritized sprint plan.

It operates in **autopilot mode**: repository scan → rule selection → comparison → issue generation → remediation plan → sprint planning → executive summary.

#### Variants
- `/vibe.audit` — full audit pipeline
- `/vibe.audit --focus <area>` — focused audit (architecture, testing, security, performance, events, accessibility)
- `/vibe.audit --mode report` — report only
- `/vibe.audit --mode fix-plan` — remediation plan only
- `/vibe.audit --mode sprints` — sprint plan only

#### Outputs
- `.vdd/audits/<timestamp>/Audit-Report.md`
- `.vdd/audits/<timestamp>/Audit-Issues.json`
- `.vdd/audits/<timestamp>/Refactor-Plan.md`
- `.vdd/audits/<timestamp>/Sprint-Plan.md`
- `.vdd/audits/<timestamp>/Rule-Coverage.md` (optional)

#### Skill
`skills/governance/codebase-auditor/SKILL.md`

#### Stage
Cross-stage. Can be used at any point in the VDD journey or independently.

#### Transition
No required state transition. This is a review and planning command.

#### Refusal or Halt Conditions
- repository root cannot be determined
- no rule reference files are accessible
- codebase is too large without scoping guidance (suggest `--focus`)
- project type is completely ambiguous

#### Read-only rule
This command does not mutate the codebase. Output is findings, plan, and recommendations only.

---

## Command Roles in the Journey

The default journey is:

1. `/vibe.init`
2. `/vibe.plan`
3. `/vibe.research`
4. `/vibe.blueprint`
5. `/vibe.detail`
6. `/vibe.qa`
7. `/vibe.handoff-to-spec`

Supporting commands:
- `/vibe.next`
- `/vibe.resume`
- `/vibe.status`
- `/vibe.assumptions`
- `/vibe.decide`

Governance commands:
- `/vibe.audit`

## Stage Rules

### Rule 1
A command must not silently skip required upstream stages.

### Rule 2
A command may proceed with assumptions only when the assumptions do not create hidden safety or feasibility risk.

### Rule 3
A command must generate or update state-aware artifacts, not just conversational output.

### Rule 4
A command must surface halt conditions clearly.

### Rule 5
A command may recommend handoff, but only `/vibe.handoff-to-spec` formally performs the transition.

## Pack Extension Rule

Future packs may introduce additional commands, but they must follow the same namespace model:

`/vibe.<action>`

Pack commands must:
- declare whether they are core or optional
- declare which stage they belong to
- declare required artifacts or prerequisites
- declare whether they are read-only or state-changing

No pack command should weaken or bypass the core journey rules.

## Versioning Rule

This file defines the V1 public command contract.

Any change to command meaning, transition behavior, or required outputs should be treated as a product-level change and versioned accordingly.
