# Code Audit & Remediation — Quick Start Guide

This guide shows you how to **run, read, and act on** a code audit in Vibe Driven Dev.

---

## 30-Second Overview

The audit system automatically:
1. Scans your codebase
2. Compares against relevant standards
3. Finds real issues (not just lint noise)
4. Groups them into sprints
5. Creates actionable plans

**Command:** `/vibe.audit`

---

## Running an Audit

### Full Audit (Recommended)
```bash
/vibe.audit
```

✅ Full system scan + rule selection + report generation  
⏱️ Takes 2-5 minutes depending on codebase size  
📁 Outputs to `.vdd/audits/<timestamp>/`  

### Focused Audits (When You Have a Hunch)
```bash
/vibe.audit --focus architecture    # Only architecture issues
/vibe.audit --focus testing         # Only testing gaps
/vibe.audit --focus security        # Only security risks
/vibe.audit --focus performance     # Only performance issues
```

### Report-Only Mode (For Review)
```bash
/vibe.audit --mode report           # Just the report, no sprint plan
/vibe.audit --mode fix-plan         # Just grouped remediation, no sprints
```

---

## Reading the Audit Results

The audit produces **4 files**. Here's what each one tells you:

### 1. `Audit-Report.md` — START HERE
**For:** Everyone (non-technical friendly)  
**Read time:** 5 minutes  

This is your executive summary. It tells you:
- ✅ What's strong about your codebase
- ⚠️ What's risky
- 🔴 Top 5 critical issues
- 📊 Risk score (low/medium/high)
- 💡 What to do next

**Example section:**
```
## Executive Summary

This is a React frontend with good testing practices but some architectural gaps.
The circular dependency issue is blocking tree-shaking. With Sprint 1 work,
the project is safe to build on.

## Risk Assessment
Overall Risk: 🟡 MEDIUM

Key Risks:
1. Circular imports in event system (will break tree-shaking)
2. Missing event ownership boundaries (hidden failures)
3. Low accessibility coverage (legal risk as you scale)

What Is Strong:
✅ Good test coverage (72%)
✅ Clear component structure
✅ Error handling mostly sound
```

### 2. `Sprint-Plan.md` — FOR EXECUTION
**For:** Engineers & team leads  
**Read time:** 10 minutes  

Shows the **exact work to do**, in order:

```
## Sprint 1: Foundation & Critical Fixes
Duration: 1 week
Team: 2 developers
Goal: Fix circular dependencies

| Issue | Effort | Owner | Blocks |
|-------|--------|-------|--------|
| AUD-CIRC-001: Fix circular imports | 2h | Dev-A | W2, W3 |
| AUD-ARCH-001: Standardize paths | 2-3h | Dev-A | — |
| AUD-TEST-001: Add error tests | 4-5h | Dev-B | — |

Sprint Success Criteria:
✅ npm run debug:deps shows zero cycles
✅ Tests pass (maintain 72%+ coverage)
✅ Team understands new architecture
```

This is your task list. Assign these directly to engineers.

### 3. `Refactor-Plan.md` — FOR PLANNING
**For:** Tech leads & architects  
**Read time:** 15 minutes  

Shows **why** certain work must be done in certain order:

```
## Workstream 1: Architecture Cleanup
Priority: CRITICAL
Effort: 8-10 hours
Blocks: All other workstreams

Why This Matters:
Without clean architecture, every feature becomes riskier.
Circular imports prevent tree-shaking and bundling optimizations.

How to Fix:
1. Extract shared types to src/types/
2. Break circular by moving initialization to factory
3. Add path aliases (tsconfig.json)
4. Verify: npm run debug:deps
```

Use this for:
- Understanding dependencies between work
- Explaining **why** Sprint 1 is necessary
- Planning timelines with confidence
- Identifying risks

### 4. `Audit-Issues.json` — FOR AUTOMATION
**For:** CI/CD pipelines, scripts, AI agents  
**Read time:** 5 minutes (or for machines)  

Machine-readable issue catalog. Example:

```json
{
  "issue_id": "AUD-CIRC-001",
  "title": "Circular Dependency in Event System",
  "severity": "critical",
  "evidence": [
    "src/events/useEventBus.ts imports src/hooks/useAsyncEvent.ts",
    "src/hooks/useAsyncEvent.ts imports src/events/useEventBus.ts"
  ],
  "affected_files": ["src/events/useEventBus.ts", "src/hooks/useAsyncEvent.ts"],
  "suggested_remediation": "Extract types to src/types/EventTypes.ts",
  "estimated_effort_hours": 2,
  "sprint_assignment": 1
}
```

Use for programmatic tooling, CI linting, or feeding into project management tools.

---

## Quick Decision Tree

