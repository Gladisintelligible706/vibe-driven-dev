# Code Audit System — Complete Documentation

This directory contains comprehensive documentation for Vibe Driven Dev's **Code Audit & Remediation System**.

---

## 📋 What is This?

A complete, production-ready system for:
- ✅ Scanning codebases against engineering standards
- ✅ Identifying real issues (not just lint noise)
- ✅ Generating remediation plans grouped by workstream
- ✅ Creating sprint-based execution roadmaps
- ✅ Providing plain-language summaries for all stakeholders

**One command:** `/vibe.audit`

---

## 📚 Documentation Files

### For Getting Started
**→ [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md)** (15 minutes read)

Quick-start guide for running and reading audits.

**Contains:**
- How to run audits (`/vibe.audit` commands)
- What each output file means
- Quick decision tree (for whom to read what)
- Acting on specific issues
- Common patterns
- FAQ

**Read this if:** You want to run an audit and understand results quickly.

---

### For Understanding the Rules
**→ [`RULES_REFERENCE.md`](./RULES_REFERENCE.md)** (20 minutes read)

Complete reference for how the rule system works.

**Contains:**
- 22 different rule files explained
- When each rule applies
- What each rule looks for
- Why it matters
- How rules get selected
- Rule interaction & dependencies
- Adding new rules

**Read this if:** You want to understand why an issue was flagged, or you're maintaining rules.

---

### For Technical Implementation
**→ [`code-audit-and-remediation.md`](./code-audit-and-remediation.md)** (45 minutes read)

Complete architectural specification for the audit pipeline.

**Contains:**
- Purpose and principles
- 8-phase execution pipeline (detailed)
- Repository understanding algorithm
- Rule selection logic
- Issue deduplication & severity scoring
- Output specifications (4 templates)
- Integration with VDD workflow
- Quality checklist for outputs

**Read this if:** You're implementing the audit system or you're a tech lead understanding every detail.

---

## 🎯 Your Role → Which Doc to Read

### I'm a Developer
**Start:** [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md)
- How to run audits
- What issues are assigned to you
- How to fix them

### I'm a Tech Lead / Architect
**Start:** [`code-audit-and-remediation.md`](./code-audit-and-remediation.md)
- Understand the full system
- Read detailed phase descriptions
- Understand dependencies & blocking work

**Then:** [`RULES_REFERENCE.md`](./RULES_REFERENCE.md)
- Understand why specific standards are used
- Understand rule interactions

### I'm a Product Manager / Manager
**Start:** [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md)
- Section: "Executive Summary" under Audit-Report.md
- Section: "Risk Assessment"
- Understand timeline and priorities

### I'm Maintaining the Audit System
**Start:** [`code-audit-and-remediation.md`](./code-audit-and-remediation.md)
- Full pipeline understanding
- Phase details and algorithms

**Then:** [`RULES_REFERENCE.md`](./RULES_REFERENCE.md)
- All 22 rules explained
- When/why they apply
- How to extend

### I'm Adding a New Rule
**All three docs** (in order)
1. [`RULES_REFERENCE.md`](./RULES_REFERENCE.md) — Understand existing rules first
2. [`code-audit-and-remediation.md`](./code-audit-and-remediation.md) — Understand where it fits
3. Principles section in [`code-audit-and-remediation.md`](./code-audit-and-remediation.md) — How to contribute

---

## 🔄 Document Relationships

```
                    ┌─────────────────────────────┐
                    │  Overview & Purpose         │
                    │                             │
                    │  (this file)                │
                    └────────────────┬────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
    
   QUICK START          DEEP DIVE               RULES REFERENCE
   (15 min)             (45 min)                (20 min)
   
   ✅ How to run        ✅ Full pipeline       ✅ 22 rules explained
   ✅ Read outputs     ✅ Phase details      ✅ Rule interactions
   ✅ Act on issues    ✅ Algorithms         ✅ Adding new rules
   ✅ FAQ              ✅ Template specs     ✅ Severity model
   
   For: Developers    For: Architects       For: Rule maintainers
                           & Leaders
```

---

## 🚀 Quick Commands

### Run a Comprehensive Audit
```bash
/vibe.audit
```
Scans your project, detects standards, produces 4 output files.

### Run a Focused Audit
```bash
/vibe.audit --focus architecture
/vibe.audit --focus testing
/vibe.audit --focus security
```

### See Outputs
```bash
# After running audit:
cat .vdd/audits/<timestamp>/Audit-Report.md
cat .vdd/audits/<timestamp>/Sprint-Plan.md
```

---

## 📊 System Overview

### 10-Phase Pipeline

```
Phase 1: Initialization
    ↓
Phase 2: Repository Inspector
    ↓ (detects: languages, frameworks, project type)
Phase 3: Rule Pack Selection
    ↓ (selects 8-15 relevant rulesets)
Phase 4: Codebase Analysis
    ↓ (scans for violations)
Phase 5: Deduplication
    ↓ (removes noise)
Phase 6: Severity Scoring
    ↓ (critical/high/medium/low)
Phase 7: Workstream Grouping
    ↓ (groups by architecture area)
Phase 8: Sprint Planning
    ↓ (splits into 3-week sprints)
Phase 9: Report Generation
    ↓ (creates 4 output files)
Phase 10: Summary & Output
    ↓
Done ✅
```

