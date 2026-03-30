# Post PRD Artifact Expansion

## Purpose

This document defines how Vibe Driven Dev expands a completed PRD into the full execution-readiness artifact package.

The goal is not to generate many documents at once.

The goal is to:

- recognize when `PRD.md` is strong enough
- install the right external skills for the post-PRD phase
- orchestrate those skills in the correct order
- expand the PRD into the remaining execution artifacts
- refine each artifact through evaluation loops
- stop only at high-impact decision points
- hand the project into execution with a complete and durable artifact set

## Why This Layer Exists

A good `PRD.md` is necessary but not sufficient.

A project is still not execution-ready if it lacks:

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

The post-PRD expansion layer exists to bridge the gap between a strong PRD and a truly build-ready project package.

## Core Principle

Do not expand the PRD in a flat or random order.

Different artifacts depend on different levels of certainty.

That means VDD must:

- install the right post-PRD skills first
- group artifact generation into ordered layers
- refine artifacts before moving deeper
- avoid generating downstream documents from unstable upstream assumptions

## Relationship to the PRD Skill Stack

This layer starts only after the PRD stage has passed its own quality gates.

That means:

- `PRD.md` exists
- the PRD has gone through discovery and drafting
- the PRD has been refined
- the PRD is stable enough to drive downstream artifacts
- feature breakdown and early planning conversion are either complete or ready to begin

