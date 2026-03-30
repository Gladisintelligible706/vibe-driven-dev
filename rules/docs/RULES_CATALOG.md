# 📋 Rules Catalog - Comprehensive Reference

This catalog provides a human-readable overview of all coding rules organized by category and priority.

---

## 🔴 P0 BLOCKING Rules (Must Never Violate)

### **Core Architecture**

| Rule ID | Name | Description | Cost of Violation |
|---------|------|-------------|------------------|
| **INCREMENTAL-01** | Atomic Changes Only | No large sweeping rewrites, only surgical changes | Major refactoring |
| **REGRESSION-01** | Feature Preservation | No deleting tested features, backward compatibility | Feature rollback |
| **MASTER-01** | Unidirectional Dependencies | Pages→Components→Hooks→Types flow | Architecture refactor |
| **MASTER-02** | Component Size Limits | Max 250 lines, max 3 useEffect | Component splits |

### **Security**

| Rule ID | Name | Description | Cost of Violation |
|---------|------|-------------|------------------|
| **SEC-01** | Private by Default | All data/APIs assume private unless explicit | Security audit |
| **SEC-02** | storageManager Only | All localStorage goes through storageManager | Data access refactor |
| **SEC-03** | No Hardcoded Secrets | Zero tolerance for credentials in code | Immediate code revocation |
| **SEC-04** | API Whitelist | All external calls in allow-list | Integration blocking |

### **Dependencies**

| Rule ID | Name | Description | Cost of Violation |
|---------|------|-------------|------------------|
| **ARCH-DEP-01** | Unidirectional Flow | No circular imports or cross-layer violations | Bundling failure |
| **CIRC-01** | No Circular Dependencies | No file imports anything that imports it | Complete refactor |

---

## 🟠 P1 HIGH Rules (Fix Immediately in Same Session)

### **Testing & Quality**

| Rule ID | Name | Requirements | Threshold |
|---------|------|--------------|-----------|
| **TEST-01** | Unit Test Mandate | All business logic covered by unit tests | N/A |
| **TEST-02** | Component Testing | All key UI components have integration tests | N/A |
| **TEST-03** | E2E Testing | Critical user flows tested end-to-end | N/A |
| **TEST-04** | Coverage Threshold | Minimum code coverage requirement | 80% line coverage |

### **Accessibility (WCAG 2.1)**

| Rule ID | Name | Requirements | Verification |
|---------|------|--------------|--------------|
| **A11Y-01** | Semantic HTML | Use correct HTML elements for purpose | axe DevTools |
| **A11Y-02** | Keyboard Navigation | All interactive elements keyboard operable | Tab key |
| **A11Y-03** | Image Alt Text | All images have descriptive alt attributes | Alternative text check |
| **A11Y-04** | ARIA Labels | Dynamic components have ARIA attributes | Screen reader test |

### **Component Standards**

| Rule ID | Name | Constraint | Action |
|---------|------|-----------|--------|
| **MOD-SRP-01** | Single Responsibility | One thing per component | Decompose if violated |
| **MOD-SIZE-02** | Component Size | Soft 150 lines, hard 250 lines | Review or refactor |
| **MOD-HOOKS-04** | Logic Extraction | Complex logic → custom hooks | Extract if violated |

---

## 🟡 P2 MEDIUM Rules (Track & Fix in Future Sprint)

### **Performance**

| Rule ID | Name | Metric | Target |
|---------|------|--------|--------|
| **PERF-01** | Core Web Vitals | LCP, FID, CLS | Pass Lighthouse |
| **PERF-02** | Bundle Size | JavaScript size limit | < 200KB (gzipped) |
| **PERF-03** | Lazy Loading | Heavy components loaded on demand | Observable.lazy() |

### **Error Handling**

| Rule ID | Name | Requirement | Verification |
|---------|------|-------------|--------------|
| **ERR-01** | Error Boundary | Global error boundary in root | test renders fallback |
| **ERR-02** | API Error Handling | All async calls handle error state | hasError && renderError |
| **ERR-03** | Form Validation | Field-level validation feedback | User sees errors |

---

## 🔵 P3 LOW Rules (Advisory - Non-blocking)

| Category | Rule | Recommendation |
|----------|------|-----------------|
| **Naming** | Semantic naming conventions | Use clear, descriptive names |
| **Documentation** | Code comments for complex logic | Explain the why, not the what |
| **Formatting** | Consistent code style | Use Prettier + ESLint |

---

## 📊 Rule Distribution

```
Total Rules: 50+

By Priority:
  P0 BLOCKING: 18 rules (36%)
  P1 HIGH:     20 rules (40%)
  P2 MEDIUM:   10 rules (20%)
  P3 LOW:      5 rules (4%)

By Category:
  Architecture:     12 rules
  Security:         8 rules
  Testing:          7 rules
  Accessibility:    7 rules
  Performance:      6 rules
  Error Handling:   4 rules
  Other:            6 rules
```

---

## 🔗 How to Use This Catalog

### **For New Developers**
1. Read P0 and P1 rules for your area (backend, frontend, etc.)
2. Bookmark the specific rule file for quick reference during code review
3. Run `/vibe.audit` to see these rules in action on actual code

### **For AI Agents**
1. Load `RULES_INDEX.json` to understand rule priority and loading order
2. Internalize the P0 rules first (blocking violations)
3. After code generation, verify against each P1 rule
4. Use rule IDs in comments: `// RULE: ARCH-DEP-01 compliance checked`

### **For Audits**
1. Use `RULES_INDEX.json` as the system of record
2. Map audit findings to specific rule IDs
3. Generate remediation plans tied to specific rules

---

## 📈 Rule Maintenance

### **How Rules Are Updated**

1. **Proposal:** Identify a pain point in the codebase
2. **Documentation:** Create the rule with rationale, examples, and verification steps
3. **Implementation:** Add to appropriate `.rules.json` file
4. **Adoption:** Load the rule in `RULES_INDEX.json` ruleLoadOrder
5. **Rollout:** Communicate to team + update audit system
6. **Monitoring:** Track violations and effectiveness

### **Deprecation Policy**

- Rules that no longer apply are marked `deprecated: true`
- Deprecated rules remain in files for historical reference
- Deprecated rules are removed from `ruleLoadOrder` in `RULES_INDEX.json`

---

## 🎯 Next Steps

- **Review Specific Rules:** Open the `.rules.json` files for detailed specifications
- **Run Audit:** Execute `/vibe.audit` to see your codebase evaluated against these rules
- **Generate Plan:** Get a remediation roadmap with specific rule violations
- **Contribute:** Add new rules following the contribution process in README.md
