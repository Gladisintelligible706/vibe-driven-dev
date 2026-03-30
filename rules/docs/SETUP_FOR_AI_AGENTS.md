# 🤖 Setup Guide for AI Coding Agents

This guide explains how to integrate the Vibe Driven Dev rules system into AI agent workflows and ensure compliance before code generation.

---

## 📖 Overview

The rules system is designed to be machine-readable. Before an AI agent generates ANY code, it must:

1. **Load** all relevant rule files in priority order
2. **Internalize** the constraints, philosophy, and patterns
3. **Plan** code generation within those constraints
4. **Generate** code with active rule checking
5. **Verify** output against each rule
6. **Report** compliance status

---

## 🚀 Quick Integration (5 minutes)

### **Step 1: Load the Rule Index**

```json
{
  "system_instruction": "You are a coding agent for the {{PROJECT_NAME}} platform.",
  "rule_context": {
    "source": "vibe-driven-dev/rules/RULES_INDEX.json",
    "instruction": "Load and internalize all rules in 'ruleLoadOrder' before generating code."
  }
}
```

### **Step 2: Load Rule Files in Order**

```
1. rules/core/incremental-intelligence-architecture.rules.json
2. rules/core/regression-prevention.rules.json
3. rules/core/master-rules.json
4. rules/architecture/dependency-architecture.rules.json
5. ... (see RULES_INDEX.json for complete order)
```

### **Step 3: Add to Agent Prompt**

```markdown
## CRITICAL: Before you generate ANY code:

1. Review the loaded rules in the specified order
2. Identify which rules apply to your current task
3. Mentally check each P0 and P1 constraint
4. Plan your code structure within those constraints
5. Generate code with active self-checking
6. Verify your output against EACH rule before outputting

If you violate any P0 rule, STOP and rewrite the code.
If you violate any P1 rule, continue but FLAG it in your response.
```

---

## 🏗️ Detailed Integration Steps

### **For Foundry Agents**

**File to create:** `.agents/CODE_QUALITY.md`

```markdown
# Code Quality Rules - To Load on Every Task

{{ AUTOIMPORT: vibe-driven-dev/rules/RULES_INDEX.json }}

## Agent Compliance Checklist

Before outputting ANY code:

- [ ] Loaded all rule files in RULES_INDEX.json ruleLoadOrder
- [ ] P0 rules internalized (blocking violations = code rejection)
- [ ] P1 rules understood (high priority violations)
- [ ] Verified code follows unidirectional dependency flow
- [ ] Verified no circular imports introduced
- [ ] Verified component size < 250 lines
- [ ] Verified no hardcoded secrets
- [ ] Verified accessibility compliance (WCAG 2.1)
- [ ] Verified testing coverage (80% target)

If ANY P0 violation detected:
  → Rewrite the code to fix it
  → Output the corrected version
  → Include an explanation of what was fixed

If ANY P1 violation detected:
  → Include warning: "P1 VIOLATION: [rule ID] — [description]"
  → Continue output (non-blocking, but tracked)
```

### **For System Prompts (Claude, GPT-4, etc.)**

Add this to your system message:

```
You must comply with the {{PROJECT_NAME}} Coding Rules System.

Before generating code:
1. Load: vibe-driven-dev/rules/RULES_INDEX.json
2. Review: ruleLoadOrder and priority tiers
3. Check: All P0 and P1 rules apply to your task
4. Verify: Your code follows each rule
5. Block: If any P0 violation exists, rewrite immediately

Rule Files (in order):
- vibe-driven-dev/rules/core/incremental-intelligence-architecture.rules.json
- vibe-driven-dev/rules/core/regression-prevention.rules.json
- [... complete list ...]

Security Self-Audit (run before every output):
✓ CHECK 1: No hardcoded secrets or credentials
✓ CHECK 2: No direct localStorage (use storageManager)
✓ CHECK 3: No external API calls outside allow-list
✓ CHECK 4: No sensitive data logging
✓ CHECK 5: All new routes have auth/authz

Output Format:
1. Generated code
2. Rule compliance report (each P0/P1 rule checked)
3. Warnings (if any P2/P3 violations)
4. Reasoning (why this code follows the rules)
```

---

## 📋 Rule-Specific Checklists

### **Incremental Intelligence (INCREMENTAL-01)**
- [ ] No large rewrites (max 20% of affected code changed)
- [ ] Changes are atomic (one feature per commit)
- [ ] All existing tests for changed code still pass
- [ ] Rollback plan documented if needed

### **Regression Prevention (REGRESSION-01)**
- [ ] Listed all potentially affected features
- [ ] Verified each feature still works post-change
- [ ] No tests were disabled or deleted
- [ ] Backward compatibility maintained

### **Unidirectional Dependencies (ARCH-DEP-01)**
- [ ] No component imports from pages/
- [ ] No circular imports between modules
- [ ] Shared logic moved to types/utils/
- [ ] Import order: Pages → Components → Hooks → Utils → Types

### **Component Size (MOD-SIZE-02)**
- [ ] Component ≤ 250 lines
- [ ] Max 3 useEffect hooks
- [ ] Single responsibility principle followed
- [ ] Complex logic extracted to custom hooks

