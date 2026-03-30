تمام. اكتب الملف ده كما هو:

docs/architecture/vdd-next-phase-roadmap.md

# VDD Next Phase Roadmap

## Purpose

This document defines the next major development phase for Vibe Driven Dev after the PRD stage, PRD skill stack, and post-PRD artifact expansion are in place.

The goal is to move VDD from a strong structured framework into a true operating system for coding agents and non-technical builders.

This roadmap focuses on what should be built next to increase:

- autopilot behavior
- installation quality
- runtime compatibility
- execution readiness
- code audit depth
- intelligence quality
- contribution readiness
- real-world adoption

## Guiding Principle

The next phase should not be driven by adding random new features.

It should be driven by closing the gap between:

- documented architecture
- actual engine behavior
- installation reality
- multi-agent runtime support
- project reliability
- contributor usability

## Current Position

At this point, VDD is strongest in:

- workflow architecture
- staged project thinking
- PRD generation strategy
- artifact expansion strategy
- skill orchestration direction
- code audit architecture
- agent-first product direction

The next phase should focus on making these systems:

- runnable
- testable
- installable
- inspectable
- portable across major coding agents

## Phase Design Rule

The next phase should be organized around systems, not isolated tasks.

The major systems for the next phase are:

1. Autopilot Core
2. Install and Export Layer
3. Quality Hardening
4. Code Audit Engine
5. MCP-Backed Intelligence
6. Community and Contribution Maturity

## System 1: Autopilot Core

### Why This Matters

VDD should feel like a guided operator, not just a command catalog.

Right now, many parts of VDD are well-structured, but the user experience can still feel too command-driven and too manual.

The next phase should introduce a proper autopilot layer that can:

- ask the next best question
- decide when enough information exists
- choose the next stage automatically
- pause only at real checkpoints
- recommend stronger models only when justified
- keep the user in a guided conversation without requiring technical command literacy

### What To Build

Recommended internal structure:

