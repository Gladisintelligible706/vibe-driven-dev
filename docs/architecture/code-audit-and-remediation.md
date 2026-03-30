# Code Audit and Remediation Architecture

## Purpose

This document defines how Vibe Driven Dev performs a structured codebase audit against curated coding standards and turns the findings into an actionable, sprint-ready remediation plan.

The goal is not a shallow lint pass.

The goal is to let a coding agent behave like a **technical staff engineer doing an honest audit in autopilot form**:

- scan the repository and understand its shape
- select the rule packs that are genuinely relevant
- compare codebase patterns against those rules
- identify real violations and structural weaknesses
- produce structured, evidence-backed issues
- generate a grouped remediation plan
- split the work into priority-based sprints
- summarize everything in plain language that non-specialists can act on

This capability must work in autopilot mode once invoked by `/vibe.audit`.

---

## Why This Layer Exists

Most vibe coders ship quickly, but they rarely know whether the codebase is actually healthy.

The common failure pattern looks like this:

- code works but violates architectural boundaries
- components are tightly coupled with no clear ownership
- events, side effects, and tracking are inconsistent or invisible
- accessibility, testing, and performance are weak but not measured
- security and privacy assumptions are hidden in implementation details
- dependency usage is unsafe, chaotic, or circular
- UI and design system practices drift with each feature
- refactoring cost is only obvious after the project becomes hard to maintain

This layer exists to make coding standards operational — turning them from documentation into a live enforcement and planning system.

---

## Core Principle

> The audit must produce judgment, not just noise.

A useful audit:

- understands the shape of the repository before applying any rules
- applies relevant standards only — not every possible standard
- identifies real issues rather than dumping raw lint output
- explains why each issue matters to the project
- shows evidence, not assertions
- proposes a concrete fix direction
- orders remediation work by priority, dependency, and blast radius

The result should feel like a structured engineering review — credible, precise, and immediately actionable.

---

## Command Surface

The public command for this capability is:

```
/vibe.audit
```

### Supported Modes

| Command | Behavior |
|---|---|
| `/vibe.audit` | Full audit: scan, select, compare, report, sprint plan |
| `/vibe.audit --focus architecture` | Architecture and dependency audit only |
| `/vibe.audit --focus testing` | Testing coverage and quality audit only |
| `/vibe.audit --focus security` | Security and privacy audit only |
| `/vibe.audit --focus performance` | Performance audit only |
| `/vibe.audit --focus events` | Event management and lifecycle audit only |
| `/vibe.audit --focus accessibility` | Accessibility audit only |
| `/vibe.audit --mode report` | Produce audit report only, no sprint plan |
| `/vibe.audit --mode fix-plan` | Produce remediation plan only |
| `/vibe.audit --mode sprints` | Produce sprint plan only |

The default command (no flags) should run the **full audit pipeline**: repository scan → rule selection → comparison → issue generation → remediation roadmap → sprint planning → executive summary.

---

## Relationship to the Core VDD Journey

This audit capability is **cross-stage**. It may be used:

- after `/vibe.scaffold` to assess an existing or pre-imported repo
- during `/vibe.blueprint` review to evaluate architecture alignment
- during `/vibe.detail` to assess implementation readiness
- before `/vibe.qa` to identify structural blockers
- independently on brownfield repositories that were not created through VDD

It does not replace the journey. It evaluates the state of the codebase against curated standards and produces structured remediation guidance.

---

## Source of Standards

The audit system loads curated standards from the imported rule reference files.

### Primary Rule Pack Sources

The following rule files are the authoritative enforcement sources:

| File | Area |
|---|---|
| `master-rules.json` | Cross-cutting standards: architecture, security, performance |
| `ui-ux-engineering.rules.json` | UI quality, interaction patterns, engineering excellence |
| `memory-and-lifecycle.rules.json` | State lifecycle, AI flow memory, cleanup expectations |
| `tracking-standards.rules.json` | Analytics ownership, event naming, tracking hygiene |
| `testing.rules.json` | Coverage expectations, test quality, reliability |
| `performance.rules.json` | Rendering, bundle, network, and runtime performance |
| `security-privacy.rules.json` | Auth, data handling, secrets, privacy compliance |
| `accessibility.rules.json` | WCAG, keyboard nav, ARIA, color contrast |
| `component-modularity.rules.json` | SRP, coupling, cohesion, component boundaries |
| `styling-tokens.rules.json` | Design token usage, theming, CSS architecture |
| `dependency-architecture.rules.json` | Unidirectional dependencies, layer violations |
| `type-system.rules.json` | TypeScript usage, type safety, SSOT for types |
| `api-consistency.rules.json` | API shape, naming, versioning, response contracts |
| `error-handling.rules.json` | Error model, recovery, observability, propagation |
| `environment-consistency.rules.json` | Env config hygiene, secrets, deployment contracts |
| `libraries-usage.rules.json` | Library selection, version hygiene, integration patterns |
| `circular-dependency.rules.json` | Import cycles, dependency direction enforcement |
| `incremental-intelligence-architecture.rules.json` | AI feature architecture, progressive enhancement |
| `defensive-rendering.rules.json` | Null safety, fallback, error boundary requirements |
| `regression-prevention.rules.json` | Change isolation, feature preservation, backward compat |
| `assets-handling.rules.json` | Image optimization, static assets, CDN hygiene |
| `path-resolution.rules.json` | Import path patterns, alias usage, module resolution |

