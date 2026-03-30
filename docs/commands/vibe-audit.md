# `/vibe.audit` — Command Specification

## Purpose

Run a structured, autopilot codebase audit against curated coding standards and produce an actionable remediation plan with sprint-based prioritization.

This command exists because working code is not the same as healthy code.

`/vibe.audit` gives a non-specialist the judgment of a technical staff engineer: it understands the project, applies the right standards, finds real issues, and tells the developer exactly what to fix and in what order.

---

## Command

```
/vibe.audit
```

---

## Variants

| Command | Effect |
|---|---|
| `/vibe.audit` | Full audit: scan → select → compare → issues → plan → sprints |
| `/vibe.audit --focus architecture` | Architecture and dependency audit only |
| `/vibe.audit --focus testing` | Testing coverage and quality audit only |
| `/vibe.audit --focus security` | Security and privacy audit only |
| `/vibe.audit --focus performance` | Performance audit only |
| `/vibe.audit --focus events` | Event management and lifecycle audit only |
| `/vibe.audit --focus accessibility` | Accessibility audit only |
| `/vibe.audit --mode report` | Produce Audit-Report.md only |
| `/vibe.audit --mode fix-plan` | Produce Refactor-Plan.md only |
| `/vibe.audit --mode sprints` | Produce Sprint-Plan.md only |

---

## What It Does

The command runs through eight ordered phases in autopilot mode:

### 1. Understand the repository
- infer project type, language, frameworks, and shape
- detect auth, tests, AI features, events, design system presence
- determine greenfield vs brownfield

### 2. Select rule packs
- choose relevant `.rules.json` files based on project shape
- never apply every rule to every project
- record the selection and rationale

### 3. Load rules
- parse each selected rule file
- understand enforcement criteria for each rule

### 4. Scan and compare
- read through the codebase
- match patterns against active rules
- collect evidence for any violations

### 5. Generate issues
- produce structured, evidence-backed issues
- classify each by severity: critical, high, medium, low
- every issue includes: title, why it matters, evidence, affected files, suggested fix

### 6. Group issues into workstreams
- cluster related issues into logical workstreams
- make the output actionable, not a flat list

### 7. Build sprint plan
- Sprint 1: blockers and high-risk issues
- Sprint 2: structural improvements
- Sprint 3: quality and polish

### 8. Write artifacts
- `Audit-Report.md` — executive summary
- `Audit-Issues.json` — machine-readable issue set
- `Refactor-Plan.md` — grouped remediation plan
- `Sprint-Plan.md` — priority execution roadmap

---

## Output Location

```
.vdd/audits/<ISO-timestamp>/
  Audit-Report.md
  Audit-Issues.json
  Refactor-Plan.md
  Sprint-Plan.md
  Rule-Coverage.md   (optional)
```

---

## Skill Used

```
skills/governance/codebase-auditor/SKILL.md
```

---

## Stage

Cross-stage. May be used at any point in the VDD journey, or independently on any repository.

---

## Prerequisites

- repository root must be accessible
- at least one rule reference file must be readable from `skills/governance/codebase-auditor/references/`

---

## Halt Conditions

The command stops and asks the user when:

- the repository root cannot be determined
- the codebase is too large for a full scan without scoping (suggests `--focus`)
- no rule reference files are accessible
- the project type is completely ambiguous

---

## Safety Rule

This command is **read-only by default**.

It does not edit any source file during execution.

Output is findings, plan, and recommendations only.

---

## Extension

This command belongs to the `governance` pack and follows the standard `/vibe.<action>` naming convention.

Future extensions may include:
- `/vibe.audit --autofix-safe` (safe, limited auto-remediation — V2 feature)
- additional focus areas as new rule packs are added
- integration with CI/CD for automated audit runs
