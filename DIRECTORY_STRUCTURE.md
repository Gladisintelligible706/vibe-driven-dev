# VDD Directory Structure

**Last Updated:** March 30, 2026  
**Status:** ✅ Organized & Consolidated

---

## Overview

The `vibe-driven-dev` directory is now properly organized with clear separation of concerns. All duplicates have been archived, and imports/paths are correct and connected.

---

## Directory Map

| Directory | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| **`rules/`** | Consolidated coding & architecture rules (P0-P3) | 🔴 Critical | ✅ Complete |
| **`skills/`** | AI agent skills (advisor, typescript-expert, etc.) | 🔴 Critical | ✅ Active |
| **`core/`** | Core system implementation & autopilot | 🔴 Critical | ✅ Active |
| **`agents/`** | Agent definitions & configurations | 🟡 High | ✅ Active |
| **`cli/`** | Command-line interface | 🟡 High | ✅ Active |
| **`tests/`** | Test suites | 🟡 High | ✅ Active |
| **`templates/`** | Project templates & scaffolds | 🟡 High | ✅ Active |
| **`docs/`** | Documentation & guides | 🟡 High | ✅ Reference |
| **`Bin/`** | Archive of old/duplicate files | 🔵 Low | 📦 Keep for history |

---

## 🎯 The `rules/` Directory (Most Important)

Central hub for all coding standards, architecture constraints, and quality metrics.

```
rules/
├── RULES_INDEX.json                    # Central registry for AI agents
├── README.md                           # Complete guide & quick start
├── core/                               # P0 blocking rules (non-negotiable)
│   ├── master-rules.json               # Unified rule definitions
│   ├── incremental-intelligence-architecture.rules.json
│   ├── regression-prevention.rules.json
│   └── type-system.rules.json
├── architecture/                       # Dependency & structure rules
│   ├── dependency-architecture.rules.json
│   ├── circular-dependency.rules.json
│   ├── component-modularity.rules.json
│   ├── api-consistency.rules.json
│   ├── path-resolution.rules.json
│   └── dropdown-portal-pattern.rules.json
├── quality/                            # Testing, security, a11y, performance
│   ├── accessibility.rules.json
│   ├── environment-consistency.rules.json
│   ├── error-handling.rules.json
│   ├── performance.rules.json
│   ├── security-privacy.rules.json
│   ├── testing.rules.json
│   ├── tracking-standards.rules.json
│   ├── assets-handling.rules.json
│   ├── libraries-usage.rules.json
│   └── memory-and-lifecycle.rules.json
├── ai-agents/                          # AI system architecture docs
│   ├── ai-core-architecture.md
│   ├── ape-architecture.md
│   ├── pivl-architecture.md
│   └── persona-guidelines.md
└── docs/                               # Integration & setup guides
    ├── RULES_CATALOG.md                # Human-readable rule reference
    ├── SETUP_FOR_AI_AGENTS.md          # AI integration guide
    ├── MIGRATION_GUIDE.md              # Old → New structure migration
    └── RULES_REFERENCE_QUICK.md        # Quick lookup
```

### Key Features:
- **RULES_INDEX.json**: Machine-readable registry with mandatory AI-agent instructions
- **Priority Tiers**: P0 (blocking) → P1 (high) → P2 (medium) → P3 (low)
- **Organized by Concern**: Not alphabetical - grouped by category
- **AI-Agent Ready**: Load order defined, compliance checkpoints included

**🔗 Start Here:** `rules/README.md`  
**🤖 For AI Integration:** `rules/docs/SETUP_FOR_AI_AGENTS.md`  

---

## 📚 Other Core Directories

### `skills/`
AI agent skill modules for specialized tasks.
```
skills/
├── advisor/                # Strategic analysis
├── delivery/              # Project delivery
├── governance/            # Policy & compliance
├── journey/               # User journey mapping
├── safety/                # Safety & security
├── security-review/       # Security auditing
└── typescript-expert/     # TypeScript specialization
```

### `core/`
Heart of the system implementation.
```
core/
├── artifacts/             # Generated artifacts
├── audit/                 # Audit system
├── autopilot/             # Autopilot engine
├── capabilities/          # System capabilities
├── constitution/          # Core principles
├── decisions/             # Decision models
├── gates/                 # Quality gates
├── install/               # Installation logic
├── intelligence/          # Intelligence engine
└── router/                # Request routing
```

### `agents/`
Agent definitions and configurations for different modes.

### `cli/`
Command-line interface entry points and commands.

### `templates/`
Scaffolding templates for rapid project setup.

### `tests/`
Comprehensive test suite (unit, integration, e2e).

### `docs/`
Documentation organized by topic (architecture, authoring, governance, usage, etc.).

---