### Supporting Architecture References

| File | Use |
|---|---|
| `ai-core-architecture.md` | AI module design, integration patterns |
| `ape-architecture.md` | Agent-based pattern expectations |
| `pivl-architecture.md` | Incremental validation layer expectations |
| `persona-guidelines.md` | AI persona and behavioral constraints |

These architecture references inform **judgment** but the `.rules.json` files are the primary enforcement source.

---

## Rule Ingestion Policy

The audit system must **not** blindly apply every ruleset to every project.

Instead, it must:

1. inspect the codebase
2. infer project shape
3. select rule packs by relevance
4. rank the selected packs by priority for this specific project type
5. run the audit with the selected set
6. record which rulesets were used and why

This prevents noisy, unfair, or low-signal audits.

---

## Phase 1 — Repository Understanding

Before evaluating any code, the audit layer must understand the repository.

### What to inspect

- languages in use
- frameworks in use
- frontend vs backend vs full-stack dominance
- whether the project is AI-native
- whether there is authentication
- whether there is event-driven behavior
- whether there are background jobs or workers
- whether there are tracking or analytics hooks
- whether there are multiple apps or packages (monorepo)
- whether the repository is greenfield or brownfield
- whether tests exist and what shape they take
- whether a design system exists
- whether dependency files show clear layering

### Useful inspection sources

- repository file structure
- `package.json`, `pyproject.toml`, `Cargo.toml`, or equivalent
- import patterns across key files
- bootstrap artifacts (`.vdd/state.json`, `architecture-baseline.md`) if available
- existing architecture documents

---

## Phase 2 — Rule Pack Selection

The audit selects rule packs based on project fit.

### Always applied

These are relevant to almost any serious project:

- `master-rules.json`
- `testing.rules.json`
- `error-handling.rules.json`
- `dependency-architecture.rules.json`
- `circular-dependency.rules.json`
- `regression-prevention.rules.json`

### Frontend-heavy projects

Add when the project is component-based or design-system-driven:

- `ui-ux-engineering.rules.json`
- `accessibility.rules.json`
- `component-modularity.rules.json`
- `styling-tokens.rules.json`
- `defensive-rendering.rules.json`
- `assets-handling.rules.json`
- `libraries-usage.rules.json`

### AI-native or workflow-heavy projects

Add when the project has AI features, async pipelines, or multi-step flows:

- `memory-and-lifecycle.rules.json`
- `incremental-intelligence-architecture.rules.json`
- `tracking-standards.rules.json`

### Security-sensitive projects

Add when the project has authentication, payments, personal data, or external APIs:

- `security-privacy.rules.json`
- `environment-consistency.rules.json`
- `api-consistency.rules.json`

### Performance-sensitive projects

Add when the project is customer-facing, high-traffic, or latency-sensitive:

- `performance.rules.json`

### Type-rich codebases

Add when the project uses TypeScript or a strongly-typed system:

- `type-system.rules.json`
- `path-resolution.rules.json`

---

## Phase 3 — Comparison and Issue Detection

The audit agent:

1. reads each selected rule file and understands the standards
2. scans the codebase — file structure, imports, component shapes, logic patterns
3. matches implementation patterns against each rule
4. identifies violations, missing structures, and anti-patterns
5. records each as a structured issue with evidence

---

## Phase 4 — Issue Model

Every issue produced by the audit must be structured.

### Required Issue Fields

```json
{
  "issue_id": "AUD-001",
  "title": "Missing event ownership boundaries in async AI flows",
  "severity": "high",
  "category": "architecture",
  "rule_source": "dependency-architecture.rules.json",
  "why_it_matters": "Creates hidden coupling and unclear failure handling in AI generation pipelines",
  "evidence": [
    "src/ai/generate.ts: direct DOM update inside async callback with no event boundary",
    "src/hooks/useGenerate.ts: side effects written to global state without producer/consumer map"
  ],
  "affected_files": [
    "src/ai/generate.ts",
    "src/hooks/useGenerate.ts"
  ],
  "suggested_remediation": "Introduce Event-Architecture.md, define producer/consumer map, route async side effects through a named event boundary",
  "sprint_recommendation": 1,
  "dependency_notes": "Must resolve before testing improvements in Sprint 2"
}
```

---

## Phase 5 — Severity Model

| Level | Meaning |
|---|---|
| **Critical** | Immediate structural or risk issue that materially threatens correctness, safety, or maintainability |
| **High** | Serious issue that blocks scalability, safety, or clean iteration if left unaddressed |
| **Medium** | Meaningful quality gap that should be planned but does not block immediate progress |
| **Low** | Useful improvement or polish that can wait |

Severity must reflect **impact**, not just style or lint noise.

---

## Phase 6 — Evidence Rule

The audit must never produce vague findings.

Every issue must be backed by:

- file paths
- code patterns or anti-patterns found
- missing structures (e.g., no error boundary, no type guard)
- repeated violations of the same pattern
- direct rule mismatch with traceable line of reasoning
- architectural inconsistencies visible across multiple files

