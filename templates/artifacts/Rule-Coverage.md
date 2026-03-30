# Rule Coverage Report — {{PROJECT_NAME}}

**Generated:** {{AUDIT_DATE}}  
**Audit ID:** {{AUDIT_ID}}

---

## Applied Rulesets

| Ruleset | Applied | Issues Found | Reason for Application |
|---|---|---|---|
| `master-rules.json` | Yes | {{N}} | Applied to all projects |
| `testing.rules.json` | Yes | {{N}} | Applied to all projects |
| `error-handling.rules.json` | Yes | {{N}} | Applied to all projects |
| `dependency-architecture.rules.json` | Yes | {{N}} | Applied to all projects |
| `circular-dependency.rules.json` | Yes | {{N}} | Applied to all projects |
| `regression-prevention.rules.json` | Yes | {{N}} | Applied to all projects |
| `ui-ux-engineering.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `accessibility.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `component-modularity.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `styling-tokens.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `defensive-rendering.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `memory-and-lifecycle.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `incremental-intelligence-architecture.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `tracking-standards.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `security-privacy.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `environment-consistency.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `api-consistency.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `performance.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `type-system.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `path-resolution.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `libraries-usage.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |
| `assets-handling.rules.json` | {{YES/NO}} | {{N}} | {{REASON}} |

---

## Excluded Rulesets

| Ruleset | Excluded | Reason |
|---|---|---|
| `dropdown-portal-pattern.rules.json` | Yes | Highly specific to React portal patterns — only applied when explicitly detected |
| `motion-system.json` | Yes | Animation system rules — only applied when a motion system is present |

---

## Coverage Gaps

<!-- Note any areas where coverage was limited due to missing rules or language constraints -->

{{COVERAGE_GAPS}}

---

## Summary

- **Total rulesets available:** {{TOTAL_AVAILABLE}}
- **Rulesets applied:** {{TOTAL_APPLIED}}
- **Rulesets excluded:** {{TOTAL_EXCLUDED}}
- **Issues generated:** {{ISSUE_TOTAL}}
- **Rules without violations:** {{CLEAN_RULES}}
