# 🔄 Migration Guide: Old Rules → New Organized Structure

This guide helps you migrate from the old scattered-rules structure to the new organized `vibe-driven-dev/rules/` hierarchy.

---

## 🗺️ Migration Map

### **Old Structure**
```
vibe-driven-dev/
  ├── accessibility.rules.json
  ├── api-consistency.rules.json
  ├── assets-handling.rules.json
  ├── circular-dependency.rules.json
  ├── ... (30+ files scattered in root)
  └── (no clear organization)
```

### **New Structure**
```
vibe-driven-dev/rules/
  ├── README.md (central guide)
  ├── RULES_INDEX.json (AI AGENT MANDATORY)
  ├── core/
  │   ├── master-rules.json
  │   ├── incremental-intelligence-architecture.rules.json
  │   ├── regression-prevention.rules.json
  │   └── type-system.rules.json
  ├── architecture/
  │   ├── dependency-architecture.rules.json
  │   ├── circular-dependency.rules.json
  │   ├── component-modularity.rules.json
  │   └── dropdown-portal-pattern.rules.json
  ├── quality/
  │   ├── testing.rules.json
  │   ├── accessibility.rules.json
  │   ├── performance.rules.json
  │   ├── security-privacy.rules.json
  │   ├── error-handling.rules.json
  │   └── tracking-standards.rules.json
  ├── ai-agents/
  │   ├── ai-core-architecture.md
  │   ├── ape-architecture.md
  │   ├── pivl-architecture.md
  │   └── persona-guidelines.md
  └── docs/
      ├── RULES_CATALOG.md (human-friendly catalog)
      ├── SETUP_FOR_AI_AGENTS.md (integration guide)
      └── MIGRATION_GUIDE.md (this file)
```

---

## 📋 File-to-Category Mapping

| Old Location | New Location | Category | Priority |
|-------------|-------------|----------|----------|
| `master-rules.json` | `rules/core/` | Core | P0 |
| `incremental-intelligence-architecture.rules.json` | `rules/core/` | Core | P0 |
| `regression-prevention.rules.json` | `rules/core/` | Core | P0 |
| `type-system.rules.json` | `rules/core/` | Core | P1 |
| `dependency-architecture.rules.json` | `rules/architecture/` | Architecture | P0 |
| `circular-dependency.rules.json` | `rules/architecture/` | Architecture | P0 |
| `component-modularity.rules.json` | `rules/architecture/` | Architecture | P1 |
| `api-consistency.rules.json` | `rules/architecture/` | Architecture | P1 |
| `path-resolution.rules.json` | `rules/architecture/` | Architecture | P2 |
| `dropdown-portal-pattern.rules.json` | `rules/architecture/` | Architecture | P1 |
| `testing.rules.json` | `rules/quality/` | Quality | P1 |
| `accessibility.rules.json` | `rules/quality/` | Quality | P1 |
| `performance.rules.json` | `rules/quality/` | Quality | P2 |
| `security-privacy.rules.json` | `rules/quality/` | Quality | P0 |
| `error-handling.rules.json` | `rules/quality/` | Quality | P1 |
| `tracking-standards.rules.json` | `rules/quality/` | Quality | P2 |
| `environment-consistency.rules.json` | `rules/quality/` | Quality | P2 |
| `libraries-usage.rules.json` | `rules/quality/` | Quality | P2 |
| `ai-core-architecture.md` | `rules/ai-agents/` | AI Agents | Reference |
| `ape-architecture.md` | `rules/ai-agents/` | AI Agents | Reference |
| `pivl-architecture.md` | `rules/ai-agents/` | AI Agents | Reference |
| `persona-guidelines.md` | `rules/ai-agents/` | AI Agents | Reference |

---

## 🔧 Migration Steps

### **Phase 1: Immediate (Zero Breaking Changes)**

1. **Keep old files in place** — The old scattered `.rules.json` files remain at `vibe-driven-dev/` root for backward compatibility.
2. **Copy to new structure** — All rules also exist in the new organized `vibe-driven-dev/rules/` hierarchy.
3. **Both locations active** — For 2-4 weeks, both old and new paths work.

### **Phase 2: Transition (Update References)**

Update all references across the codebase:

#### **In `.agent.md` or agent instructions:**

```diff
- "rules": "vibe-driven-dev/master-rules.json"
+ "rules": "vibe-driven-dev/rules/RULES_INDEX.json"
```

#### **In `.eslintrc.js` or tool configs:**

```diff
- const masterRules = require('./master-rules.json');
+ const masterRules = require('./rules/core/master-rules.json');
```

#### **In GitHub Actions workflows:**

```diff
- cat master-rules.json | grep verification
+ cat rules/RULES_INDEX.json | grep ruleLoadOrder
```

#### **In documentation links:**

```diff
- See `CONTRIBUTING.md` for rules
+ See `vibe-driven-dev/rules/docs/RULES_CATALOG.md` for catalog
+ See `vibe-driven-dev/rules/README.md` for overview
```

### **Phase 3: Cleanup (2-4 weeks later)**

After all tools and agents have been migrated:

```bash
# Archive old scattered files
mkdir vibe-driven-dev/.rules-legacy-backup/
mv vibe-driven-dev/*.rules.json vibe-driven-dev/.rules-legacy-backup/
mv vibe-driven-dev/*-architecture.md vibe-driven-dev/.rules-legacy-backup/

# Keep note file for historical reference
cat > vibe-driven-dev/.rules-legacy-backup/README.md <<EOF
This folder contains rules files from the old scattered structure.
These are kept for historical reference only.
All new references should point to vibe-driven-dev/rules/
EOF

git add .
git commit -m "Deprecate old scattered rules structure (moved to rules/)"
```