**A finding without evidence must not be included in the output.**

---

## Phase 7 — Workstream Grouping

The audit groups related issues into workstreams to make the output actionable as execution planning, not a flat list.

### Standard Workstreams

| Workstream | Covers |
|---|---|
| Architecture Cleanup | Dependency violations, circular imports, layer breaks |
| Event and Lifecycle | Async side effects, event naming, producer/consumer clarity |
| Testing Foundation | Missing tests, weak coverage, unreliable test patterns |
| Dependency Hygiene | Version issues, unsafe libs, unused packages |
| Security Hardening | Auth gaps, env leaks, privacy compliance |
| UI and Accessibility | WCAG, keyboard, ARIA, component quality |
| Performance | Bundle size, render cost, network efficiency |
| API and Environment | Contract consistency, env config hygiene |
| Modularity and Coupling | SRP violations, tight coupling, missing boundaries |
| Type Safety | TypeScript gaps, `any` usage, missing guards |

---

## Phase 8 — Sprint Planning Model

The audit produces a sprint-aware remediation plan.

### Sprint Boundaries

| Sprint | Focus |
|---|---|
| **Sprint 1** | Critical and high-severity issues with the largest blast radius or strongest dependency impact |
| **Sprint 2** | Structural improvements that unlock maintainability and reduce future change cost |
| **Sprint 3** | Quality, polish, consistency, and lower-priority items |

### Sprint Assignment Factors

The planner must consider:

- severity classification
- dependency order between fixes
- architectural leverage (fixing A unlocks fixing B and C)
- fix feasibility given current codebase state
- blast radius (how many areas does this touch)
- regression risk if left unfixed

Sprint grouping must be defensible, not arbitrary. The agent should explain why each issue belongs in its assigned sprint.

---

## Event and Event Management Review

Because event management is a high-value concern, the audit explicitly reviews event-related quality when relevant.

### What to evaluate

- whether important side effects are modeled explicitly
- whether event naming is consistent across the codebase
- whether tracking and analytics are scattered or structured
- whether background actions have defined ownership
- whether AI generation flows have visible state transitions
- whether producers and consumers are clear and traceable
- whether correlation or lifecycle metadata is missing
- whether event-driven logic is tangled into unrelated UI or domain code

### Source rules for event review

- `tracking-standards.rules.json`
- `memory-and-lifecycle.rules.json`
- `dependency-architecture.rules.json`

### If major event architecture weaknesses are found

The audit should recommend or require the creation of:

- `Event-Architecture.md`
- `Event-Catalog.md`
- `Event-Contracts.md`

These artifacts become Sprint 1 outputs when event violations are critical or high severity.

---

## Output Artifacts

The audit must generate at least these four artifacts:

### `Audit-Report.md`

Executive summary of the audit.

Minimum contents:
- repository shape summary
- rulesets applied and why
- major risks discovered
- major strengths observed
- top issues by severity (top 5-10)
- plain-language recommendation summary
- whether the project is safe to keep building on as-is

### `Audit-Issues.json`

Machine-readable structured issue set.

Minimum contents:
- full issue objects following the issue model above
- severity and category for each issue
- rule source reference
- affected file list
- remediation hint

### `Refactor-Plan.md`

Human-readable grouped remediation plan.

Minimum contents:
- issues grouped by workstream
- why each workstream matters
- dependency relationships between workstreams
- what should be addressed first
- suggested approach for each group

### `Sprint-Plan.md`

Priority-based execution plan.

Minimum contents:
- sprint goals for Sprint 1, 2, and 3
- issues assigned to each sprint with rationale
- dependencies between sprints noted
- suggested order of work within each sprint

### Optional: `Rule-Coverage.md`

Coverage report showing which rulesets were applied, which were excluded and why, and where rule coverage was strong or weak.

---

## Autopilot Behavior

The agent must be able to run the full audit pipeline without user micromanagement:

1. inspect the repository
2. choose the rule packs
3. run the comparison
4. write structured issues
5. build the remediation plan
6. split work into sprints
7. write the executive summary

### When to pause and ask

The agent should only interrupt the user when:

- the repository context is too weak to determine project shape
- the codebase is too large for an honest full scan without scoping guidance
- the audit target is ambiguous
- the chosen rule packs would be materially wrong without clarification
- a focused `--focus` mode produces no meaningful findings

---

## Plain-Language Output Rule

Because many vibe coders are not specialists, the audit summary must be understandable without a technical background.

The summary should tell the user:

- what shape the project currently has
- what the biggest problems are
- what these problems will cause if they are ignored
- what should be fixed first
- whether the project is safe to keep building on as-is

Do not make the final summary feel like a wall of lint messages.

---

## Safety Rule

The audit must **not mutate the codebase** by default.

Default outputs are findings, issues, remediation plan, and sprint plan only.

Any future safe auto-fix mode must be explicit, limited in scope, and require user confirmation.

The audit command must not silently edit large portions of the codebase under the banner of analysis.

---

## Suggested Internal Components

The implementation should include:

```
core/
  audit/
    rule-loader.ts          — loads and validates rule packs from the reference directory
    codebase-auditor.ts     — orchestrates repository inspection and rule comparison
    issue-generator.ts      — produces structured issues from comparison results
    sprint-planner.ts       — assigns issues to sprints based on severity and dependency
    audit-summary.ts        — writes the executive summary in plain language
```

