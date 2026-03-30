# Code Audit Rules Reference

This document explains **how rules work** and **why they matter** for the audit system.

---

## Understanding the Rule System

The audit system is powered by curated **rule files** (`*.rules.json`). Each rule file contains:
- What to look for (patterns)
- Why it matters (context)
- What severity it should be
- How to fix it (remediation)

---

## Rule File Categories

### Tier 1: Core Standards (Applied to Everything)

These run on every project because they apply to all code:

#### `master-rules.json`
**What it checks:** Cross-cutting software engineering standards  
**Issues found:** Architecture violations, unsafe patterns, maintenance risks

Example issues:
- Circular imports
- Unidirectional dependency violations
- Missing error handling
- Type safety gaps

#### `testing.rules.json`
**What it checks:** Testing quality and coverage  
**Issues found:** Low coverage, missing edge cases, unreliable tests

Example issues:
- Coverage below 70%
- No tests for error scenarios
- Flaky async tests
- Missing mocks

#### `error-handling.rules.json`
**What it checks:** How errors are caught, logged, and recovered  
**Issues found:** Silent failures, missing observability, poor recovery

Example issues:
- Uncaught promise rejections
- Swallowed errors (empty catch blocks)
- Missing error logging
- No retry logic where needed

#### `dependency-architecture.rules.json`
**What it checks:** Import organization and layer enforcement  
**Issues found:** Violations of layering, backwards imports, coupling

Example issues:
- Views importing from domain logic (reversed)
- Services importing from UI components
- Missing abstraction boundaries

#### `circular-dependency.rules.json`
**What it checks:** Import cycles and circular references  
**Issues found:** Dead code elimination problems, bundling issues

Example issues:
- A → B → A cycles
- Prevents tree-shaking
- Breaks bundling optimization

#### `regression-prevention.rules.json`
**What it checks:** Breaking changes and backward compatibility  
**Issues found:** Unintended behavior changes, migration risks

Example issues:
- Changed function signatures without deprecation
- Removed public APIs
- Changed behavior of existing features

---

### Tier 2: Conditional Standards (Frontend Projects)

Only applied if the project has UI components:

#### `ui-ux-engineering.rules.json`
**When applied:** ReactJS, Vue, Svelte, or similar frontends  
**What it checks:** UI quality, interaction patterns, component engineering  
**Issues found:** Poor UX, accessibility gaps, interaction problems

Example issues:
- Components > 250 lines (too big)
- Missing loading states
- No empty states
- Keyboard navigation issues

#### `accessibility.rules.json`
**When applied:** Any frontend project  
**What it checks:** WCAG compliance, ARIA, keyboard navigation, color contrast  
**Issues found:** Accessibility barriers for disabled users

Example issues:
- Missing alt text on images
- No ARIA labels on buttons
- Color contrast fails WCAG AA
- No keyboard focus indicators

#### `component-modularity.rules.json`
**When applied:** Component-based UI (React, Vue, etc)  
**What it checks:** Single Responsibility Principle, coupling, cohesion  
**Issues found:** Components doing too much, tight coupling

Example issues:
- Component imports 15+ other components
- Business logic mixed with UI logic
- Hard to test because of coupling
- Component knows about API directly

#### `styling-tokens.rules.json`
**When applied:** Projects with design system or CSS  
**What it checks:** Consistent use of design tokens, theming support  
**Issues found:** Hard-coded colors, inconsistent spacing

Example issues:
- `color: #FF0000` instead of using `colors.error`
- `padding: 16px` instead of `spacing.md`
- Spacing values inconsistent
- No theme support

#### `defensive-rendering.rules.json`
**When applied:** Any frontend  
**What it checks:** Null safety, fallbacks, error boundaries  
**Issues found:** Crash risk, poor error states

Example issues:
- No null checks before `.map()`
- Missing error boundaries
- "Loading" state but no "Error" state
- No fallback images

#### `assets-handling.rules.json`
**When applied:** Projects with images/media  
**What it checks:** Image optimization, cache-busting, CDN usage  
**Issues found:** Performance issues, broken images

Example issues:
- Unoptimized PNG files
- Missing source-set for responsive images
- Direct hosting of uncompressed media
- No cache-busting for updates

---

### Tier 3: Conditional Standards (Backend/API Projects)

Only applied if the project has backend services:

