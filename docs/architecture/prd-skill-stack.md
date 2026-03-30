
# PRD Skill Stack

## Purpose

This document defines how Vibe Driven Dev prepares, installs, sequences, and applies external PRD-oriented skills during the PRD stage.

The goal is not to install every PRD-related skill at once.

The goal is to make the coding agent produce a strong, durable, execution-ready PRD rather than a shallow or generic document.

This layer should help VDD:

- recognize that the project is ready for PRD work
- equip the coding agent with the right PRD-focused skills
- orchestrate those skills in the correct order
- generate a high-quality PRD draft
- refine that PRD through additional product-management review
- break the PRD down into implementation planning artifacts
- convert the PRD into plan and issue outputs for downstream execution

## Why This Layer Exists

A weak PRD usually fails in one of these ways:

- it is too vague
- it is too feature-list driven
- it ignores constraints
- it skips measurable success criteria
- it hides non-goals
- it does not connect product thinking to technical execution
- it cannot be turned cleanly into plan or issues

The PRD Skill Stack exists to prevent that.

## Core Principle

Do not treat all PRD-related skills as equal or simultaneous.

Different skills should play different roles:

- one skill should lead the discovery and PRD structure
- one skill can support direct drafting
- one skill can improve product-management quality
- one skill can break the PRD into features
- one skill can convert the PRD into a plan
- one skill can convert the PRD into issues

VDD remains the orchestrator.
External skills remain specialized helpers.

## Relationship to the VDD Journey

This layer begins only after the project has enough clarity to justify serious PRD work.

Recommended prerequisites:

- onboarding completed
- intent captured
- `/vibe.init` completed
- `/vibe.plan` completed
- `/vibe.scaffold` completed
- basic stack and provider thinking available when relevant

This layer should not run before the project has a stable enough definition.

## PRD Stage Entry Rule

VDD should enter the PRD skill stack only when all of the following are true:

- the problem is clear enough
- the target user is clear enough
- the project objective is clear enough
- the success direction is visible
- the project is ready to move from idea framing into execution-ready specification

If these are not true, VDD should stay in clarification mode instead of forcing PRD generation.

## Source Skills

The PRD Skill Stack uses a staged mix of external skills.

Primary skills:

- `github/awesome-copilot --skill prd`
- `mattpocock/skills --skill write-a-prd`

Secondary refinement skills:

- `deanpeters/product-manager-skills --skill prd-development`
- `github/awesome-copilot --skill breakdown-feature-prd`

Execution conversion skills:

- `mattpocock/skills --skill prd-to-plan`
- `mattpocock/skills --skill prd-to-issues`

These skills should not all become co-equal leaders of the stage.
They should be sequenced.

## Skill Roles

### 1. Lead PRD Skill
The lead PRD skill should control the initial PRD workflow.

Recommended lead:
- `github/awesome-copilot --skill prd`

Its job is to:
- force discovery
- clarify the problem
- clarify success metrics
- define constraints
- structure the document
- require measurable acceptance criteria
- keep non-goals visible
- bridge business and technical thinking

### 2. Drafting Support Skill
The drafting support skill should help generate the full PRD draft once discovery is strong enough.

Recommended drafting support:
- `mattpocock/skills --skill write-a-prd`

Its job is to:
- turn clarified input into a complete draft
- help improve structure and completeness
- support codebase-aware or system-aware PRD writing when useful

### 3. Product-Management Refinement Skill
The refinement skill should strengthen the PRD after the first strong draft exists.

Recommended refinement:
- `deanpeters/product-manager-skills --skill prd-development`

Its job is to:
- improve product framing
- improve completeness
- strengthen prioritization thinking
- improve problem/solution alignment
- tighten success criteria and document quality

### 4. Feature Breakdown Skill
The feature-breakdown skill should split the PRD into feature units.

Recommended breakdown:
- `github/awesome-copilot --skill breakdown-feature-prd`

Its job is to:
- extract major features
- create a cleaner feature hierarchy
- preserve relationships between scope and delivery

### 5. Planning Conversion Skill
The planning conversion skill should turn the PRD into implementation planning structure.

Recommended planning conversion:
- `mattpocock/skills --skill prd-to-plan`

Its job is to:
- translate PRD content into a concrete execution plan
- identify sequencing and implementation structure
- create a bridge to downstream work planning

### 6. Issue Conversion Skill
The issue conversion skill should turn the PRD into implementation issues.

Recommended issue conversion:
- `mattpocock/skills --skill prd-to-issues`

Its job is to:
- create actionable work units
- structure follow-up execution
- support issue-driven implementation workflows

## Installation Policy

VDD should not install all PRD-related skills at once.

It should install them in phases.

## Phase A: PRD Foundation Install