The upstream PRD stack is supported by skills such as `prd`, `write-a-prd`, `prd-development`, `breakdown-feature-prd`, `prd-to-plan`, and `prd-to-issues`, while `agentic-eval` provides an explicit generate → evaluate → critique → refine loop that is well-suited for quality passes during artifact expansion.  [oai_citation:0‡Skills](https://skills.sh/github/awesome-copilot/prd)

## Entry Rule

VDD should enter post-PRD artifact expansion only when all of the following are true:

- the problem statement is stable enough
- the target user is stable enough
- core success criteria are visible
- major constraints are visible
- the PRD is no longer in discovery-only form
- the PRD can already support breakdown into implementation planning

If these are not true, VDD should remain in PRD refinement mode.

## Canonical Artifact Set

After `PRD.md`, the remaining artifact set should be treated as the execution-readiness package.

The default package contains:

1. `Scope.md`
2. `Open-Questions.md`
3. `Logic.md`
4. `Architecture.md`
5. `ADR-0001-initial-decisions.md`
6. `Stack-Decision.md`
7. `Dependencies.md`
8. `Validation-Plan.md`
9. `Test-Strategy.md`
10. `Implementation-Plan.md`
11. `Execution-Issues.md`
12. `Risk-Register.md`
13. `AI-Provider-Decision.md`
14. `Event-Architecture.md`
15. `Memory.md`
16. `anti-hallucination.md`
17. `repo.md`
18. `Runbook.md`

VDD may omit or defer some artifacts when the project is clearly too simple to justify them, but the default assumption should be completeness, not minimalism.

## Why External Skills Are Installed Before Expansion

The open skills ecosystem already provides specialized skills for:

- PRD development
- feature breakdown
- PRD-to-plan conversion
- PRD-to-issues conversion
- evaluation and refinement loops

The `find-skills` skill from `vercel-labs/skills` is explicitly designed to discover and install specialized skills from the ecosystem, and its guidance recommends first understanding the user’s need, then searching, then verifying source quality and install signal before installation. The Skills CLI also supports `npx skills find`, `npx skills add`, `--skill`, `--agent`, `-g`, and `-y`, which makes staged skill bootstrapping practical inside VDD.  [oai_citation:1‡Skills](https://skills.sh/vercel-labs/skills/find-skills)

## Post-PRD Skill Bootstrap Policy

When VDD confirms that `PRD.md` is ready, it should install a focused post-PRD skill stack rather than a broad bundle.

### Foundation post-PRD skills

Install first:

```bash
npx skills add https://github.com/github/awesome-copilot --skill breakdown-feature-prd --agent <detected-agent> -y
npx skills add https://github.com/mattpocock/skills --skill prd-to-plan --agent <detected-agent> -y
npx skills add https://github.com/mattpocock/skills --skill prd-to-issues --agent <detected-agent> -y
npx skills add https://github.com/deanpeters/product-manager-skills --skill prd-development --agent <detected-agent> -y
npx skills add https://github.com/github/awesome-copilot --skill agentic-eval --agent <detected-agent> -y

Why this stack
	•	breakdown-feature-prd helps split the PRD into feature structure
	•	prd-to-plan helps turn PRD content into implementation planning
	•	prd-to-issues helps turn PRD content into work units
	•	prd-development adds a product-management refinement pass
	•	agentic-eval adds a structured critique/refinement loop

This keeps the expansion stage disciplined and quality-driven instead of one-shot.  ￼

Project-Local First Rule

These skills should be installed at project scope by default.

The Skills CLI documents project installation as the default and global installation only when -g is used. VDD should therefore prefer project-local installation unless the runtime or user preference clearly requires global scope.  ￼

Runtime Awareness

When runtime detection is strong enough, VDD should pass --agent <detected-agent> during skill installation.

The Skills CLI documents support for agent-targeted installation and broad agent compatibility across tools such as Claude Code, Codex, Cursor, OpenCode, and others.  ￼

Ordered Expansion Model

The post-PRD artifacts must be generated in layers.

Layer 1: Lock the execution truth

Generate first:
	•	Scope.md
	•	Open-Questions.md
	•	Logic.md
	•	Stack-Decision.md
	•	AI-Provider-Decision.md

Why Layer 1 comes first

These files lock down:
	•	what is in and out
	•	what is still unknown
	•	how the system should behave
	•	what technical direction is assumed
	•	what AI dependency choices exist

Without these, deeper design artifacts become fragile.

Layer 2: Design the system shape

Generate second:
	•	Architecture.md
	•	ADR-0001-initial-decisions.md
	•	Dependencies.md
	•	Event-Architecture.md
	•	repo.md

Why Layer 2 comes second

These files depend on a stable problem frame and a stable execution truth.

This layer defines:
	•	system boundaries
	•	architectural rationale
	•	dependency choices
	•	event modeling where needed
	•	repository structure conventions

Layer 3: Prepare execution and quality

Generate third:
	•	Validation-Plan.md
	•	Test-Strategy.md
	•	Implementation-Plan.md
	•	Execution-Issues.md
	•	Risk-Register.md
	•	Memory.md
	•	anti-hallucination.md
	•	Runbook.md

Why Layer 3 comes last

These files should be based on:
	•	stable scope
	•	stable logic
	•	stable architecture
	•	stable dependency and stack choices

If they are generated too early, they become shallow or misleading.

Evaluation and Refinement Loop

After each layer, VDD should run a refinement pass instead of continuing blindly.

agentic-eval is especially suitable here because it is explicitly designed for iterative generate → evaluate → critique → refine workflows. VDD should treat it as a quality loop rather than a direct replacement for artifact generation.  ￼

The required pattern

For each layer:
	1.	generate artifacts
	2.	evaluate them
	3.	identify contradictions or weak sections
	4.	refine them
	5.	only then continue to the next layer

Suggested Refinement Questions

The evaluation loop should ask questions such as:
	•	is this artifact grounded in the PRD
	•	does it contradict another artifact
	•	is it too vague for execution
	•	does it hide major assumptions
	•	does it omit non-goals or constraints
	•	is it specific enough to guide implementation
	•	does it create a misleading sense of certainty

Autopilot Behavior

This stage should support autopilot mode, but not reckless autopilot.

VDD may continue automatically when:
	•	the PRD is stable
	•	the project profile is stable
	•	the current layer has no major contradictions
	•	the skill installs succeeded
	•	no major high-impact decision is still unresolved

VDD should pause when:
	•	stack choice is still disputed
	•	AI provider choice is still disputed
	•	event architecture becomes relevant and underdefined
	•	multiple artifacts begin to contradict each other
	•	the user’s answers materially change the direction of the project
	•	the quality loop concludes that the PRD is not strong enough after all

High-Impact Decision Points

The expansion flow should stop for user review at these points:

1. Stack lock point

Before Stack-Decision.md is finalized if multiple viable options remain.

2. AI provider lock point

Before AI-Provider-Decision.md is finalized when the product is AI-native.

3. Event relevance lock point

Before Event-Architecture.md is finalized when the system becomes async-heavy or integration-heavy.

4. Execution commitment point

Before Implementation-Plan.md and Execution-Issues.md are treated as execution truth.

Artifact-Specific Notes

Scope.md

Must clearly separate:
	•	in scope
	•	out of scope
	•	non-goals
	•	future work not included now

Open-Questions.md

Must list:
	•	unresolved choices
	•	blocked assumptions
	•	external unknowns
	•	decisions waiting on user input

Logic.md

Must describe:
	•	business logic
	•	user flow logic
	•	state transitions
	•	important operational rules

Architecture.md

Must describe:
	•	major components
	•	boundaries
	•	data flow
	•	external systems
	•	responsibility split

ADR-0001-initial-decisions.md

Must capture:
	•	key decision
	•	context
	•	options considered
	•	choice made
	•	tradeoffs
	•	revisit conditions

Stack-Decision.md

Must state:
	•	selected stack
	•	rejected alternatives
	•	why the choice won
	•	what could change later

Dependencies.md

Must explain:
	•	major libraries
	•	why they are used
	•	what risks or constraints they bring

Validation-Plan.md

Must define:
	•	how success will be checked
	•	what evidence will count
	•	what experiments or tests matter

Test-Strategy.md

Must define:
	•	what gets unit tests
	•	what gets integration tests
	•	what gets E2E coverage
	•	what is intentionally deferred

Implementation-Plan.md

Must define:
	•	execution phases
	•	order of implementation
	•	dependency relationships
	•	cut lines

Execution-Issues.md

Must convert execution work into:
	•	discrete work units
	•	issue-ready descriptions
	•	priorities
	•	dependencies where needed

Risk-Register.md

Must track:
	•	technical risks
	•	product risks
	•	provider or dependency risks
	•	mitigation direction

AI-Provider-Decision.md

Must explain:
	•	provider choice
	•	model choice
	•	why the choice fits the use case
	•	when it should be revisited

Event-Architecture.md

Must exist when the project has:
	•	background jobs
	•	notifications
	•	webhooks
	•	analytics side effects
	•	AI generation jobs
	•	multiple consumers for the same event

Memory.md

Must preserve:
	•	stable project truths
	•	recurring assumptions
	•	persistent context the agent should not lose

anti-hallucination.md

Must define:
	•	what the agent must not invent
	•	what must be marked TBD
	•	what requires explicit verification

repo.md

Must define:
	•	repo layout
	•	folder purpose
	•	where new files should live
	•	what structure should remain stable

Runbook.md

Must capture:
	•	core repeatable operational steps
	•	environment assumptions
	•	how to recover or rerun key flows

Suggested Internal Outputs During Expansion

In addition to the final artifacts, VDD may maintain:
	•	Artifact-Expansion-Plan.md
	•	Artifact-Generation-Log.md
	•	Expansion-Checkpoint-Summary.md

These are optional and mainly useful in complex or highly automated runs.

Sequencing Rule

No artifact in a deeper layer should be treated as final if an artifact in a shallower layer is still unstable.

That means:
	•	do not finalize architecture before scope and logic stabilize
	•	do not finalize implementation plan before architecture stabilizes
	•	do not finalize issues before the implementation plan stabilizes

Failure Handling

If skill installation fails, VDD should:
	•	state exactly what failed
	•	preserve current state
	•	continue with internal fallback logic where possible
	•	produce a manual install plan if needed
	•	not pretend the skill stack is active

If artifact generation fails for a layer, VDD should:
	•	stop at that layer
	•	summarize what is complete
	•	summarize what is incomplete
	•	state what blocks the next layer

Quality Gates for Expansion Completion

The post-PRD expansion stage should not be considered complete until:

Gate 1

Layer 1 artifacts exist and are internally consistent.

Gate 2

Layer 2 artifacts exist and are internally consistent.

Gate 3

Layer 3 artifacts exist and are actionable.

Gate 4

No critical contradictions remain across artifacts.

Gate 5

The project now has enough durable execution context for implementation to begin without relying on hidden chat memory.

User-Facing Language Pattern

A recommended explanation is:

“We have a strong PRD now. I am going to expand it into the rest of the execution package in stages. First I will lock the scope and logic, then define architecture and technical decisions, then prepare the build and validation plan.”

This keeps the experience understandable for non-technical users.

Suggested Internal Components

The implementation may eventually include conceptual modules such as:

core/
  intelligence/
    post-prd-expansion.ts
    artifact-layer-planner.ts
    artifact-generator.ts
    artifact-refiner.ts
    artifact-quality-gates.ts

These names are conceptual and may evolve.

Suggested Internal Skill

A likely internal skill for this layer is:
	•	skills/governance/post-prd-expander/SKILL.md

This skill should define:
	•	when expansion starts
	•	what skills are installed
	•	how layers are sequenced
	•	what outputs are required
	•	how quality loops are applied
	•	when autopilot must pause

Contribution Rule

Contributors extending this layer must declare:
	•	what artifact layer they affect
	•	what upstream dependencies they require
	•	what external skills they rely on
	•	how their changes preserve sequencing
	•	what quality gate they strengthen or weaken

This keeps the system inspectable.

V1 Boundary

V1 should support:
	•	automatic post-PRD skill bootstrap
	•	ordered artifact generation in layers
	•	evaluation and refinement after each layer
	•	high-impact decision checkpoints
	•	completion only after execution-readiness gates pass

V1 should not yet support:
	•	generating all artifacts at once
	•	silent artifact creation without sequencing
	•	treating every artifact as equally urgent
	•	replacing user approval at major lock points
	•	pretending a PRD alone is execution-ready

The first version should remain staged, deliberate, and quality-oriented.

المبدأين الأساسيين في الملف مبنيين على public sources:
- `find-skills` توصي بفهم الحاجة أولًا ثم استخدام `npx skills find` ثم التحقق من الجودة قبل التثبيت، مع دعم مباشر لـ `npx skills add` والاعتماد على ecosystem signals مثل install count وsource reputation.  [oai_citation:6‡Skills](https://skills.sh/vercel-labs/skills/find-skills)
- skill `prd` من `github/awesome-copilot` تؤكد أن الوثيقة القوية تبدأ بـ discovery interview ثم analysis/scoping ثم technical drafting مع success criteria measurable وnon-goals وtechnical sections، و`agentic-eval` مناسبة جدًا كحلقة refinement بعد كل طبقة artifact expansion.  [oai_citation:7‡Skills](https://skills.sh/github/awesome-copilot/prd)

الخطوة التالية المنطقية جدًا هي:
`skills/governance/post-prd-expander/SKILL.md`
لأنها:
- تحدد `when` و`what` و`how` للexpansion بعد PRD
- تربط بين layers وsequencing وquality gates
- تحدد outputs المطلوبة لكل طبقة
- تحدد نقاط التوقف للautopilot
- تحدد contribution rules للتمديدات


هذا يضمن:
- التسلسل الصحيح للexpansion
- الجودة في كل طبقة
- التثبيت السلس للskills المطلوبة
- التقييم المستمر للprogress