# Changelog

## v1.3.0-beta.1 (2026-03-30)

### Release Engineering

**Packaging fixes for npm publication:**

- Fixed CLI version reporting — `vdd --version` now reads from `package.json` instead of hardcoded `0.1.0`
- Added missing documentation to npm package `files` allowlist:
  - `AGENTS.md` — agent operating guide for coding agent runtimes
  - `CHANGELOG.md` — release history
  - `CONTRIBUTING.md` — contributor guide
  - `INSTALL.md` — installation instructions
  - `USAGE.md` — usage guide
  - `CODE_OF_CONDUCT.md` — community standards
  - `SECURITY.md` — security policy
- Bumped version to `1.3.0-beta.1` for beta npm dist-tag

**What this release includes:**
- All features from v1.2.4 (audit engine, autopilot, router, install system)
- Clean npm package boundaries (377 files, ~551 kB packed)
- Verified: build, tests (190/190 pass), CLI health check, pack dry-run, publish dry-run

**Intentionally excluded from npm (local/repo-only):**
- `Bin/` — internal toolbox and archived material
- `docs/` — architecture and design documentation (available on GitHub)
- `tests/` — test suite (available on GitHub)
- `dist/` excluded from git but included in npm (built from source)

---

## v1.2.4 (2026-03-30)

### New Features

**Code Audit & Remediation Engine (`/vibe.audit`)**

- Added full audit pipeline with 8 detection modules:
  - Circular import detection (DFS dependency graph)
  - Component size violations (>250 lines)
  - Missing test coverage mapping
  - Hardcoded secrets scanning
  - Accessibility checks (alt text, ARIA labels)
  - Error handling analysis (ErrorBoundary, async try/catch)
  - TypeScript type safety (`any` usage)
  - Dependency health (deprecated, duplicate packages)
- Added focused audit modes: `--focus architecture|testing|security|performance|events|accessibility`
- Added output modes: `--mode full|report|fix-plan|sprints`
- Added `--verbose` flag for detailed progress output
- Added 4 output artifacts to `audit-artifacts/<timestamp>/`:
  - `Audit-Report.md` — executive summary, repo profile, risk assessment
  - `Audit-Issues.json` — machine-readable issues with evidence and remediation
  - `Refactor-Plan.md` — workstream-based remediation plan
  - `Sprint-Plan.md` — 3-sprint execution roadmap

**Audit Engine Architecture (`core/audit/`)**

- `types.ts` — shared type system for the audit pipeline
- `rule-loader.ts` — loads `rules/RULES_INDEX.json`, selects rules by project profile and focus
- `repository-profiler.ts` — detects project type, languages, frameworks, features (auth, AI, events, tracking, CI, design system)
- `codebase-auditor.ts` — orchestrator + 8 real code scanners
- `issue-generator.ts` — converts findings to structured issues with severity, sprint, workstream, effort, and "why it matters"
- `sprint-planner.ts` — groups issues into workstreams with dependency-aware sprint assignment
- `report-writer.ts` — generates all 4 output artifacts (Markdown + JSON)

### CLI Changes

- `cli/src/commands/audit.ts` refactored from 512 lines to 130 lines (thin wrapper)
- Audit command now delegates all logic to `core/audit/` modules

### Tests

- Added `tests/audit/audit.test.ts` with 67 tests covering:
  - Rule loading (17 tests)
  - Repository profiling (10 tests)
  - Issue generation (10 tests)
  - Sprint planning (15 tests)
  - Report writing (15 tests)
- Total test count: 190 across 14 test files

### Bug Fixes

- Fixed corrupted `rules/core/master-rules.json` (stray `</search>` XML tags)

---

## v0.1.2

- Initial public release
- Pre-execution workflow engine
- Router-driven command system
- Claude Code, Cursor, Windsurf, Gemini CLI install targets
- Autopilot mode
- Agent trust tiers and pack management
