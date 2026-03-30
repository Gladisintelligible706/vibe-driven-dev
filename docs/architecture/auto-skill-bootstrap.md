
# Auto Skill Bootstrap

## Purpose

This document defines how Vibe Driven Dev automatically discovers, recommends, and installs external skills for the current coding agent after user intent becomes clear.

The goal is not to install random skills early.

The goal is to let VDD:
- understand the project
- detect capability gaps
- install a discovery skill first
- search the open skills ecosystem intelligently
- install only the most relevant skills for the current phase
- defer lower-priority skills into a staged roadmap

The first discovery skill used by this system is `find-skills` from `vercel-labs/skills`, which is explicitly designed to help agents discover and install skills from the open agent skills ecosystem.  [oai_citation:0‡Skills](https://skills.sh/vercel-labs/skills/find-skills?utm_source=chatgpt.com)

## Why This Layer Exists

Most vibe coders do not know which external skills to install.

They may know that the ecosystem exists.
They usually do not know:
- which skills match their project
- which skills match their coding agent
- which skills are useful now versus later
- which skills are redundant
- which skills improve planning, implementation, design, testing, debugging, or deployment

VDD should solve that gap automatically once the project intent is sufficiently understood.

## Core Principle

Do not install skills because they are popular alone.

Install skills because they fit:
- the project
- the runtime
- the current stage
- the current gaps
- the likely next phases

Popularity and ecosystem signal may influence ranking.
They must not replace relevance.

## Source of Truth

The external discovery source is the open agent skills ecosystem surfaced through:

- `skills.sh`
- the Skills CLI
- the `find-skills` skill from `vercel-labs/skills`

The `find-skills` skill is installed with:

`npx skills add https://github.com/vercel-labs/skills --skill find-skills`

This installation pattern is documented publicly on the skill page and in the Skills CLI repository.  [oai_citation:1‡Skills](https://skills.sh/vercel-labs/skills/find-skills?utm_source=chatgpt.com)

## Relationship to VDD

This system is not a replacement for VDD internal skills.

Internal VDD skills define the workflow.

External ecosystem skills strengthen the coding agent around the workflow.

That means:

- VDD owns the project journey
- external skills improve the agent's capabilities during that journey
- external skills are helpers, not the operating system

## Trigger Condition

Auto skill bootstrap should not run before VDD understands the project.

It should start only when all of the following are true:

- user intent is captured clearly enough
- project type is identified or reasonably inferred
- runtime or target agent is detected or strongly inferred
- enough gaps are visible to justify external skills discovery

Recommended trigger moments:

- after onboarding
- after `/vibe.init`
- after `/vibe.plan`
- after `/vibe.scaffold`
- when the project moves into a phase with clear specialized needs

## Default Bootstrap Sequence

The canonical flow is:

1. understand user intent
2. create a project profile
3. detect runtime
4. determine whether external skills discovery is needed
5. **install `find-skills`** via CLI (`npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent <agent> -y`)
6. generate discovery queries from project profile
7. **run live searches** via find-skills CLI (`npx skills find <query>`)
8. score and rank results (merged catalog + CLI results)
9. build a phased install plan
10. **execute Phase A installs** via Skills CLI
11. document what was installed and why
12. queue additional skills for later phases

## Why `find-skills` Comes First

`find-skills` exists specifically to help agents discover and install skills from the ecosystem.

Its own guidance says it should be used when users want specialized capabilities, want to search for tools or workflows, or need help finding a skill for a domain or task. It also recommends first understanding what the user needs, then using `npx skills find [query]`, then presenting options, then optionally installing them.  [oai_citation:2‡Skills](https://skills.sh/vercel-labs/skills/find-skills?utm_source=chatgpt.com)

That behavior aligns closely with the VDD advisory model.

## Runtime Awareness

Skill installation must be runtime-aware.

The Skills CLI supports targeting specific agents with `--agent`, supports project-local installation by default, and supports global installation with `-g`. The repository also documents support for OpenCode, Claude Code, Codex, Cursor, and many additional agents.  [oai_citation:3‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

That means VDD should:

- detect or infer the current agent runtime
- prefer project-local installation by default
- target the detected agent when possible
- fall back cleanly when runtime certainty is weak

## Project-Local First Policy

By default, auto skill bootstrap should install skills at project scope.

The Skills CLI documents project installation as the default behavior and global installation only when `-g` is used. Project-level installation is described as the shared option for the project, while global installation is for availability across all projects.  [oai_citation:4‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

VDD should therefore prefer:

- project-local install first
- global install only if:
  - the runtime requires it
  - the user explicitly prefers it
  - the skill is clearly cross-project utility

## Canonical Install Command

The first-step installation command should be conceptually equivalent to:

`npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent <detected-agent> -y`

Notes:
- `--skill find-skills` installs only the discovery skill
- `--agent <detected-agent>` targets the current runtime when supported
- `-y` avoids interactive confirmation in approved autopilot flows

The Skills CLI repository documents `--skill`, `--agent`, `-g`, and `-y` as supported options.  [oai_citation:5‡GitHub](https://github.com/vercel-labs/skills?utm_source=chatgpt.com)

## Search Behavior

Once `find-skills` is available, VDD should generate search queries based on the project profile.

Example query categories:
- stack and framework needs
- testing needs
- debugging needs
- auth needs
- design or frontend polish needs
- MCP or integration needs
- deployment needs
- documentation needs
- code review or refactoring needs

The `find-skills` documentation recommends queries like:
- `react performance`
- `pr review`
- `changelog`
and explicitly frames its usage around understanding the domain and task before searching.  [oai_citation:6‡Skills](https://skills.sh/vercel-labs/skills/find-skills?utm_source=chatgpt.com)

## Project Profile Model

Before searching, VDD should infer at least:

- project type
- frontend-heavy or backend-heavy shape
- whether the project is AI-native
- whether auth is needed
- whether testing depth is needed
- whether strong design/UI quality matters
- whether MCP or tool integration matters
- whether deployment complexity is likely
- whether the current user is non-technical or technical
- whether the project is in early setup or entering implementation

Useful sources for this inference may include:
- onboarding answers
- `PRD.md`
- `Structure.md`
- `Dependencies.md`
- `Stack-Decision.md`
- `AI-Provider-Decision.md`
- current VDD state
- bootstrap artifacts

## Gap-Based Querying

VDD should query by gaps, not only by technology names.

Example gap categories:
- planning
- design
- frontend
- backend
- auth
- database
- testing
- debugging
- performance
- security
- MCP
- docs
- deployment
- AI integration
- product polish

This keeps the system useful for non-technical users who may not know exact skill names.

## Scoring Model

Each discovered skill should be scored before recommendation or installation.

Recommended dimensions:

### Project fit
How well the skill matches the actual project needs.

### Runtime fit
How well the skill matches the current agent runtime.

### Stage fit
How useful the skill is at the current VDD stage.

### Ecosystem signal
How strong the skill appears in the ecosystem.

`skills.sh` shows leaderboard and install signal, including strong visibility for `find-skills` and other widely used skills. These signals are useful but should remain secondary to fit.  [oai_citation:7‡Skills](https://skills.sh/?utm_source=chatgpt.com)

### Source quality
How trustworthy the skill source appears.

### Overlap penalty
How much the skill duplicates already available capability.

## Example Weighting

A reasonable V1 weighting could be:

- 30% project fit
- 20% runtime fit
- 15% stage fit
- 15% stack or domain fit
- 10% ecosystem signal
- 10% source quality
- minus overlap penalty

The exact numbers may evolve, but the reasoning should remain explicit.

## Recommendation Limits

Do not overwhelm the user.

Default recommendation size should be:
- 3 strong install-now skills
- up to 5 with explain mode
- additional skills deferred into roadmap form

VDD should prefer short, high-confidence recommendations over broad bundles.

## Phased Installation Model

VDD should not install every useful skill immediately.

Instead, it should classify recommendations into phases.

### Phase A: Install now
Skills that help from the current moment.

Typical examples:
- debugging
- testing
- stack best practices
- framework best practices

### Phase B: Install at scaffold or early implementation
Skills needed after the foundation is in place.

Typical examples:
- auth
- design system
- MCP
- deployment

### Phase C: Install later
Skills useful after the project matures.

Typical examples:
- PR review
- changelog generation
- release workflows
- performance tuning
- advanced deployment optimization

## Installation Safety Rule

Auto installation must remain controlled.

VDD should automatically install only when all of the following are true:

- runtime confidence is acceptable
- project profile confidence is acceptable
- the skill clearly improves the current phase
- overlap is low
- the install path is supported
- the total automatic install count remains small

Recommended first-pass limit:
- install `find-skills`
- install at most 3 additional skills automatically

Everything else should go into roadmap form.

## Documentation Outputs

The system should write explicit artifacts such as:

### `Skill-Recommendations.md`
Human-readable explanation of what was found and why.

### `Skill-Install-Plan.md`
The exact install sequence and target runtime information.

### `Skill-Roadmap.md`
What should be installed later and at which stage.

These outputs should remain visible to the user.

## User-Facing Explanation Rule

Because many VDD users are non-technical or semi-technical, the final explanation must stay simple.

A good summary should tell the user:

- what the project seems to need
- what was installed now
- why these skills matter
- what will improve because of them
- what skills are queued for later
- what the next VDD step is

## Example Behavior

### Example 1
A React or Next.js MVP with auth and testing gaps may lead to:
- install `find-skills`
- search for:
  - nextjs
  - auth
  - testing
  - debugging
- install:
  - a framework best-practices skill
  - an auth best-practices skill
  - a testing or debugging skill
- defer design polish skills until scaffold or UI implementation

### Example 2
An AI wrapper app may lead to:
- install `find-skills`
- search for:
  - mcp
  - testing
  - debugging
  - ai integration
- install:
  - one MCP-oriented skill
  - one debugging skill
  - one testing skill
- defer design or deployment skills until later

### Example 3
A design-sensitive SaaS dashboard may lead to:
- install `find-skills`
- search for:
  - web design
  - accessibility
  - design system
  - testing
- install:
  - one design-focused skill
  - one testing skill
  - one framework or frontend best-practices skill

## Integration with `find-skills`

The `find-skills` skill should not be treated as the final recommendation engine.

It should be treated as the ecosystem discovery layer.

VDD remains responsible for:
- choosing the search queries
- scoring the results
- limiting noise
- deciding what gets installed now
- deciding what waits

## Install Plan Construction

A good install plan should include:

- detected runtime
- installation scope
- installed discovery skill
- search queries used
- shortlisted skills
- installed-now skills
- deferred skills
- reasons for each choice

## Suggested Internal Components

The implementation includes these modules:

```txt
core/
  intelligence/
    skill-bootstrap.ts          — Main orchestrator: coordinates the full flow
    skill-discovery.ts          — Generates search queries from project profile
    skill-recommender.ts        — Catalog-based scoring and recommendation engine
    skill-install-planner.ts    — Builds phased install plans (A/B/C)
    agent-runtime-detector.ts   — Detects active coding agent from filesystem signals
    find-skills-executor.ts     — Executes real Skills CLI commands (install, search, install skills)
```

These modules are implemented and integrated.

The `find-skills-executor.ts` module handles:
- Installing find-skills via `npx skills add https://github.com/vercel-labs/skills --skill find-skills`
- Running discovery queries via `npx skills find <query>`
- Installing individual skills via `npx skills add <owner>/skills --skill <name>`
- Parsing CLI output into structured results
- Safe error handling with graceful fallback

Suggested Internal Skill

The internal VDD skill supporting this behavior may be:
	•	skills/advisor/skill-bootstrapper/SKILL.md

This skill should define:
	•	when auto skill bootstrap is allowed
	•	what context it requires
	•	how find-skills is installed
	•	how search queries are generated
	•	how installs are limited and staged
	•	what artifacts must be written

Suggested Trigger Language

When VDD decides to run this flow, the user-facing language may be similar to:

“I understand the kind of project you want to build. Before we go further, I am going to equip your coding agent with a few extra skills that fit this project. I will first install a discovery skill, then search the skills ecosystem, then install only the most useful skills for the next phase.”

This keeps the process understandable.

Failure Handling

If any part of the bootstrap fails, VDD should:
	•	say clearly what failed
	•	preserve the current project state
	•	avoid partial silent installation claims
	•	produce an install-plan fallback
	•	continue the core VDD journey when possible

Examples:
	•	if runtime detection fails, fall back to generic install planning
	•	if find-skills install fails, produce manual install guidance
	•	if search quality is weak, produce recommendation-only mode

Autopilot Policy

Auto skill bootstrap is allowed in autopilot mode only when confidence is high enough.

Otherwise, VDD should:
	•	recommend
	•	explain
	•	wait for approval

This keeps the system helpful without becoming noisy or reckless.

Contribution Rule

Contributors extending this layer must declare:
	•	what signals trigger bootstrap
	•	what search queries are generated
	•	what scoring assumptions are used
	•	what installation limits apply
	•	what runtime assumptions are required
	•	how failure is handled

This keeps the system inspectable.

V1 Boundary

V1 should support:
	•	project-aware external skill discovery
	•	runtime-aware find-skills installation
	•	query generation from project profile
	•	shortlist scoring
	•	limited automatic installation
	•	staged skill roadmap
	•	plain-language user summary

V1 should not yet support:
	•	large bulk installation by default
	•	opaque black-box ranking
	•	auto-promotion of every popular skill
	•	fully autonomous installation without clear runtime confidence
	•	replacing internal VDD workflow skills with external skills

The first version should remain controlled, useful, and understandable.

الخطوة التالية المنطقية بعده هي:
`skills/advisor/skill-bootstrapper/SKILL.md`