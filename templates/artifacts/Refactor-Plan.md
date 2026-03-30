# Refactor Plan — {{PROJECT_NAME}}

**Generated:** {{AUDIT_DATE}}  
**Audit ID:** {{AUDIT_ID}}  
**Total Workstreams:** {{WORKSTREAM_COUNT}}

---

## Overview

{{OVERVIEW_PARAGRAPH}}

---

## Workstream 1: Architecture Cleanup

**Why this matters:**  
Architectural violations create hidden coupling, make the codebase hard to reason about, and cause cascading failures when features need to change.

**Issues covered:** {{ARCHITECTURE_ISSUE_IDS}}

**Dependencies:**  
This workstream should be addressed first. Dependency and layering violations affect every other area of the codebase.

**Suggested approach:**  
{{ARCHITECTURE_APPROACH}}

---

## Workstream 2: Event and Lifecycle Clarity

**Why this matters:**  
Unmanaged async side effects and invisible event patterns lead to unpredictable behavior, hard-to-trace bugs, and AI flow failures.

**Issues covered:** {{EVENT_ISSUE_IDS}}

**Dependencies:**  
Depends on Architecture Cleanup being addressed first where applicable.

**Suggested approach:**  
{{EVENT_APPROACH}}

---

## Workstream 3: Testing Foundation

**Why this matters:**  
Without adequate testing, every refactor and new feature carries hidden regression risk. Tests are the safety net that lets you move fast.

**Issues covered:** {{TESTING_ISSUE_IDS}}

**Dependencies:**  
Can begin in parallel with structural cleanup. Best done after Architecture Cleanup to avoid testing unstable structures.

**Suggested approach:**  
{{TESTING_APPROACH}}

---

## Workstream 4: Dependency Hygiene

**Why this matters:**  
Circular dependencies and unsafe packages create brittleness and make large-scale changes impossible without unexpected breakage.

**Issues covered:** {{DEPENDENCY_ISSUE_IDS}}

**Dependencies:**  
Can be addressed in parallel with other workstreams.

**Suggested approach:**  
{{DEPENDENCY_APPROACH}}

---

## Workstream 5: Security Hardening

**Why this matters:**  
Security gaps create exposure risk that grows as the user base grows. Auth, data handling, and environment issues should be addressed before scale.

**Issues covered:** {{SECURITY_ISSUE_IDS}}

**Dependencies:**  
No hard dependencies. Should be addressed in Sprint 1 if any critical issues were found.

**Suggested approach:**  
{{SECURITY_APPROACH}}

---

## Workstream 6: UI and Accessibility

**Why this matters:**  
Inaccessible UIs exclude users and create compliance risk. Component quality issues slow down future feature development.

**Issues covered:** {{UI_ISSUE_IDS}}

**Dependencies:**  
Best addressed after Architecture Cleanup and Modularity improvements.

**Suggested approach:**  
{{UI_APPROACH}}

---

## Workstream 7: Performance

**Why this matters:**  
Performance issues compound at scale. Large bundles, slow renders, and inefficient network usage hurt retention and conversion.

**Issues covered:** {{PERFORMANCE_ISSUE_IDS}}

**Dependencies:**  
Architectural improvements often unlock performance improvements. Address Architecture Cleanup first.

**Suggested approach:**  
{{PERFORMANCE_APPROACH}}

---

## Workstream 8: Modularity and Coupling Reduction

**Why this matters:**  
Tightly coupled components make changes expensive and risky. Improving modularity reduces the blast radius of every future change.

**Issues covered:** {{MODULARITY_ISSUE_IDS}}

**Dependencies:**  
Related to Architecture Cleanup. Can be addressed together.

**Suggested approach:**  
{{MODULARITY_APPROACH}}

---

## Dependency Map

<!-- Show which workstreams must precede others -->

```
Architecture Cleanup
  → unlocks: Event and Lifecycle, Testing Foundation, Modularity
  → informs: Performance

Security Hardening
  → independent, but critical severity elevates to Sprint 1

Testing Foundation
  → best after: Architecture Cleanup
  → enables: safer Sprint 2 and 3 work

UI and Accessibility
  → best after: Modularity and Coupling Reduction
```

---

## Notes

<!-- Any cross-cutting notes about the remediation plan -->

- Focus on workstreams with Critical and High severity issues first
- Avoid reworking areas that will be significantly changed by Architecture Cleanup
- Establish a test for any area being touched to prevent regression