These names are conceptual and may evolve. The behavior contract is what matters.

---

## Suggested Skill

The internal skill supporting this behavior:

```
skills/governance/codebase-auditor/SKILL.md
```

This skill defines:
- when to run the audit
- what context is required before starting
- how rule selection works
- what artifacts must be generated
- how autopilot behavior should proceed
- when the system must halt or narrow scope

---

## Suggested Output File Locations

Audit outputs should be written to:

```
.vdd/
  audits/
    <timestamp>/
      Audit-Report.md
      Audit-Issues.json
      Refactor-Plan.md
      Sprint-Plan.md
      Rule-Coverage.md    (optional)
```

This keeps audit history accessible without polluting the root of the repository.

---

## Relationship to Imported Audit Assets

The imported archive (`coding-standards-skill/`) includes:

- rule references (`.rules.json` files)
- a project config template
- an audit engine script
- detector configuration
- shell helpers for audit setup

These are useful raw material. However, VDD should:

- preserve them in `archive/imported-material/` form
- extract the useful standards logic into VDD-native rule packs
- re-express the behavior through VDD-native components
- keep the command experience consistent with the VDD system

Do not depend on the imported Python scripts as authoritative runtime logic. They are reference material, not the execution engine.

---

## V1 Scope

### V1 must support

- repository-aware scanning
- project-shape detection
- relevant rule pack selection
- standards comparison
- structured issue generation
- grouped remediation plan
- sprint planning (3 sprints)
- plain-language executive summary
- autopilot execution flow
- focused mode with `--focus <area>`

### V1 must not yet support

- broad auto-fix by default
- silent remediation commits
- opaque black-box scoring without explanation
- mandatory support for every language equally
- large-scale repository rewriting without explicit checkpoints

The first version must behave like an **honest audit and planning engine**, not a reckless fixer.

---

## Contribution Rule

Contributors extending the audit layer must declare:

- which rule sources they use
- how they interpret those rules
- what evidence model they rely on
- how issues are scored and severity is assigned
- how sprint planning decisions are made
- what assumptions the audit makes about repository shape

This keeps the audit system inspectable, trustworthy, and consistent across contributors.

---

# IMPLEMENTATION GUIDE — How the Audit System Works

## Complete Command Flow

### 1. User Invokes Audit

```bash
# Full audit with automatic rule selection
/vibe.audit

# Focused audits
/vibe.audit --focus architecture
/vibe.audit --focus testing
/vibe.audit --focus security
/vibe.audit --focus performance

# Mode selection
/vibe.audit --mode report           # Report only
/vibe.audit --mode fix-plan         # Remediation only
/vibe.audit --mode sprints          # Sprint plan only

# Combined
/vibe.audit --focus testing --mode sprints
```

---

## 2. System-Level Execution Flow

The audit engine executes in this sequence:

### Phase 1: Initialization & Context Collection
```
1. Load user request and flags
2. Determine audit mode and focus area
3. Load RULES_INDEX.json (central registry)
4. Load rule files from /rules/ directory
5. Initialize audit state and file paths
```

### Phase 2: Repository Inspection & Shape Detection
```
1. Scan directory structure
2. Analyze package.json (dependencies, scripts, config)
3. Read tsconfig.json (TypeScript configuration)
4. Examine file extensions (TypeScript, JavaScript, CSS, etc)
5. Count lines of code by language
6. Detect frameworks (React, Express, etc)
7. Check for test files and coverage reports
8. Look for CI/CD configuration
9. Inspect architecture baseline files (.vdd/project-state.json)
10. Infer project type: frontend/backend/fullstack/AI-native
```

**Produces:** Repository profile with categorization

### Phase 3: Rule Pack Selection (Intelligent Filtering)
```
1. Start with "always applied" base rules (master, testing, error-handling, etc)
2. Detect frontend? Add: ui-ux, accessibility, component-modularity, styling, defensive-rendering
3. Detect backend? Add: api-consistency, environment-consistency
4. Detect AI features? Add: memory-and-lifecycle, incremental-intelligence-architecture
5. Detect auth/payments? Add: security-privacy
6. Detect high performance needs? Add: performance
7. Detect TypeScript? Add: type-system
8. Create final rule set ordered by RULES_INDEX.json ruleLoadOrder
```

**Produces:** Ordered list of active rule files with why each was selected

### Phase 4: Codebase Analysis & Pattern Extraction
```
For each active rule file:
  1. Parse rule definitions
  2. Extract detection patterns
  3. Scan codebase for violations
  4. Record evidence (file paths, patterns found)
  5. Match violations against rule constraints
  6. Generate structured issue objects
```

**Produces:** Raw issue list with evidence

### Phase 5: Issue Deduplication & Consolidation
```
1. Group identical issues across files
2. Remove duplicates (keep strongest evidence)
3. Filter out trivial/noisy issues
4. Add cross-file context
5. Link related issues
```

**Produces:** Clean, non-redundant issue set