---

## 🤖 AI Agent Migration

### **Before Migration**

```javascript
// Old approach — scattered files
const rulesPath = 'vibe-driven-dev/master-rules.json';
const depRules = 'vibe-driven-dev/dependency-architecture.rules.json';
const secRules = 'vibe-driven-dev/security-privacy.rules.json';
// ... manually load each file
```

### **After Migration**

```javascript
// New approach — single index that references all
const rulesIndex = 'vibe-driven-dev/rules/RULES_INDEX.json';
const ruleCollection = loadFromIndex(rulesIndex);
// All rules loaded in correct order automatically
```

### **System Prompt Update**

```diff
- Load these rule files:
-   1. vibe-driven-dev/master-rules.json
-   2. vibe-driven-dev/dependency-architecture.rules.json
-   3. ... (manual listing)

+ Load the rules system:
+   vibe-driven-dev/rules/RULES_INDEX.json
+
+   This index automatically provides all rules in the correct order.
+   See: ruleLoadOrder array in the index.
```

---

## 🔗 Update Configuration Files

### **`.agents/CODE_QUALITY.md`**

```diff
- ## Rules to Load
- 
- - master-rules.json
- - dependency-architecture.rules.json
- - (manual list of 20+ files)

+ ## Rules to Load
+
+ → AUTOIMPORT: vibe-driven-dev/rules/RULES_INDEX.json
+ 
+ All rules are referenced in the index. Load in ruleLoadOrder sequence.
```

### **`vite.config.ts` (if using rules in build)**

```diff
- import masterRules from './master-rules.json';

+ import rulesIndex from './rules/RULES_INDEX.json';
+ const masterRules = loadIndexedRules(rulesIndex);
```

### **`package.json` scripts**

```diff
- "audit": "node scripts/audit.js --rules=master-rules.json"

+ "audit": "/vibe.audit --rules=rules/RULES_INDEX.json"
```

---

## ✅ Verification Checklist

### **After Migration:**

- [ ] `vibe-driven-dev/rules/` directory exists with all subdirectories
- [ ] `RULES_INDEX.json` loads successfully (valid JSON)
- [ ] All 20+ rule files are in their new locations
- [ ] `RULES_CATALOG.md` is readable and accessible
- [ ] `SETUP_FOR_AI_AGENTS.md` is accessible
- [ ] Old files still exist at root (for backward compat)
- [ ] All agent configs updated to use new paths
- [ ] Audit system reads from `rules/RULES_INDEX.json`
- [ ] ESLint config uses new paths
- [ ] No broken imports in code

### **Final Checks:**

```bash
# Check directory structure
tree vibe-driven-dev/rules/ | head -20

# Validate JSON files
find vibe-driven-dev/rules -name "*.rules.json" -exec jq empty {} \; && echo "✓ All JSON valid"

# Check for duplicates
ls vibe-driven-dev/*.rules.json 2>/dev/null | wc -l
ls vibe-driven-dev/rules/**/*.rules.json 2>/dev/null | wc -l
# Should have same count (until cleanup phase)

# Verify index references all files
jq '.ruleLoadOrder[]' vibe-driven-dev/rules/RULES_INDEX.json | wc -l
```

---

## 🚨 Rollback Plan

If something breaks, rollback is simple:

```bash
# Restore old scattered files
git checkout HEAD~1 -- vibe-driven-dev/*.rules.json vibe-driven-dev/*-architecture.md

# Point agents back to old paths
git checkout HEAD~1 -- .agents/ vite.config.ts package.json

# Revert changes
git reset HEAD .
```

---

## 📞 Questions During Migration?

**Q: Old code still references `vibe-driven-dev/master-rules.json`. Do I need to update it?**
- A: Not immediately. Old paths work during Phase 1+2. Plan updates for Phase 3 cleanup.

**Q: Should I update imports in the middle of a feature?**
- A: No. Finish the feature using old paths, then migrate after merge.

**Q: Can I use both old and new paths simultaneously?**
- A: Yes, but inconsistent. Recommend standardizing on new paths project-wide.

**Q: What if the audit system breaks?**
- A: Rollback using the plan above. Then file an issue for investigation.

---

## 📅 Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| **Phase 1: Parallel** | Week 1-2 | Both old and new paths active. No changes needed. |
| **Phase 2: Transition** | Week 3-4 | Update agent configs, ESLint, build scripts to new paths. |
| **Phase 3: Cleanup** | Week 5+ | Archive old files, finalize migration. |

---

## 🎓 Documentation Updates

After migration, update these docs:

- [x] `vibe-driven-dev/rules/README.md` — Overview & navigation
- [x] `vibe-driven-dev/rules/RULES_INDEX.json` — Central index
- [x] `vibe-driven-dev/rules/docs/RULES_CATALOG.md` — Human-friendly catalog
- [x] `vibe-driven-dev/rules/docs/SETUP_FOR_AI_AGENTS.md` — Agent integration guide
- [ ] Update `.agents/CODE_QUALITY.md` to reference new paths
- [ ] Update CI/CD pipeline configs
- [ ] Update team onboarding documentation
- [ ] Update architecture decision records (ADRs)

---

## ✨ Success Criteria

Your migration is complete when:

1. ✅ All rule files are in `vibe-driven-dev/rules/` organized by category
2. ✅ `RULES_INDEX.json` is the single source of truth
3. ✅ All agents/tools reference the new paths
4. ✅ Audit system uses new structure
5. ✅ Old scattered files archived (or moved to `.rules-legacy-backup/`)
6. ✅ Team is trained on new structure
7. ✅ Zero broken references or import errors

---

**Migration Completed On:** [Date]  
**Migrated By:** [Name/Team]  
**Status:** ✅ LIVE