### Output Files

| File | For Whom | Use Case |
|---|---|---|
| **Audit-Report.md** | Everyone | Executive summary, risk, recommendations |
| **Audit-Issues.json** | Machines, CI/CD | Structured data for tooling |
| **Refactor-Plan.md** | Tech leads | Workstream grouping, dependencies |
| **Sprint-Plan.md** | Engineers | Task assignment, execution order |

---

## 🎓 Learning Paths

### Path 1: I Just Want to Run an Audit (5 min)
1. Read: [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md) — "30-Second Overview"
2. Run: `/vibe.audit`
3. Read result files in `.vdd/audits/<timestamp>/`
4. Done ✅

### Path 2: I Need to Understand My Audit Results (20 min)
1. Read: [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md) — Full document
2. Run: `/vibe.audit`
3. Navigate to output directory
4. Read: Audit-Report.md exec summary
5. Read: Sprint-Plan.md for your sprint
6. Done ✅

### Path 3: I'm Leading the Remediation (45 min)
1. Read: [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md)
2. Read: [`code-audit-and-remediation.md`](./code-audit-and-remediation.md) — All sections
3. Run: `/vibe.audit`
4. Review: Refactor-Plan.md + Report.md
5. Assign Sprint 1 tasks
6. Done ✅

### Path 4: I'm Implementing the Audit System (2-3 hours)
1. Read: [`code-audit-and-remediation.md`](./code-audit-and-remediation.md) — Full
2. Read: [`RULES_REFERENCE.md`](./RULES_REFERENCE.md) — Full
3. Study the 10-phase pipeline
4. Review output template specifications
5. Build Phase 1-10 implementation
6. Test on sample codebase
7. Done ✅

### Path 5: I'm Adding a New Rule (1 hour)
1. Read: [`RULES_REFERENCE.md`](./RULES_REFERENCE.md) — Tier explanation
2. Read: [`code-audit-and-remediation.md`](./code-audit-and-remediation.md) — Contribution section
3. Design rule JSON
4. Test pattern detection
5. Integrate into RULES_INDEX.json
6. Test on codebase
7. Done ✅

---

## 📖 Key Concepts

### The Audit Finds Problems, Not Just Lint

The audit is **not** just a wrapper around linters. It:
- ✅ Understands repository shape first
- ✅ Applies only relevant standards
- ✅ Groups issues by workstream
- ✅ Prioritizes by impact & dependency
- ✅ Creates sprint plans

Linters produce noise. The audit produces judgment.

### Issues Have Evidence

Every issue includes:
- **Why it matters** — Plain language explanation
- **Evidence** — The specific files/patterns found
- **Estimated effort** — How long to fix
- **Sprint assignment** — When to do it
- **Dependencies** — What blocks this, what this blocks

### Severity is Justified

Issues aren't arbitrary severity. They're scored by:
- Blast radius (how many files affected)
- Blocking power (does this block other work?)
- Risk level (what breaks if ignored?)
- Maintainability impact (how much harder does this make the code?)

---

## 🔗 Related Documentation

- **VDD Blueprint:** `.vdd/docs/blueprint/` (architecture baseline)
- **VDD Skill Definition:** `.agents/skills/` (audit system skill)
- **Standard Rules:** `.vdd/rules/` (22 rule files)
- **Project State:** `.vdd/project-state.json` (baseline snapshot)

---

## ❓ FAQ

**Q: How long does an audit take?**  
A: 2-5 minutes depending on codebase size.

**Q: How often should I audit?**  
A: After each major sprint, or quarterly.

**Q: Can the audit be wrong?**  
A: Yes, it's a tool. Always review findings with your team.

**Q: Can I ignore an issue?**  
A: Yes, but document why. Tech debt compounds.

**Q: How do I know if the audit is good?**  
A: Issues should have evidence, severity should be justified, remediation should be specific.

---

## 📝 Maintenance Notes

### What Gets Updated
- Rule files when standards change
- Severity if patterns shift
- Integration points with VDD workflow

### What Stays Stable
- 10-phase pipeline (core algorithm)
- Output file format (backward compat)
- Issue model structure (machine readable)

### Version History
- **v1.0:** Full pipeline, 22 rules, sprint planning
- **v1.1+:** TBD (rules additions, refinements)

---

## 💬 Contributing

To improve the audit system:

1. **Found a bug?** Document with evidence
2. **New rule idea?** Explain why it matters
3. **Better wording?** Submit revised text
4. **New feature?** Propose with use cases

See contribution guidelines in [`code-audit-and-remediation.md`](./code-audit-and-remediation.md#contribution-rule).

---

## 📄 License & Attribution

This audit system is part of **Vibe Driven Dev**.

All documentation is available for team use and extension.

---

**Last Updated:** 2026-03-30  
**Status:** Production Ready  
**Completeness:** 100%  

Start with [`AUDIT_QUICK_START.md`](./AUDIT_QUICK_START.md) →