### Phase 6: Severity & Impact Scoring
```
For each issue:
  1. Start with base severity from rule
  2. Adjust for:
     - Number of affected files (isolated vs pervasive)
     - Blast radius (how many parts of codebase depend on this)
     - Is this a blocker for other work?
     - Test coverage impact
     - Performance impact
     - Security risk
  3. Final severity ∈ {critical, high, medium, low}
```

**Produces:** Scored issue list

### Phase 7: Workstream Grouping
```
1. Categorize each issue by workstream
2. Identify workstream dependencies
3. Calculate workstream effort estimates
4. Group related issues together
5. Create dependency graph
```

**Produces:** Issues organized by workstream with dependency data

### Phase 8: Sprint Planning
```
1. Assign critical/high-severity issues to Sprint 1
2. Identify dependencies that must be resolved first
3. Weight by blast radius and leverage
4. Fill Sprint 1 until it reaches reasonable capacity
5. Remaining high-severity → Sprint 2
6. Medium/low severity → Sprint 2 or Sprint 3
7. Create sprint dependency notes
```

**Produces:** Sprint-organized work plan

### Phase 9: Report Generation
```
1. Write Audit-Report.md (executive summary)
2. Write Audit-Issues.json (structured data)
3. Write Refactor-Plan.md (workstream grouping)
4. Write Sprint-Plan.md (execution roadmap)
5. Optionally write Rule-Coverage.md
```

**Produces:** Four output documents

### Phase 10: Summary & Output
```
1. Display executive summary to user
2. Show top 3-5 critical findings
3. Indicate next steps
4. Show file locations for detailed reports
5. Explain what happens next
```

---

## 3. Detailed Output Specifications

### Output File: Audit-Report.md

**Location:** `.vdd/audits/<timestamp>/Audit-Report.md`

**Format:**
```markdown
# Code Audit Report
**Date:** YYYY-MM-DD HH:MM:SS UTC
**Repository:** /path/to/repo
**Audit Scope:** full | --focus <area>

---

## Executive Summary

[Plain language summary suitable for non-technical stakeholders]

"This project is a React-based SaaS frontend with some backend integration points.
The codebase shows good testing practices but has architectural gaps in event handling
and missing accessibility standards. With targeted work in Sprint 1, the project is 
safe to continue building on. The team should prioritize dependency cleanup before
adding new features."

---

## Repository Profile

- **Type:** frontend | backend | fullstack | monorepo | AI-native
- **Languages:** TypeScript (85%), JavaScript (10%), CSS (5%)
- **Framework:** React 18.2, Next.js 14
- **Total LOC:** ~25,000
- **Test Coverage:** 72% (target: 80%)
- **Test Strategy:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions

---

## Rule Coverage

- **Rulesets Applied:** 12 of 19
- **Always Applied:** master-rules, testing, error-handling, dependency-architecture
- **Conditionally Added:** ui-ux-engineering, accessibility, component-modularity (frontend)
- **Excluded:** security-privacy (no auth/payments), memory-and-lifecycle (not AI-native)

---

## Top Findings by Severity

### 🔴 Critical (1 issue)
- **Circular Dependency in Event System:** Detected cycle in src/events/ → src/hooks/ → src/events/
  *Impact:* Blocking bundling, risk of dead dependencies
  *Sprint:* 1 (immediate)

### 🟠 High (5 issues)
- Event ownership boundaries missing in async AI generation
- Missing accessibility labels in 23 components
- No error boundaries in 4 critical pages
- Unstable import paths (no path aliases)
- Missing TypeScript guards on 3 util functions

### 🟡 Medium (12 issues)
- Component size violations (8 components > 250 lines)
- Inconsistent event naming across 6 event files
- Missing coverage in error scenarios (12 untested paths)

### 🔵 Low (8 issues)
- Styling token usage inconsistencies
- Minor documentation gaps
- Unused dependencies (2 packages)

---

## Risk Assessment

### Overall Risk: 🟡 MEDIUM
This codebase is buildable and mostly healthy, but has structural gaps that will
become expensive to fix if ignored. Recommend addressing Sprint 1 before adding
major new features.

### Key Risks
1. **Circular imports will cause problems** when tree-shaking is aggressive
2. **Event system coupling** makes testing harder and creates hidden failures
3. **Accessibility issues** may create legal liability as scale grows
4. **Type gaps** will increase runtime errors over time

### What is Strong
✅ Good test coverage (72%) with real unit tests  
✅ Clear component structure mostly follows SRP  
✅ Dependency injection strategies are mostly sound  
✅ Error handling strategy is documented  

---

## Recommendations

### Immediate (Sprint 1)
- ⚠️ **CRITICAL:** Fix circular dependency — 2 hours, 1 developer
- 🔧 **HIGH:** Refactor event system boundaries — 6-8 hours
- 🔧 **HIGH:** Add accessibility labels via aria-label — 3-4 hours

### Short-term (Sprint 2)
- 📐 Reduce component sizes
- 🏗️ Establish event architecture documentation
- 📊 Increase test coverage to 80%

### Medium-term (Sprint 3)
- 🎨 Standardize styling token usage
- 📚 Update type definitions for strict mode
- 🧹 Clean up unused dependencies

---

## Next Steps

1. Review full `Sprint-Plan.md` for detailed breakdown
2. Review `Refactor-Plan.md` for workstream dependencies
3. Assign Sprint 1 issues to team members
4. Reserve 2-3 hours this week for architecture discussion
```