Install only the lead PRD skill and the drafting support skill.

Suggested commands:

```bash
npx skills add https://github.com/github/awesome-copilot --skill prd --agent <detected-agent> -y
npx skills add https://github.com/mattpocock/skills --skill write-a-prd --agent <detected-agent> -y

This keeps the early PRD stage focused.

Phase B: PRD Refinement Install

After the first strong PRD draft exists, install the refinement and breakdown skills.

Suggested commands:

npx skills add https://github.com/deanpeters/product-manager-skills --skill prd-development --agent <detected-agent> -y
npx skills add https://github.com/github/awesome-copilot --skill breakdown-feature-prd --agent <detected-agent> -y

This strengthens the document without causing early-stage overload.

Phase C: PRD to Execution Install

After the PRD is stable enough, install the conversion skills.

Suggested commands:

npx skills add https://github.com/mattpocock/skills --skill prd-to-plan --agent <detected-agent> -y
npx skills add https://github.com/mattpocock/skills --skill prd-to-issues --agent <detected-agent> -y

This shifts the workflow from document quality into execution preparation.

Project-Local First Rule

By default, install these skills at project scope.

Use global installation only if:
	•	the runtime requires it
	•	the user explicitly prefers it
	•	the skill is clearly intended for many unrelated projects

The PRD stack should usually remain attached to the current project workflow.

Runtime Awareness

Install commands should be agent-aware whenever the runtime is known.

That means VDD should:
	•	detect the current coding-agent runtime
	•	pass --agent <detected-agent> when supported
	•	prefer project-local setup
	•	avoid pretending certainty when runtime detection is weak

If runtime certainty is weak, VDD should:
	•	explain that
	•	generate an install plan
	•	avoid reckless automatic installation

Orchestration Model

VDD should orchestrate this stack in the following order.

Step 1: Clarification Readiness Check

Before any install, confirm that the project is ready for PRD work.

Step 2: Install PRD Foundation Skills

Install the lead PRD skill and drafting support skill.

Step 3: Run Discovery and Structure Pass

Use the lead PRD skill to:
	•	interrogate the user
	•	surface constraints
	•	define success metrics
	•	define non-goals
	•	create the PRD skeleton

Step 4: Run Drafting Pass

Use the drafting support skill to generate the first serious PRD draft.

Step 5: Run Product-Management Refinement

Install and apply prd-development to improve the draft.

Step 6: Run Feature Breakdown

Install and apply breakdown-feature-prd to produce feature structure.

Step 7: Run Plan Conversion

Install and apply prd-to-plan.

Step 8: Run Issue Conversion

Install and apply prd-to-issues.

Step 9: Perform VDD Quality Gates

Only then should VDD mark the PRD stage as truly ready.

Autopilot Behavior

This stack should support autopilot behavior, but not reckless behavior.

VDD may continue automatically through the stack when:
	•	confidence is high
	•	the user is in guided or autopilot mode
	•	the project intent is stable
	•	no major contradictory answers remain

VDD should pause for approval when:
	•	the project intent is changing materially
	•	stack or provider tradeoffs are still unresolved
	•	the user answers suggest the PRD should be reframed
	•	the PRD has major open questions
	•	the user wants a premium-quality PRD and model escalation is recommended

Model Escalation Policy

The PRD stage is one of the most model-sensitive parts of the VDD journey.

When the PRD requires:
	•	deep synthesis
	•	long-form structure
	•	strong product reasoning
	•	rich technical sections
	•	measurable acceptance criteria
	•	risk and roadmap thinking

VDD should recommend temporarily switching to a stronger model.

Recommended guidance:
	•	use the strongest available Anthropic flagship such as Claude Opus 4.6 when available
	•	or use GPT-5.4 / Codex with the highest practical reasoning setting for document-heavy work

VDD should not force model switching.
It should explain the benefit clearly and let the user decide.

User-Facing Language for Model Escalation

A recommended pattern is:

“We now have enough information to produce a serious PRD. I can continue with the current model, but if you want a stronger, more detailed, more execution-ready PRD, I recommend temporarily switching to a stronger model for this stage.”

This keeps the process understandable and non-threatening.

PRD Output Requirements

This stack should not end with only one document.

The minimum strong output set should be:
	•	PRD.md
	•	Feature-Breakdown.md
	•	Implementation-Plan.md
	•	Execution-Issues.md

Optional supporting outputs:
	•	Acceptance-Criteria.md
	•	Open-Questions.md
	•	Risk-Register.md

PRD Quality Gates

The PRD stage should not be marked complete until these gates pass.

Gate 1: Core Problem Gate

The PRD clearly states:
	•	the problem
	•	the target user
	•	the proposed solution
	•	why this matters now

Gate 2: Scope Gate

The PRD clearly states:
	•	what is in scope
	•	what is out of scope
	•	non-goals
	•	constraints

Gate 3: Success Gate

The PRD clearly states:
	•	measurable success criteria
	•	validation direction
	•	acceptance criteria where relevant

Gate 4: Technical Bridge Gate

The PRD clearly states:
	•	technical assumptions
	•	integration considerations
	•	AI requirements when relevant
	•	security and privacy considerations when relevant

Gate 5: Execution Gate

The PRD has already been:
	•	broken into features
	•	converted into a plan
	•	converted into issues

Until these gates pass, the PRD is not done.

Anti-Fragility Rules

VDD must avoid these failure modes:
	•	installing every PRD-related skill at once
	•	letting multiple skills compete for leadership at the same moment
	•	treating a pretty document as a complete PRD
	•	skipping discovery
	•	skipping non-goals
	•	skipping measurable criteria
	•	converting to plan before the PRD is stable
	•	converting to issues before the plan is coherent

Suggested Internal Components

The implementation may eventually include conceptual modules such as:

core/
  intelligence/
    prd-skill-stack.ts
    prd-skill-installer.ts
    prd-stage-orchestrator.ts
    prd-quality-gates.ts
    model-escalation-advisor.ts

These names are conceptual and may evolve.

Suggested Internal Skill

The internal VDD skill driving this behavior may be:
	•	skills/governance/prd-orchestrator/SKILL.md

This internal skill should define:
	•	when the PRD stack starts
	•	what gets installed in each phase
	•	which external skill leads each phase
	•	how outputs are generated
	•	how quality gates are checked
	•	when model escalation should be recommended

Suggested Artifacts

The PRD stage should make artifacts visible and durable.

Suggested artifacts include:
	•	PRD.md
	•	Feature-Breakdown.md
	•	Implementation-Plan.md
	•	Execution-Issues.md
	•	Open-Questions.md
	•	Risk-Register.md

These should remain as explicit project truth, not hidden chat output.

Failure Handling

If any skill install fails, VDD should:
	•	say exactly what failed
	•	preserve the current project state
	•	avoid pretending the PRD stack is active when it is not
	•	continue in fallback mode if possible
	•	produce manual install guidance when needed

Examples:
	•	if install fails, continue with VDD-native drafting logic
	•	if one conversion skill fails, keep the PRD stage alive but mark the related execution artifact as incomplete
	•	if runtime targeting is weak, generate an install plan rather than claiming success

Contribution Rule

Contributors extending this layer must declare:
	•	which skill leads which phase
	•	what triggers each install
	•	what artifacts are produced
	•	what quality gates are enforced
	•	what fallback behavior exists
	•	how model escalation is recommended

This keeps the stack inspectable.

V1 Boundary

V1 should support:
	•	phased installation of PRD-related external skills
	•	clear role separation between skills
	•	discovery-first PRD generation
	•	strong PRD draft creation
	•	refinement pass
	•	feature breakdown
	•	plan conversion
	•	issue conversion
	•	explicit quality gates
	•	optional model escalation recommendation

V1 should not yet support:
	•	bulk installation of every available PRD skill
	•	silent model switching
	•	skipping discovery to save time
	•	treating PRD generation as one-shot output
	•	pretending the PRD is complete without execution conversion outputs

The first version should remain structured, staged, and inspectable.

الـ install sequence والـ role split في الملف مبنيين على الـ public skill entries والـ Skills CLI:  
`github/awesome-copilot/prd` يعرّف workflow ثلاثي المراحل يبدأ بـ discovery interview ثم analysis/scoping ثم technical drafting مع success criteria قابلة للقياس وبنية PRD صارمة، و`find-skills` يشرح نموذج search → shortlist → install في skills ecosystem، كما أن Skills CLI يدعم `add`, `find`, وخيارات مثل `--agent`, `--skill`, `-g`, و`-y`.  [oai_citation:0‡Skills](https://skills.sh/github/awesome-copilot/prd?utm_source=chatgpt.com)

وجزء model escalation في الملف منطقي لأن Anthropic تصف Claude Opus 4.6 بأنه “most capable model to date” وتوصي به للمهام demanding مثل complex document creation، بينما OpenAI تصف GPT-5.4 بأنه نموذج frontier للعمل المهني وتعرضه في Codex، مع نتائج قوية في knowledge work واستخدام `xhigh` reasoning في تقييمات الوثائق والعمل الاحترافي.  [oai_citation:1‡Anthropic](https://www.anthropic.com/claude/opus?utm_source=chatgpt.com)

الخطوة التالية المنطقية جدًا هي:
`skills/governance/prd-orchestrator/SKILL.md`