### **Security (SEC-01 through SEC-06)**
- [ ] No hardcoded API keys, passwords, or tokens
- [ ] All storage via storageManager utility
- [ ] No direct localStorage or IndexedDB
- [ ] External API calls on approved whitelist
- [ ] Input validation with Zod + react-hook-form
- [ ] XSS prevention with DOMPurify

### **Testing (TEST-01 through TEST-04)**
- [ ] 80% code coverage (new code)
- [ ] Unit tests for business logic
- [ ] Integration tests for key components
- [ ] E2E tests for critical flows

### **Accessibility (A11Y-01 through A11Y-04)**
- [ ] Semantic HTML (button, nav, main, etc.)
- [ ] Keyboard navigable (Tab key works)
- [ ] Image alt attributes present
- [ ] ARIA labels for dynamic components

---

## ⚙️ Integration with Build/Test Pipeline

### **Pre-commit Hook**

```bash
#!/bin/bash

# Load the rules index
RULES_FILE="vibe-driven-dev/rules/RULES_INDEX.json"

# Check if any staged files violate circular dependencies
npm run debug:deps

# Run linting with rule-aware config
npm run lint

# Run tests with coverage threshold (80%)
npm run test:coverage

# If all pass, commit allowed
exit 0
```

### **CI/CD Integration (GitHub Actions)**

```yaml
name: Rule Compliance Check

on: [pull_request]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Load rules
        run: |
          echo "Loading vibe-driven-dev/rules/RULES_INDEX.json"
          cat vibe-driven-dev/rules/RULES_INDEX.json
      
      - name: Check dependencies (ARCH-DEP-01)
        run: npm run debug:deps
      
      - name: Run tests (TEST-04)
        run: npm run test:coverage
      
      - name: Accessibility audit (A11Y-01 through A11Y-04)
        run: npm run audit:a11y
      
      - name: Security scan (SEC-01 through SEC-06)
        run: npm run security:scan
      
      - name: Generate compliance report
        run: /vibe.audit --mode report --output .pr-compliance.json
      
      - name: Comment compliance status on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('.pr-compliance.json'));
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `📋 Rule Compliance Report\n${report.summary}`
            });
```

---

## 🔍 Verification Workflow

After generating code, run this verification:

```typescript
// Verification pseudo-code for AI agents

interface VerificationReport {
  timestamp: string;
  rulesFailed: Rule[];
  rulesWarned: Rule[];
  codeOutput: string;
  compliance: {
    p0_blocking: "PASS" | "FAIL";
    p1_high: "PASS" | "WARN";
    p2_medium: "PASS" | "WARN";
    overall: "PASS" | "FAILWARN";
  };
}

async function verifyCode(generatedCode: string): Promise<VerificationReport> {
  const rules = loadRulesInOrder(RULES_INDEX);
  const failures: Rule[] = [];
  const warnings: Rule[] = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, generatedCode);
    if (result.violated) {
      if (rule.priority === "P0_BLOCKING") {
        failures.push(rule);
      } else if (rule.priority === "P1_HIGH") {
        warnings.push(rule);
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    rulesFailed: failures,
    rulesWarned: warnings,
    codeOutput: generatedCode,
    compliance: {
      p0_blocking: failures.length === 0 ? "PASS" : "FAIL",
      p1_high: warnings.length === 0 ? "PASS" : "WARN",
      p2_medium: "PASS", // Not blocking
      overall: failures.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "PASS",
    }
  };
}
```

---

## 🎓 Training for Agents

### **Phase 1: Orientation (5 min)**
- What are the rules?
- Why do they exist?
- What happens if violated?

### **Phase 2: Deep Dive (20 min)**
- Read P0 rules in detail
- Understand the philosophy
- See examples of violations + fixes

### **Phase 3: Hands-On (30 min)**
- Review existing code against rules
- Identify violations in sample code
- Propose fixes following rule patterns

### **Phase 4: Autonomous (ongoing)**
- Generate code with active rule checking
- Verify before output
- Report compliance status

---

## 📞 Support & Questions

- **Q: What if a rule conflicts with the task spec?**
  - A: Escalate to technical leadership for decision

- **Q: Can I ignore a rule?**
  - A: P0 rules: NO (blocking). P1 rules: Flag for review. P2/P3: Non-blocking but tracked.

- **Q: How do I request a new rule?**
  - A: See CONTRIBUTING.md in the rules directory

- **Q: How often are rules updated?**
  - A: Rules are stable. Updates are infrequent and well-communicated.

---

## ✅ Integration Checklist

- [ ] RULES_INDEX.json loaded in agent context
- [ ] Rule files added to agent knowledge base
- [ ] Compliance checklist integrated into prompt
- [ ] Verification workflow implemented
- [ ] Build pipeline integrated
- [ ] Security self-audit automated
- [ ] Test coverage enforced (80% target)
- [ ] Team trained on compliance workflow

---

**Last Updated:** March 30, 2026  
**For:** Vibe Driven Dev Framework