### Output File: Audit-Issues.json

**Location:** `.vdd/audits/<timestamp>/Audit-Issues.json`

**Format:**
```json
{
  "audit_metadata": {
    "timestamp": "2026-03-30T15:45:30Z",
    "repository_path": "/path/to/vibe-driven-dev",
    "audit_mode": "full",
    "focus_area": null,
    "rulesets_applied": [
      "core/master-rules.json",
      "core/regression-prevention.rules.json",
      "architecture/dependency-architecture.rules.json"
    ],
    "total_issues": 26,
    "critical": 1,
    "high": 5,
    "medium": 12,
    "low": 8
  },
  "issues": [
    {
      "issue_id": "AUD-CIRC-001",
      "title": "Circular Dependency in Event System",
      "severity": "critical",
      "category": "architecture",
      "rule_source": "circular-dependency.rules.json",
      "rule_id": "CIRC-01",
      "description": "Detected import cycle that prevents tree-shaking and causes bundling issues",
      
      "why_it_matters": "Circular imports prevent proper dead-code elimination. When dependencies form cycles, the bundler cannot determine which code is actually used, leading to inflated bundle sizes and potential runtime errors due to initialization order issues.",
      
      "evidence": [
        {
          "file": "src/events/useEventBus.ts",
          "pattern": "import from src/hooks/useAsyncEvent.ts",
          "line_range": [1, 10]
        },
        {
          "file": "src/hooks/useAsyncEvent.ts",
          "pattern": "import from src/events/useEventBus.ts",
          "line_range": [5, 15]
        },
        {
          "pattern": "Cycle detected: useEventBus → useAsyncEvent → useEventBus"
        }
      ],
      
      "affected_files": [
        "src/events/useEventBus.ts",
        "src/hooks/useAsyncEvent.ts",
        "src/events/EventManager.ts"
      ],
      
      "suggested_remediation": "Extract shared types to src/types/EventTypes.ts. Have both files import from types only. Move event bus initialization logic to separate factory file.",
      
      "estimated_effort_hours": 2,
      "sprint_assignment": 1,
      "blocks_sprints": [2, 3],
      "prerequisite_for": ["AUD-EVENT-002", "AUD-EVENT-003"],
      
      "verification_command": "npm run debug:deps",
      "test_impact": "High — all event-related tests need reverification"
    },
    {
      "issue_id": "AUD-EVENT-002",
      "title": "Missing Event Ownership Boundaries",
      "severity": "high",
      "category": "architecture",
      "rule_source": "dependency-architecture.rules.json",
      "evidence": [
        "src/ai/generate.ts has direct DOM updates in async callback",
        "src/hooks/useGenerate.ts writes to global state without clear producer/consumer"
      ],
      "affected_files": ["src/ai/generate.ts", "src/hooks/useGenerate.ts"],
      "suggested_remediation": "Create Event-Architecture.md and define producer/consumer map",
      "estimated_effort_hours": 6,
      "sprint_assignment": 1,
      "depends_on": ["AUD-CIRC-001"]
    }
  ]
}
```

### Output File: Refactor-Plan.md

**Location:** `.vdd/audits/<timestamp>/Refactor-Plan.md`

**Format:**
```markdown
# Refactor & Remediation Plan
**Generated:** 2026-03-30  
**Repository:** /vibe-driven-dev  
**Estimated Total Effort:** 24-32 hours

---

## Workstream 1: Architecture Cleanup
**Priority:** CRITICAL  
**Effort:** 8-10 hours  
**Blocks:** All other workstreams  

### Issues in This Workstream
- Circular Dependency in Event System (AUD-CIRC-001) — 2 hours
- Dependency Architecture Violations (AUD-ARCH-001) — 3-4 hours
- Missing Import Path Standardization (AUD-ARCH-002) — 2-3 hours

### Why This Matters
Without clean architecture, every subsequent change becomes riskier. Event system coupling causes hidden failures and makes testing harder.

### How to Fix
1. Extract shared types to `src/types/` directory
2. Break circular imports by moving event initialization to factory
3. Add path aliases to tsconfig.json (`@types/`, `@hooks/`, etc)
4. Verify with `npm run debug:deps` (no cycles)

### Success Criteria
✅ All circular dependencies resolved  
✅ Import paths follow pattern: `@{category}/{file}`  
✅ `npm run debug:deps` reports clean  
✅ All tests still pass  

---

## Workstream 2: Event System Architecture
**Priority:** HIGH  
**Effort:** 6-8 hours  
**Depends On:** Workstream 1  

### Issues in This Workstream
- Missing Event Ownership Boundaries (AUD-EVENT-002) — 6 hours
- Inconsistent Event Naming (AUD-EVENT-003) — 2 hours

### Why This Matters
Unclear event ownership leads to subtle bugs in async flows, especially in AI generation pipelines.

### How to Fix
1. Create `Event-Architecture.md` defining producer/consumer map
2. Create `Event-Catalog.md` listing all events with schemas
3. Enforce naming: `{domain}:{action}:{target}` (e.g., `ai:generate:start`)
4. Add Event TypeScript types

### Success Criteria
✅ Event-Architecture.md is signed off  
✅ All events follow naming convention  
✅ Producer/consumer relationships are documented  
✅ Event tests provide 90%+ coverage  

---

## Workstream 3: Testing Foundation
**Priority:** HIGH  
**Effort:** 5-6 hours  
**Parallel With:** Workstream 1

### Issues in This Workstream
- Insufficient Test Coverage (AUD-TEST-001) — need 80% target
- Missing Error Scenario Tests (AUD-TEST-002)
- Flaky Tests in Event Handling (AUD-TEST-003)

### How to Fix
1. Add tests for error paths (500 errors, timeouts, auth failures)
2. Stabilize async tests using proper waitFor() patterns
3. Mock external APIs consistently
4. Add integration tests for critical flows

### Dependencies Between Workstreams

```
┌─────────────────────────────┐
│  Architecture Cleanup (W1)  │ ← CRITICAL BLOCKER
└────────────┬────────────────┘
             │
        Blocks ↓
     ┌────────────────────┐    ┌──────────────────────┐
     │ Event System (W2)  │    │ Testing (W3)         │
     └────────────────────┘    └──────────────────────┘
             │                           │
             └───────────┬───────────────┘
                    Can run in parallel
