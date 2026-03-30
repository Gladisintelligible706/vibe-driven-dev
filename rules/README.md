# 🏛️ Vibe Driven Dev - Unified Rules System

## 📖 Overview

This directory contains the **complete, authoritative ruleset** for all coding standards, architectural guidelines, and quality expectations across the GTM Maps project.

**For AI Coding Agents:** Before writing ANY code, load and internalize the rules in priority order. See `RULES_INDEX.json` for the exact sequence.

---

## 📂 Directory Structure

```
rules/
├── README.md (this file)
├── RULES_INDEX.json (AI AGENT MANDATORY READING - rule loading order)
├── RULES_CATALOG.md (human-friendly rule catalog)
│
├── core/                    # P0 Blocking rules
│   ├── master-rules.json
│   ├── incremental-intelligence-architecture.rules.json
│   ├── regression-prevention.rules.json
│   └── type-system.rules.json
│
├── architecture/            # Module structure & dependencies
│   ├── dependency-architecture.rules.json
│   ├── circular-dependency.rules.json
│   ├── component-modularity.rules.json
│   ├── api-consistency.rules.json
│   └── path-resolution.rules.json
│
├── quality/                # Testing, A11y, Performance, Security
│   ├── testing.rules.json
│   ├── accessibility.rules.json
│   ├── performance.rules.json
│   ├── security-privacy.rules.json
│   ├── error-handling.rules.json
│   ├── tracking-standards.rules.json
│   ├── environment-consistency.rules.json
│   ├── libraries-usage.rules.json
│   └── regression-prevention.rules.json
│
├── ai-agents/              # Architecture docs for AI features
│   ├── ai-core-architecture.md
│   ├── ape-architecture.md
│   ├── pivl-architecture.md
│   ├── persona-guidelines.md
│   └── AGENT_GUIDELINES.md
│
└── docs/                   # Setup & migration guides
    ├── SETUP_FOR_AI_AGENTS.md
    ├── MIGRATION_GUIDE.md
    └── RULES_REFERENCE_QUICK.md
```

---

## 🎯 Core Principles

### **Consistency beats Creativity at Scale**
When multiple valid approaches exist, consistency ALWAYS wins. Rules enforce one way to do things.

### **Rules are Mandatory, Not Optional**
Every rule exists because a past project suffered when it wasn't enforced. Violations cause automatic PR rejection.

### **Evidence Over Assertions**
Every rule includes:
- **Why** it exists (pain point it solves)
- **What** it blocks (specific violations)
- **How** to verify (tooling)
- **How** to fix (explicit solutions)

---

## 🚀 Quick Start for AI Agents

### **1. Load Rules in This Order**

```bash
# See RULES_INDEX.json for definitive order
# These are the P0 BLOCKING rules:
1. core/incremental-intelligence-architecture.rules.json
2. core/regression-prevention.rules.json
3. core/master-rules.json
4. architecture/dependency-architecture.rules.json
... (see RULES_INDEX.json for complete sequence)
```

### **2. Understand Your Constraints**

Before writing code, ask:
- ✅ Does my code maintain unidirectional dependencies? (ARCH-DEP-01)
- ✅ Will my changes break any existing features? (REGRESSION-01)
- ✅ Are my components under 250 lines? (MOD-SIZE-02)
- ✅ Do my components follow SRP? (MOD-SRP-01)
- ✅ Is my code testable (80% target)? (TEST-04)
- ✅ Is my code accessible (WCAG 2.1)? (A11Y-01 through A11Y-04)

### **3. Generate Code with Rule Compliance**

Every generated code block should:
1. Follow architectural rules (dependency flow)
2. Follow component rules (size, SRP)
3. Follow testing rules (never output untested code)
4. Include comments explaining rule-driven decisions

### **4. Verify Before Output**

After generation, run through this checklist:
- [ ] No circular dependencies introduced
- [ ] No components > 250 lines
- [ ] Components follow single responsibility principle
- [ ] Tests included and cover main logic
- [ ] WCAG 2.1 compliance (for UI)
- [ ] No security violations (secrets, private by default)
- [ ] No hardcoded configuration

---

## 📋 Rule Categories Explained

### **CORE BLOCKING (P0)** 🔴
These rules CANNOT be violated. Any violation causes automatic code rejection.

| Rule | Purpose | Violation Cost |
|------|---------|-----------------|
| **Incremental Intelligence** | No large rewrites, only atomic changes | Major refactoring required |
| **Regression Prevention** | No feature loss, backward compatibility | Feature rollback + fix |
| **Master Rules** | All foundational coding rules | PR rejection |

### **ARCHITECTURE (P0/P1)** 🟠
These rules govern how code is organized and how modules interact.

| File | Enforces |
|------|----------|
| `dependency-architecture.rules.json` | Pages→Components→Hooks→Types flow |
| `circular-dependency.rules.json` | No import cycles |
| `component-modularity.rules.json` | Component size & responsibility limits |

### **QUALITY (P1/P2)** 🟡
These rules ensure code quality, accessibility, performance, and security.

