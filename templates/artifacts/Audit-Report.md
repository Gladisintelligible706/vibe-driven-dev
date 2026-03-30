# Audit Report — {{PROJECT_NAME}}

**Date:** {{AUDIT_DATE}}  
**Auditor:** VDD Codebase Auditor v0.1  
**Rulesets Applied:** {{RULESET_COUNT}}  
**Total Issues Found:** {{ISSUE_TOTAL}} ({{CRITICAL}} Critical · {{HIGH}} High · {{MEDIUM}} Medium · {{LOW}} Low)

---

## Repository Shape

**Project Type:** {{PROJECT_TYPE}}  
**Languages:** {{LANGUAGES}}  
**Frameworks:** {{FRAMEWORKS}}  
**Has Auth:** {{HAS_AUTH}}  
**Has Tests:** {{HAS_TESTS}}  
**Has Design System:** {{HAS_DESIGN_SYSTEM}}  
**Has Event Patterns:** {{HAS_EVENTS}}  
**Has Analytics:** {{HAS_ANALYTICS}}  
**Has AI Features:** {{HAS_AI}}  
**Is Monorepo:** {{IS_MONOREPO}}  
**Greenfield or Brownfield:** {{REPO_AGE}}

---

## Rulesets Applied

<!-- List the rule packs applied and why each was selected -->

| Ruleset | Why Applied |
|---|---|
| `master-rules.json` | Applied to all projects — cross-cutting standards |
| `testing.rules.json` | ... |

---

## Top Risks

<!-- Plain-language summary of the 3-5 most important issues. Use language a non-specialist can understand. -->

### 1. [Title of top risk]
[What it is, why it matters, what happens if ignored]

### 2. [Title of second risk]
[...]

### 3. [Title of third risk]
[...]

---

## Strengths Observed

<!-- Be honest. Include real positives observed in the codebase. -->

- [Strength 1]
- [Strength 2]
- [Strength 3]

---

## Issues by Severity

| Severity | Count |
|---|---|
| Critical | {{CRITICAL}} |
| High | {{HIGH}} |
| Medium | {{MEDIUM}} |
| Low | {{LOW}} |
| **Total** | **{{ISSUE_TOTAL}}** |

See `Audit-Issues.json` for the full structured issue set.

---

## Recommendation Summary

<!-- 2-4 sentences telling the user what to do next. Should answer: is this codebase safe to keep building on as-is? -->

{{RECOMMENDATION_SUMMARY}}

See `Refactor-Plan.md` for the full remediation plan and `Sprint-Plan.md` for the prioritized execution roadmap.