```

---

## Implementation Roadmap

### Week 1: Architecture
- Mon-Tue: Break circular imports
- Wed: Standardize import paths
- Thu-Fri: Verify clean, update tests

### Week 2-3: Event System + Testing
- Mon-Tue: Document event architecture
- Wed: Create event catalog
- Thu-Fri: Add event tests
- Run in parallel: Testing foundation improvements

### Week 4: Polish
- Polish, document, final verification

---

## Risk Mitigation

### 🔴 High-Risk Changes
- Breaking import structures → mitigate with codemods
- Renaming events → mitigate with find-and-replace tools
- Circular dependency fixes → mitigate with incremental commits

### Testing Strategy During Refactoring
- Run full test suite after each big change
- Use git branches for risky refactoring
- Have 1 reviewer per branch
- Keep commits small and reviewable
```

### Output File: Sprint-Plan.md

**Location:** `.vdd/audits/<timestamp>/Sprint-Plan.md`

**Format:**
```markdown
# Sprint-Based Execution Plan
**Total Capacity:** 24-32 engineer-hours  
**Recommended Pace:** 1 sprint per week  

---

## Sprint 1: Foundation & Critical Fixes
**Duration:** 1 week (40 hours)  
**Priority:** 🔴 BLOCKING  
**Team:** 2 developers  
**Goal:** Fix circular dependencies and establish clean architecture  

### Sprint 1 Issues

| Issue | Effort | Owner | Depends | Blocks |
|-------|--------|-------|---------|--------|
| AUD-CIRC-001: Fix circular event imports | 2h | Dev-A | — | All W2, W3 |
| AUD-ARCH-001: Standardize import paths | 2-3h | Dev-A | CIRC-001 | AUD-EVENT-002 |
| AUD-ARCH-002: Update tsconfig aliases | 1h | Dev-B | — | — |
| AUD-TEST-001: Add error scenario tests | 4-5h | Dev-B | — | — |
| AUD-ACC-001: Add ARIA labels to 5 critical components | 3-4h | Dev-C | — | — |

### Daily Standup Questions
- Are we unblocked from Architecture Cleanup?
- Did tests pass after refactoring?
- Do we have clean dependency graph?

### Success Criteria
✅ `npm run debug:deps` shows zero cycles  
✅ All tests pass (72%+ coverage maintained)  
✅ Critical accessibility issues addressed  
✅ Team can articulate new architecture  

### Sprint 1 Done Checklist
- [ ] Circular dependency fix reviewed and merged
- [ ] Import aliases applied and tested
- [ ] Event system identified issues documented
- [ ] Error tests increase coverage
- [ ] Code review sign-off from tech lead

---

## Sprint 2: Event Architecture & Quality
**Duration:** 1 week  
**Priority:** 🟠 HIGH  
**Depends On:** Sprint 1 complete  
**Team:** 2 developers  
**Goal:** Establish event system clarity and improve test coverage  

### Sprint 2 Issues

| Issue | Effort | Owner |
|-------|--------|-------|
| AUD-EVENT-002: Event ownership boundaries | 6h | Dev-A |
| AUD-EVENT-003: Standardize event naming | 2h | Dev-B |
| AUD-TEST-002: Event system tests (90%+) | 4-5h | Dev-B |
| AUD-COMP-001: Reduce component sizes | 3-4h | Dev-C |

### Success Criteria
✅ Event-Architecture.md is finalized  
✅ All events follow naming convention  
✅ Event test coverage > 90%  
✅ No component > 250 lines  

---

## Sprint 3: Polish & Optimization
**Duration:** 1 week  
**Priority:** 🟡 MEDIUM  
**Depends On:** Sprint 2  
**Team:** 1-2 developers  
**Goal:** Handle remaining medium/low issues  

### Sprint 3 Issues

| Issue | Effort | Owner |
|-------|--------|-------|
| AUD-PERF-001: Identify unused dependencies | 2h | Dev-A |
| AUD-TYPE-001: Address TS `any` usage | 3-4h | Dev-B |
| AUD-DOC-001: Update architecture documentation | 2-3h | Dev-A |

---

## Cross-Sprint Patterns

### Issue Dependencies
```
Sprint 1: Architecture Cleanup
    ↓ (unblocks)
