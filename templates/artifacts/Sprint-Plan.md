# Sprint Plan — {{PROJECT_NAME}}

**Generated:** {{AUDIT_DATE}}  
**Audit ID:** {{AUDIT_ID}}  
**Total Issues:** {{ISSUE_TOTAL}}  
**Sprints:** 3

---

## Sprint 1 — Blockers and High Risk

**Goal:** Resolve all critical and high-severity issues that threaten correctness, safety, or architectural stability. After Sprint 1, the codebase should be safe to keep building on.

**Estimated scope:** {{SPRINT_1_ISSUE_COUNT}} issues

| Issue ID | Title | Severity | Workstream | Affected Files |
|---|---|---|---|---|
| AUD-001 | ... | Critical | Architecture | ... |
| AUD-002 | ... | High | Security | ... |

**Why these come first:**

{{SPRINT_1_RATIONALE}}

**Sprint 1 Definition of Done:**
- All Critical issues resolved
- All High issues resolved or unblocked with plan
- No new critical issues introduced during fixes
- Architecture document updated if structural changes were made

---

## Sprint 2 — Structural Improvements

**Goal:** Address structural issues that block maintainability and increase future change cost. After Sprint 2, the codebase should be easier to iterate on safely.

**Estimated scope:** {{SPRINT_2_ISSUE_COUNT}} issues

| Issue ID | Title | Severity | Workstream | Affected Files |
|---|---|---|---|---|
| AUD-010 | ... | Medium | Testing | ... |
| AUD-011 | ... | Medium | Modularity | ... |

**Why these come after Sprint 1:**

{{SPRINT_2_RATIONALE}}

**Prerequisite from Sprint 1:**

{{SPRINT_2_PREREQUISITES}}

**Sprint 2 Definition of Done:**
- All planned Medium issues resolved
- Test coverage expanded to cover areas changed in Sprint 1
- No structural regressions from Sprint 1 fixes
- At least one architecture document updated to reflect changes

---

## Sprint 3 — Quality, Polish, and Consistency

**Goal:** Address remaining medium and low-severity issues. After Sprint 3, the codebase should be production-quality and consistent.

**Estimated scope:** {{SPRINT_3_ISSUE_COUNT}} issues

| Issue ID | Title | Severity | Workstream | Affected Files |
|---|---|---|---|---|
| AUD-020 | ... | Medium | UI | ... |
| AUD-021 | ... | Low | Styling | ... |

**Why these come last:**

{{SPRINT_3_RATIONALE}}

**Sprint 3 Definition of Done:**
- All planned remaining issues resolved
- Rule-Coverage.md updated to reflect new compliance levels
- Audit re-run confirms no critical or high issues remain
- Documentation updated to reflect architectural decisions made during remediation

---

## Sprint Dependencies

```
Sprint 1 must complete before Sprint 2 begins.
Sprint 2 must complete before Sprint 3 begins.

Within Sprint 1:
  - Security issues can be addressed in parallel with Architecture issues
  - Architecture issues must complete before Event/Lifecycle fixes begin

Within Sprint 2:
  - Testing expansion should begin only after Architecture Cleanup is stable
  - Modularity and Performance can be addressed in parallel

Within Sprint 3:
  - UI and Accessibility work is fully independent
  - Type safety improvements can proceed in parallel
```

---

## Post-Sprint: Audit Re-Run

After all three sprints are complete, run `/vibe.audit` again.

The re-run should show:
- zero Critical issues
- zero or minimal High issues
- a reduced Medium and Low count
- improved Rule-Coverage scores

If new Critical or High issues are found, begin a new Sprint 1 cycle.

---

## Notes

<!-- Agent-authored notes about specific sprint decisions -->

{{SPRINT_NOTES}}