```
Are you a...

📊 PRODUCT MANAGER?
   → Read: Audit-Report.md (Executive Summary section)
   → Look for: Risk score, timeline estimate
   → Action: Decide if you want Sprint 1 to proceed

👨‍💻 ENGINEER?
   → Read: Sprint-Plan.md
   → Look for: Issues assigned to you, dependencies
   → Action: Create git branch, start Sprint 1 work

🏗️ TECH LEAD?
   → Read: Refactor-Plan.md + Audit-Issues.json
   → Look for: Workstream dependencies, risks
   → Action: Review with team, adjust timelines

🤖 AI AGENT?
   → Load: Audit-Issues.json
   → Look for: issue_id, severity, suggested_remediation
   → Action: Generate fixes, create PRs
```

---

## Acting on a Single Issue

Let's say the audit found: **"AUD-CIRC-001: Circular Dependency in Event System"**

### Step 1: Understand It
```
Title: Circular Dependency in Event System
Severity: Critical
Why It Matters: Prevents tree-shaking, blocks bundling
Evidence: 
  - src/events/useEventBus.ts imports useAsyncEvent
  - useAsyncEvent imports useEventBus back
Estimated Effort: 2 hours
Sprint: 1 (do this first)
```

### Step 2: Plan the Fix
```
Current Problem:
  useEventBus.ts → imports useAsyncEvent.ts
  useAsyncEvent.ts → imports useEventBus.ts
  
Solution:
  1. Create src/types/EventTypes.ts (shared types only)
  2. useEventBus.ts imports from types
  3. useAsyncEvent.ts imports from types
  4. Run: npm run debug:deps (verify clean)
```

### Step 3: Execute
```bash
# Create branch
git checkout -b fix/AUD-CIRC-001

# Make changes
# ...edit files...

# Verify
npm run build
npm run test

# Push and create PR
git push origin fix/AUD-CIRC-001
```

Reference in PR: "Fixes AUD-CIRC-001: Circular Dependency in Event System"

### Step 4: Verify
After merge:
```bash
npm run debug:deps      # Should show no cycles now
npm run test            # Still passing?
git log --oneline       # See the fix in history
```

Mark issue **DONE** ✅

---

## Common Audit Patterns

### Pattern 1: Blocked Work
```
Sprint 1: Fix Circular Imports (AUD-CIRC-001)
  ↓ (blocks)
Sprint 2: Refactor Event System (AUD-EVENT-002)
  ↓ (blocks)
Sprint 3: Testing improvements (AUD-TEST-003)
```

**What to do:** Complete Sprint 1 before starting Sprint 2.

### Pattern 2: Parallel Work
```
Sprint 1: 
  - Architecture Cleanup (Team A) — BLOCKING
  - Add Error Tests (Team B) — PARALLEL
  - Fix Accessibility (Team C) — PARALLEL
```

**What to do:** Parallel work is fine as long as Architecture finishes first.

### Pattern 3: Risk Zones
```
High Risk:
  🔴 Circular imports (breaks bundling)
  🔴 Missing event boundaries (hidden failures)
  
Medium Risk:
  🟠 Component size violations
  🟠 Low test coverage
```

**What to do:** Always do High Risk first, Medium Risk can wait.

---

## When to Re-Audit

Run a new audit:
- ✅ After Sprint 1 completes (verify progress)
- ✅ Before major feature work (baseline)
- ✅ Quarterly (3 months) as prevention
- ✅ After large refactoring
- ✅ If team changes significantly

Do NOT re-audit:
- ❌ Every commit (too noisy)
- ❌ During active feature development (wait for milestone)
- ❌ More than once per week (wastes time)

---

## FAQ

**Q: Why is this issue critical but my code works fine?**  
A: Critical means high risk when scaled or maintained. Circular imports work in isolation but fail when:
- Tree-shaking is aggressive
- Module loading order changes
- Bundling becomes complex
This is about **future-proofing**, not immediate breakage.

**Q: Can I ignore low-severity issues?**  
A: Yes, but not forever. Low issues are:
- ✅ Safe to defer to Sprint 3
- ✅ Often cleanup/polish only
- ❌ Don't defer indefinitely (tech debt compounds)

**Q: Why are my tests affected by architecture fixes?**  
A: Clean architecture makes testing:
- ✅ Faster (less to mock)
- ✅ More reliable (fewer hidden dependencies)
- ✅ Easier to understand (clear producer/consumer)

Rerunning tests after architecture work is normal and good.

**Q: Can I do Sprint 2 work before Sprint 1?**  
A: Only if Sprint 1 has no dependencies. If Sprint 1 has "Blocks: Sprint 2", then no — do Sprint 1 first.

**Q: What if I disagree with a severity?**  
A: That's fine. Audit severity is a recommendation. The issue model shows why it was scored. Discuss with your tech lead.

---

## Getting Help

If you have questions:

1. **On the audit itself:** Read `Audit-Issues.json` (has reasoning for each issue)
2. **On sprint planning:** Read `Refactor-Plan.md` (explains dependencies)
3. **On a specific issue:** Look up the `rule_source` in that issue's JSON (e.g., `circular-dependency.rules.json`)
4. **On next steps:** Check `Audit-Report.md` recommendations section

---

**Updated:** 2026-03-30  
**For:** All team members  
**Questions?** See the full architecture guide at `code-audit-and-remediation.md`