Sprint 2: Event System architecture
    ↓ (enables)
Sprint 3: Optimizations and refinement
```

### Testing Strategy
- Sprint 1: Maintain current coverage, add error paths
- Sprint 2: Reach 80%+ target coverage
- Sprint 3: Achieve 85%+ with edge cases

### Communication Plan
- Daily standups: 15 min (quick status check)
- Sprint review: Friday 3 PM (demo to stakeholders)
- Sprint planning: Monday 10 AM (next sprint setup)

---

## Effort Estimation Confidence

- **Sprint 1:** High confidence (2 developers × 20 hours)
- **Sprint 2:** Medium confidence (2 developers × 18 hours, depends on Sprint 1)
- **Sprint 3:** Low confidence (variable scope, depends on progress)

**Total Realistic Effort:** 24-32 hours across 3 weeks

---

## Go/No-Go Decision Points

### After Sprint 1
**Go:** If circular dependencies resolved and tests pass  
**No-Go:** If new issues emerge or tests become flaky  
**Decision:** Tech lead + PM

### After Sprint 2
**Go:** If event architecture documented and clear  
**No-go:** If event system too complex to refactor safely  
**Decision:** Tech lead + team consensus  

### After Sprint 3
**Go:** Code ready for production  
**Decision:** Engineering manager
```

---

## 4. Practical Examples

### Example Issue: Circular Dependency

**Raw Finding:**
```
src/events/useEventBus.ts → src/hooks/useAsyncEvent.ts → src/events/useEventBus.ts
```

**Structured Issue:**
```json
{
  "issue_id": "AUD-CIRC-001",
  "title": "Circular Dependency in Event System",
  "severity": "critical",
  "evidence": [
    "useEventBus.ts line 3: import { useAsyncEvent } from hooks",
    "useAsyncEvent.ts line 8: import { useEventBus } from events"
  ],
  "suggested_remediation": "Extract EventBusContext to types/EventTypes.ts",
  "estimated_effort_hours": 2,
  "sprint_assignment": 1
}
```

**Fix Approach:**

Before:
```typescript
// src/events/useEventBus.ts
import { useAsyncEvent } from '../hooks/useAsyncEvent';  // ❌ imports from hooks

export function useEventBus() { ... }
```

```typescript
// src/hooks/useAsyncEvent.ts
import { useEventBus } from '../events/useEventBus';  // ❌ imports from events
```

After:
```typescript
// src/types/EventTypes.ts
export interface EventBusContext { ... }  // ✅ no imports from other modules

// src/events/useEventBus.ts
import type { EventBusContext } from '../types/EventTypes';  // ✅ only types

// src/hooks/useAsyncEvent.ts
import type { EventBusContext } from '../types/EventTypes';  // ✅ only types
```

---

## 5. Integration with VDD Workflow

### Before Running Audit
```bash
npm run build          # Ensure code compiles
npm run test          # Ensure tests pass
git status            # Ensure clean working directory
```

### Running Audit
```bash
/vibe.audit
# OR
/vibe.audit --focus architecture
```

### After Audit
```bash
cat .vdd/audits/<latest>/Audit-Report.md  # Read summary
cat .vdd/audits/<latest>/Sprint-Plan.md   # See execution plan
npm run debug:deps                        # Verify current state
```

### During Remediation
Each issue becomes a task:
```bash
git checkout -b fix/AUD-CIRC-001
# make changes
npm run test
git push origin fix/AUD-CIRC-001
# create PR with reference to AUD-CIRC-001
```

---

## 6. For Different Users

### For Product Managers
Read: `Audit-Report.md` (executive summary section)  
Key info: Risk level, critical findings, timeline estimate  

### For Engineers
Read: `Sprint-Plan.md` + `Refactor-Plan.md`  
Key info: Issues assigned to you, dependencies, estimated effort  

### For AI Agents
Load: `Audit-Issues.json`  
Key info: Machine-readable issues, evidence, remediation hints  

### For Tech Leads
Read: Full `Refactor-Plan.md` + `Audit-Issues.json`  
Key info: Architecture risks, remediation dependencies, team assignments  

---

## 7. Quality Checklist for Audit Output

Before marking audit complete, verify:

### Report Quality
- [ ] Executive summary is understandable by non-technical reader
- [ ] Top 5 issues are clearly explained with why they matter
- [ ] Risk assessment is specific (not vague)
- [ ] Recommendations are actionable

### Issue Quality
- [ ] Every issue has evidence (not just assertions)
- [ ] Severity is justified and defensible
- [ ] Remediation hints are specific (not vague)
- [ ] Effort estimates are realistic

### Plan Quality
- [ ] Sprint 1 is genuinely the highest-impact work
- [ ] Dependencies are explicit and correct
- [ ] Each workstream has clear success criteria
- [ ] Effort estimates sum to realistic total

### Completeness
- [ ] All 4 output files present
- [ ] Issues are comprehensive (not missing obvious problems)
- [ ] Rule sources are documented
- [ ] Project context is clear for future audits