#### `api-consistency.rules.json`
**When applied:** Node.js, Python, Go, or similar backends  
**What it checks:** API shape, naming, versioning, response contracts  
**Issues found:** Inconsistent APIs, hard-to-use endpoints

Example issues:
- `/api/user` vs `/api/users` (inconsistent naming)
- Response shape differs across endpoints
- No versioning strategy
- Missing pagination on list endpoints

#### `environment-consistency.rules.json`
**When applied:** Projects with configuration/secrets  
**What it checks:** Environment variable handling, secrets management  
**Issues found:** Secrets in code, missing configurations

Example issues:
- DB password hard-coded
- Missing .env.example
- Different env vars on different machines
- Secrets committed to git

---

### Tier 4: Conditional Standards (AI-Heavy Projects)

Only applied if the project has AI/ML or async pipelines:

#### `memory-and-lifecycle.rules.json`
**When applied:** Projects with state machines, AI features, long-lived tasks  
**What it checks:** Memory leaks, lifecycle management, cleanup expectations  
**Issues found:** Leaking resources, unclear initialization/teardown

Example issues:
- Event listeners never removed
- Database connections not closed
- Timers not cleared
- Missing teardown in cleanup functions

#### `incremental-intelligence-architecture.rules.json`
**When applied:** AI-native projects, LLM integrations, intelligent workflows  
**What it checks:** Progressive enhancement, fallback strategies, quality gates  
**Issues found:** No fallback when AI fails, missing quality checks

Example issues:
- AI generation fails and entire flow breaks
- No quality threshold before using AI output
- Missing human review for important decisions
- No rollback strategy

#### `tracking-standards.rules.json`
**When applied:** Projects with analytics or event tracking  
**What it checks:** Event naming, tracking hygiene, producer/consumer clarity  
**Issues found:** Missing events, inconsistent tracking, unclear ownership

Example issues:
- No event fired when conversion happens
- Event names inconsistent (`user_signup` vs `signup`)
- Unclear who produces/consumes each event
- Missing event documentation

---

### Tier 5: Conditional Standards (Type-Safe Projects)

Only applied if using TypeScript or typed languages:

#### `type-system.rules.json`
**When applied:** TypeScript projects, projects with type annotations  
**What it checks:** Type safety, use of `any`, type coverage  
**Issues found:** Type gaps, weak typing, runtime type errors

Example issues:
- Function parameters typed as `any`
- No type definitions for external APIs
- Type assertions instead of proper types
- Missing strict mode compiler flags

#### `path-resolution.rules.json`
**When applied:** TypeScript/JavaScript sibling of type-system  
**What it checks:** Import path consistency, path alias usage  
**Issues found:** Inconsistent import paths, breaking imports

Example issues:
- `import from ../../hooks` (relative hell)
- Should be `import from @hooks/...` (path alias)
- Mixed relative and absolute paths
- tsconfig.json missing path aliases

---

### Tier 6: Security & Compliance

Only applied if project handles sensitive data:

#### `security-privacy.rules.json`
**When applied:** Projects with auth, payments, personal data  
**What it checks:** Auth patterns, data handling, privacy compliance  
**Issues found:** Security vulnerabilities, privacy violations

Example issues:
- Passwords sent over unencrypted connection
- Personal data logged to stdout
- Missing input validation
- SQL injection vulnerability
- CORS too permissive

---

### Tier 7: Performance

Only applied if performance matters (most projects):

#### `performance.rules.json`
**When applied:** Customer-facing apps, high-traffic services  
**What it checks:** Bundle size, render performance, network requests  
**Issues found:** Slow pages, bloated bundles, unnecessary requests

Example issues:
- Bundle size > 500KB (uncompressed)
- Re-renders happening on every keystroke
- Unoptimized database queries
- N+1 query patterns
- Large images not optimized

---

## How Rules Get Selected

The audit engine automatically chooses which rules to apply based on what it detects:

### Detection Logic

```
1. Detect languages/frameworks in use
2. Is it frontend?  → Add UI, accessibility, component rules
3. Is it backend?   → Add API, environment rules
4. Is it TypeScript? → Add type-system rules
5. Is it AI-heavy?   → Add memory, intelligence, tracking rules
6. Has auth/payments? → Add security rules
7. Has performance requirements? → Add performance rules
8. Apply "Core" rules to everything
```

### Example: React + TypeScript SaaS