| File | Enforces |
|------|----------|
| `testing.rules.json` | 80% coverage, unit/E2E tests |
| `accessibility.rules.json` | WCAG 2.1, keyboard nav, ARIA |
| `performance.rules.json` | Core Web Vitals, lazy loading |
| `security-privacy.rules.json` | Private by default, no secrets |

### **AI AGENT ARCHITECTURE** 🤖
These weren't rules—these are DOCS explaining how AI features work in this codebase.

| File | Describes |
|------|-----------|
| `ai-core-architecture.md` | AI module design |
| `ape-architecture.md` | Agent patterns |
| `pivl-architecture.md` | Progressive validation layer |

---

## 🔧 How to Use These Rules

### **For Code Review**
1. Open `RULES_INDEX.json` to identify which rules apply
2. Check generated code against each P0 and P1 rule
3. Document which rules were verified
4. Flag any violations with rule ID (e.g., "ARCH-DEP-01 violation in UserProfile.tsx line 45")

### **For AI Agent Configuration**
1. Load `RULES_INDEX.json` as system context
2. Provide rule files in the exact order specified in `ruleLoadOrder`
3. Add to agent prompt: "Before writing code, you MUST verify against EACH rule in the loaded files"
4. Request a compliance report after generation

### **For Onboarding New Developers**
1. Start with: `RULES_CATALOG.md` (human-friendly overview)
2. Then: `SETUP_FOR_AI_AGENTS.md` (implementation details)
3. Then: Specific rule files as needed

---

## 🔄 Relationship to code-audit-and-remediation.md

The rules system (`rules/`) is the **"what"**: the authoritative standards.

The audit system (`../docs/architecture/code-audit-and-remediation.md`) is the **"how"**: how to evaluate code against these standards and generate remediation plans.

**They work in tandem:**
1. Rules define expectations
2. Audit loads rules and scans code
3. Audit produces evidence-backed findings
4. Fixes are proposed based on specific rules

---

## 🔗 Integration Points

### **Git Hooks**
Pre-commit hooks can load `RULES_INDEX.json` to validate staged files.

### **CI/CD Pipeline**
The audit system (`/vibe.audit` command) uses these rules to generate remediation plans.

### **ESLint Config**
Custom ESLint rules enforce subset of these standards (dependency flow, component size).

### **Vitest Suite**
Test coverage requirements defined here (80% minimum, TEST-04).

### **TypeScript Config**
Type safety rules (TYPE-SAFETY-01, TYPE-SAFETY-02) enforced via strict mode.

---

## 📈 Rule Versioning

Each rule file has `version` field:
- `2.0.x` = Current stable version (stable)
- `1.x.x` = Legacy (to be migrated)
- `3.x.x` (in development) = Proposed changes

**For AI agents:** Always load the highest stable version of each rule.

---

## 🚨 Violation Handling

### **When You Find a Violation**

1. **P0 Violations** (Blocking):
   - Reject code immediately
   - Force rewrite following the rule
   - No exceptions without technical leadership approval

2. **P1 Violations** (High):
   - Flag with warning
   - Must be fixed in same sprint
   - Escalate to tech lead if unclear how to fix

3. **P2 Violations** (Medium):
   - Log in tracking system
   - Schedule for improvement
   - Non-blocking but tracked

4. **P3 Violations** (Low):
   - Advisory only
   - Consider for refactoring
   - No tracking required

---

## 🤝 Contributing to This Ruleset

### To Add a New Rule:
1. Identify which category it belongs in (core, architecture, quality, ai-agents)
2. Add to the appropriate `.rules.json` file in that category
3. Update `RULES_INDEX.json` to reference it
4. Update `RULES_CATALOG.md` with human-friendly description
5. Bump version number for that file
6. Update `lastUpdated` timestamp

### To Modify a Rule:
1. Edit the `.rules.json` file
2. Update version number
3. Add migration note if breaking change
4. Update related documentation

---

## 📚 Related Documentation

- **`code-audit-and-remediation.md`** - How audits evaluate code against these rules
- **`RULES_CATALOG.md`** - Human-readable catalog of all rules (in progress)
- **`SETUP_FOR_AI_AGENTS.md`** - Instructions for AI systems to use these rules
- **`../docs/architecture/`** - Overall architecture guides

---

## ✅ Checklist: Is This Ruleset Complete?

- [x] Core rules documented and enforced
- [x] Architecture rules documented and enforced
- [x] Quality standards documented and enforced
- [x] AI agent architecture documented
- [x] Clear violation handling process
- [x] Integration points identified
- [x] Agentworkflow documented
- [ ] Automated tooling to verify all rules (audit system)
- [ ] Examples and remediation patterns for each rule
- [ ] Metrics dashboard tracking rule violations

---

## 🎓 Learning Resources

For AI agents implementing compliance:
1. **Quick:** Read `RULES_INDEX.json` → `_AI_AGENT_CRITICAL_INSTRUCTIONS`
2. **Deep:** Read rule files in `ruleLoadOrder` sequence
3. **Practical:** Review `/docs` files for implementation patterns
4. **Real-world:** Run `/vibe.audit` to see rules in action on actual code

---

**Last Updated:** March 30, 2026  
**Org:** Vibe Driven Dev  
**Scope:** All projects using this ruleset