## 🗑️ The `Bin/` Directory

Archive of old, duplicate, or deprecated files. Safe to delete after verification.

### Contents:
- **Old duplicated .json files** from root level
- **`.enhanced.json` versions** replaced by newer consolidated versions
- **Pack subdirectories** (ai-agents-pack, frontend-pack, security-pack, etc.)
- **Archive/** - historical files
- **dist/** - old build outputs
- **packs/** - legacy packs structure (superseded by `/rules/`)
- **coding-standards/** - old documentation (kept for reference)

**Note:** `Bin/` is added to `.gitignore` so old files don't get committed.

---

## ✅ Path Correctness Verification

### All Imports Are Correct
- ✅ No circular dependencies
- ✅ No broken path references
- ✅ Import paths properly scoped
- ✅ JSON imports resolve correctly
- ✅ Type definitions accessible

### Connected Structure
- ✅ Files reference each other with correct relative paths
- ✅ Configuration files point to valid locations
- ✅ Rule files load without errors
- ✅ No orphaned directories
- ✅ Package.json includes appropriate directories

---

## 📋 Updated Configuration Files

### `package.json`
```json
"files": [
  "agents",
  "core",
  "dist",
  "rules",      ← NEW: rules now part of distribution
  "skills",
  "templates",
  "README.md",
  "LICENSE"
]
```

### `tsconfig.json`
```json
"exclude": [
  "dist",
  "node_modules",
  "tests",
  "Bin",        ← NEW: exclude archived files
  "docs",
  "skills",
  "agents",
  "templates"
]
```

### `.gitignore`
```
Bin/            ← NEW: ignore archived files
```

---

## 🚀 Using This Structure

### For Developers
1. Read `rules/README.md` for coding standards
2. Reference `rules/docs/RULES_REFERENCE_QUICK.md` when coding
3. Check `docs/` for architectural decisions
4. Review `skills/` for available agent skills

### For AI Agents
1. Load `rules/RULES_INDEX.json` first
2. Follow `_AI_AGENT_CRITICAL_INSTRUCTIONS` section
3. If updating rules, read `rules/docs/SETUP_FOR_AI_AGENTS.md`
4. Verify compliance against P0/P1 rules before generating code

### For CI/CD Pipelines
1. Reference `rules/` for linting/validation rules
2. Use `rules/RULES_INDEX.json` for rule load order
3. Include `Bin/` in cleanup scripts (optional archive verification)

---

## 📈 Migration Status

| Phase | Status | Notes |
|-------|--------|-------|
| Structure Organization | ✅ Complete | All directories properly scoped |
| Duplicate Removal | ✅ Complete | Old/weak versions moved to Bin/ |
| Path Updates | ✅ Complete | package.json, tsconfig, .gitignore fixed |
| Import Verification | ✅ Complete | All paths correct and connected |
| Documentation | ✅ Complete | DIRECTORY_STRUCTURE.md created |

---

## 🔍 Quick Reference

### Find the Rules You Need
- **Code quality issues?** → `rules/quality/`
- **Dependency problems?** → `rules/architecture/`
- **Type safety?** → `rules/core/type-system.rules.json`
- **Security concerns?** → `rules/quality/security-privacy.rules.json`
- **Testing standards?** → `rules/quality/testing.rules.json`

### Get Help
- **Quick lookup** → `rules/docs/RULES_REFERENCE_QUICK.md`
- **Setup AI agents** → `rules/docs/SETUP_FOR_AI_AGENTS.md`
- **Full catalog** → `rules/docs/RULES_CATALOG.md`
- **Migrating from old structure** → `rules/docs/MIGRATION_GUIDE.md`

---

## 🐛 Troubleshooting

### If you find broken paths:
1. Check if file exists in `rules/` first
2. If not found, search `Bin/` for archived version
3. Update imports to: `import from '../rules/[category]/[file].json'`

### If you find duplicate files:
1. Compare file sizes and line counts
2. Keep the LARGER file (more complete)
3. Move SMALLER file to `Bin/`
4. Update configuration to reference the larger version

### If tests fail:
1. Verify all imports use correct paths
2. Check `tsconfig.json` exclude list
3. Ensure no circular dependencies exist
4. Run: `npm run check` to validate TypeScript

---

## 📞 Summary

- ✅ **All .json duplicates consolidated** into `/rules/`
- ✅ **Old versions archived** in `/Bin/`
- ✅ **Configuration files updated** (package.json, tsconfig.json, .gitignore)
- ✅ **Path imports verified** - all working correctly
- ✅ **Directory structure documented** - this file

**Status: READY FOR USE** 🎉

---

*For questions or updates to this structure, see `rules/README.md` and `rules/docs/RULES_CATALOG.md`*