Rules that would be selected:
```
Core Standards:
  ✅ master-rules.json
  ✅ testing.rules.json
  ✅ error-handling.rules.json
  ✅ dependency-architecture.rules.json
  ✅ circular-dependency.rules.json
  ✅ regression-prevention.rules.json

Frontend Standards:
  ✅ ui-ux-engineering.rules.json
  ✅ accessibility.rules.json
  ✅ component-modularity.rules.json
  ✅ styling-tokens.rules.json
  ✅ defensive-rendering.rules.json
  ✅ assets-handling.rules.json

Type Safety:
  ✅ type-system.rules.json
  ✅ path-resolution.rules.json

Security (has auth):
  ✅ security-privacy.rules.json

Performance (customer-facing):
  ✅ performance.rules.json

Not Selected (no AI features):
  ❌ memory-and-lifecycle.rules.json
  ❌ incremental-intelligence-architecture.rules.json
  ❌ tracking-standards.rules.json
```

---

## Understanding Issue Severity

Each rule produces issues at specific severity levels:

### 🔴 CRITICAL
**Won't wait, fixes immediately:**
- Prevents shipping
- Blocks other features
- Security/compliance risk
- Complete feature breakage

Example: Circular import breaking bundling

### 🟠 HIGH
**Fix within 1 sprint:**
- Serious quality risk
- Scalability blocker
- Performance penalty
- Maintenance sink

Example: Missing event boundaries in async flows

### 🟡 MEDIUM
**Fix within 3 sprints:**
- Quality improvement
- Technical debt
- Future risk
- Could get worse

Example: Component size violations

### 🔵 LOW
**Fix when convenient:**
- Polish/cleanup
- Consistency improvement
- Documentation gap
- No immediate risk

Example: Unused dependency

---

## Rule Interaction & Dependencies

Some rules depend on others being satisfied first:

```
Circular Dependency Issues (rule: circular-dependency.rules.json)
  ↓ (blocks)
Architecture Cleanup (rule: dependency-architecture.rules.json)
  ↓ (enables)
Component Quality (rule: component-modularity.rules.json)
```

**Why:** You can't evaluate modularity if imports are still circular.

---

## Extending the Rule System

To add a new rule:

1. Create a new `.rules.json` file with:
   - `ruleName`: String identifier
   - `description`: What it checks
   - `frequency`: How often (per-file, per-project, manual)
   - `patterns`: Detection patterns
   - `severity`: Default severity level

2. Add to `RULES_INDEX.json`:
   - Specify when it applies
   - Set load order relative to other rules
   - Document why it exists

3. Example rule format:

```json
{
  "ruleName": "max-component-size",
  "description": "React components should not exceed 250 lines",
  "category": "component-modularity",
  "applies_to": ["frontend"],
  "patterns": [
    {
      "name": "oversized-component",
      "description": "Component file > 250 lines",
      "fileGlob": "src/components/**/*.tsx",
      "detection": "line_count > 250"
    }
  ],
  "severity": "medium",
  "remediation_hint": "Split component into smaller, focused components"
}
```

---

## For Rule Maintainers

### Principles

1. **Never noisy:** Remove rules that trigger on false positives
2. **Always actionable:** Every issue must have a clear fix direction
3. **Judgment-based:** Rules reflect Vibe Driven Dev values
4. **Maintainable:** Rules should not require constant tweaking

### Audit Quality Checklist

- [ ] Rule detects real problems (not false positives)
- [ ] Rule doesn't suggest impossible fixes
- [ ] Severity is justified and defensible
- [ ] Examples in rule documentation
- [ ] Tested on real codebases
- [ ] Rule applies to the right project types

---

## Quick Reference: What Rule to Check

| Problem You're Seeing | Check Rule |
|---|---|
| Components importing each other | `circular-dependency.rules.json` |
| Tests not passing | `testing.rules.json` |
| Errors not handled somewhere | `error-handling.rules.json` |
| Component too large | `ui-ux-engineering.rules.json` |
| Type errors or `any` usage | `type-system.rules.json` |
| Missing keyboard navigation | `accessibility.rules.json` |
| Performance issues | `performance.rules.json` |
| Memory leaking | `memory-and-lifecycle.rules.json` |
| Analytics events missing | `tracking-standards.rules.json` |
| API endpoints inconsistent | `api-consistency.rules.json` |
| Styling all over the place | `styling-tokens.rules.json` |

---

**Updated:** 2026-03-30  
**For:** Developers, architects, rule maintainers  