```txt
core/
  autopilot/
    conductor.ts
    question-engine.ts
    checkpoint-policy.ts
    confidence-engine.ts
    next-step-engine.ts
    escalation-policy.ts

Responsibilities

The autopilot layer should:
	•	run guided onboarding
	•	translate natural language into project state
	•	choose when to continue automatically
	•	choose when to pause for approval
	•	select the right specialist agent for the current step
	•	attach the right external skills at the right phase
	•	summarize progress after each major checkpoint

Checkpoint Model

The system should eventually standardize checkpoints such as:
	•	Intent Captured
	•	PRD Ready
	•	Expansion Ready
	•	Technical Direction Locked
	•	Execution Ready
	•	Audit Complete
	•	Handoff Ready

System 2: Install and Export Layer

Why This Matters

VDD should be easy to activate inside the coding environment the user already prefers.

The open skills ecosystem already supports many agents, and the Skills CLI supports project-local installation by default, global installation with -g, agent targeting with --agent, and GitHub URL or shorthand installation sources.  ￼

Claude Code also supports project-level and user-level custom subagents stored as Markdown files with YAML frontmatter in .claude/agents/ and ~/.claude/agents/, with project-level definitions taking precedence.  ￼

What To Build

Recommended internal structure:

core/
  install/
    registry.ts
    target-types.ts
    plan-install.ts
    write-install.ts
    adapters/
      claude-code.ts
      codex.ts
      cursor.ts
      windsurf.ts
      opencode.ts
      gemini-cli.ts
      generic-agents-md.ts

Prioritized Targets

V1 priority targets should be:
	•	Claude Code
	•	Codex
	•	Cursor / Windsurf / OpenCode through common compatible export paths
	•	Gemini CLI
	•	Generic fallback

Install Goals

The install layer should support:
	•	one-time usage
	•	project-local installation
	•	global installation where appropriate
	•	runtime-aware export
	•	clean uninstall or repair
	•	environment validation through doctor

System 3: Quality Hardening

Why This Matters

VDD cannot become a trusted system if the workflow logic is stronger than the actual reliability of the codebase.

The project needs a hardening phase focused on:
	•	tests
	•	contracts
	•	state durability
	•	artifact registry
	•	gate integrity
	•	release quality

GitHub recommends clear contribution guidelines and community health files so users and contributors understand how the repository should operate, and surfaces CONTRIBUTING.md prominently in the repository interface when present.  ￼

What To Build

Recommended priorities:
	•	router tests
	•	command parser tests
	•	state manager tests
	•	install path tests
	•	audit engine tests
	•	autopilot flow tests
	•	artifact registry
	•	rule and artifact contracts
	•	stronger gate behavior

Minimum Quality Goals

The next phase should achieve:
	•	stable build
	•	reproducible command behavior
	•	inspectable artifacts
	•	recoverable state
	•	consistent path handling
	•	reliable onboarding flows

System 4: Code Audit Engine

Why This Matters

/vibe.audit should become one of the highest-value capabilities in VDD.

It should not stay as a thin report generator or a demo command.

It should become a real audit-and-remediation engine that:
	•	profiles the repository
	•	selects rule packs intelligently
	•	evaluates evidence
	•	generates structured issues
	•	writes remediation plans
	•	groups work into sprints

What To Build

Recommended internal structure:

core/
  audit/
    rule-loader.ts
    repository-profiler.ts
    codebase-auditor.ts
    issue-generator.ts
    sprint-planner.ts
    report-writer.ts

Audit Goals

The system should:
	•	use canonical rules only
	•	ignore weak or archived duplicates
	•	support focused audits by area
	•	generate evidence-backed findings
	•	produce machine-readable and human-readable outputs
	•	support autopilot analysis
	•	remain non-destructive by default

Output Goals

The audit engine should consistently produce:
	•	Audit-Report.md
	•	Audit-Issues.json
	•	Refactor-Plan.md
	•	Sprint-Plan.md

System 5: MCP-Backed Intelligence

Why This Matters

The next phase of VDD should move from static intelligence to live, inspectable intelligence where it helps.

The Model Context Protocol provides a standardized way for servers to expose resources identified by URIs, and explicitly describes user interaction models where host applications can expose, search, filter, or automatically include resources based on heuristics.  ￼

MCP also supports prompts that can embed resources directly into the prompt flow, and the specification emphasizes prompt validation and security.  ￼

What To Build

Recommended areas:
	•	stack freshness resolution
	•	provider and model freshness checks
	•	docs-aware recommendations
	•	repository resource exposure
	•	rules and artifact resource mapping
	•	prompt-aware context injection

Suggested Resource Classes

The intelligence layer should eventually support:
	•	project resources
	•	documentation resources
	•	dependency and version resources
	•	model and provider resources
	•	audit and rules resources

Core Benefit

This will allow VDD to:
	•	reduce stale assumptions
	•	improve stack recommendations
	•	improve provider recommendations
	•	make artifact generation more grounded
	•	support richer agent behavior without hidden magic

System 6: Community and Contribution Maturity

Why This Matters

Once VDD becomes more installable and more usable, contribution quality will matter much more.

The repository should become easier to understand, easier to extend, and easier to trust.

GitHub’s contributor-guideline model and repository best practices make this especially important for growing open-source projects.  ￼

What To Build

Recommended priorities:
	•	CONTRIBUTING.md
	•	issue templates
	•	discussions or feedback entrypoint
	•	install target matrix
	•	architecture index
	•	examples
	•	social preview quality
	•	release discipline
	•	versioning discipline

Community Goals

The system should become easier for contributors to:
	•	understand the repo quickly
	•	know where new code belongs
	•	know what is canonical
	•	know how to extend a subsystem safely
	•	know what artifacts and contracts they must preserve

Major Milestones

Milestone A: Autopilot Core

Goal

Make VDD feel like a guided operating system rather than a command surface.

Deliverables
	•	/vibe.start
	•	guided onboarding engine
	•	checkpoint summaries
	•	auto-continue policy
	•	decision pause policy
	•	mission-driven orchestration layer

Milestone B: Install and Export

Goal

Make VDD easy to install and activate inside major coding agents.

Deliverables
	•	install adapters
	•	install registry
	•	target matrix
	•	INSTALL.md
	•	USAGE.md
	•	target-specific install docs

Milestone C: Production Hardening

Goal

Make the system trustworthy.

Deliverables
	•	tests
	•	artifact registry
	•	quality gates
	•	stronger doctor command
	•	build and release discipline

Milestone D: Audit and Remediation

Goal

Make /vibe.audit a serious staff-engineer-style autopilot audit engine.

Deliverables
	•	core audit modules
	•	rule-aware profiling
	•	issue generation
	•	remediation plans
	•	sprint planning
	•	focused audit support

Milestone E: MCP Intelligence

Goal

Give VDD live, inspectable, resource-driven intelligence.

Deliverables
	•	resource mapping
	•	docs lookup
	•	provider and model freshness
	•	dependency freshness
	•	prompt-aware context injection
	•	repo resource subscription strategy

Immediate Priority Order

The next phase should proceed in this order:
	1.	Autopilot Core
	2.	Install and Export Layer
	3.	Production Hardening
	4.	Code Audit Engine
	5.	MCP-Backed Intelligence
	6.	Community Maturity

Why This Order

Autopilot first

Because this is the largest gap between VDD’s architecture and how it should feel to a real user.

Install second

Because usability and adoption depend on clean activation inside real coding agents.

Hardening third

Because the more VDD automates, the more correctness and reliability matter.

Audit fourth

Because audit is high-value, but should sit on stronger infrastructure.

MCP fifth

Because live intelligence becomes more valuable after the engine and install layers are stable.

Community sixth

Because contribution maturity works best when the internal architecture is already coherent enough to welcome others safely.

Success Criteria for the Next Phase

The next phase should be considered successful when:
	•	a non-technical user can install VDD into a coding agent and start guided onboarding
	•	VDD can drive the user from idea to PRD and artifact expansion with minimal manual command use
	•	VDD can recommend and install the right external skills at the right stage
	•	VDD can audit an existing codebase and produce an actionable remediation plan
	•	VDD can export or integrate cleanly into major coding-agent runtimes
	•	contributors can understand the architecture and extend it safely
	•	intelligence decisions are more grounded and less stale

Anti-Goals

The next phase should avoid:
	•	adding random commands without orchestration value
	•	overengineering many install targets before adapters are clean
	•	building opaque black-box intelligence layers
	•	shipping many weak features instead of a few strong systems
	•	pretending docs alone are implementation
	•	sacrificing repository clarity for raw feature count

Suggested Companion Documents

The next phase will likely benefit from companion documents such as:
	•	docs/architecture/autopilot-mode.md
	•	docs/install/targets.md
	•	docs/architecture/install-export-model.md
	•	docs/architecture/artifact-registry.md
	•	docs/architecture/mcp-resource-strategy.md
	•	docs/architecture/community-maturity.md

Final Recommendation

The first development target after the current feature set should be:

Autopilot Core

This is the highest-leverage system because it will make every other VDD capability feel more coherent, more automatic, and more useful to real builders.

الملاحظات التي تشير إلى دعم الـ Skills CLI لتثبيت skills من مصادر متعددة، والتثبيت project-local افتراضيًا، وخيار `--agent`، ودعم عدد كبير من الـ agents، مبنية على صفحة repo الرسمية لـ `vercel-labs/skills`. كما أن ملاحظات Claude Code عن subagents project-level وuser-level وأولوية المشروع مبنية على docs الرسمية لـ Anthropic، وطبقة MCP الذكية مبنية على spec الرسمية للـ resources وprompts في Model Context Protocol. وأخيرًا، جزء community maturity مبني على GitHub Docs حول `CONTRIBUTING.md` واكتشافه داخل واجهة الريبو.  [oai_citation:6‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

الخطوة التالية المنطقية جدًا هي:
`docs/architecture/autopilot-mode.md`

هذا لأن Autopilot هو نظام أساسي سيجعل كل قدرات VDD الأخرى تبدو أكثر تناسقًا وأتمتةً واستخدامًا من قبل المطورين الحقيقيين.