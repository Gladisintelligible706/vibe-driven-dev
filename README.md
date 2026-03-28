# Vibe Driven Dev

**Build fast. Think clearly. Hand off cleanly.**

![Status](https://img.shields.io/badge/status-active-2563eb?style=flat-square)
![Stage](https://img.shields.io/badge/stage-pre--execution-7c3aed?style=flat-square)
![License](https://img.shields.io/github/license/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D20-5fa04e?style=flat-square&logo=nodedotjs&logoColor=white)
![Runtime](https://img.shields.io/badge/runtime-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Stars](https://img.shields.io/github/stars/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Issues](https://img.shields.io/github/issues/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/OpenOps-Studio/vibe-driven-dev?style=flat-square)
![Codex](https://img.shields.io/badge/target-Codex-111827?style=flat-square)
![Claude Code](https://img.shields.io/badge/target-Claude%20Code-d97706?style=flat-square)
![Gemini CLI](https://img.shields.io/badge/target-Gemini%20CLI-1d4ed8?style=flat-square)

Vibe Driven Dev is an agent-first framework for safe vibe coding.

It helps founders, product builders, and AI coding agents move from a fuzzy idea to a structured, handoff-ready project without falling into the usual traps:

- weak scope
- fragile architecture
- hidden assumptions
- stale dependency choices
- poor AI provider decisions
- chaotic project setup
- handoff mess before execution

## What it does

Vibe Driven Dev gives you a guided pre-execution workflow before implementation takes over.

It helps you:

- initialize a project journey
- frame the real problem
- define scope and success
- surface assumptions and risks
- design a usable system blueprint
- generate bootstrap files
- choose a suitable stack
- choose the right AI provider and model for the product itself
- prepare a clean handoff into downstream execution flows such as Spec Kit

## Why this exists

Most vibe coding fails for one simple reason:

People start generating code before they have enough structure.

Vibe Driven Dev exists to slow down the right part and speed up the useful part.

It does not try to replace coding agents.
It helps them work with cleaner context, better decisions, and stronger project foundations.

## Who this is for

- founders building MVPs or PoCs
- product innovators working with AI coding agents
- non-technical builders who need a guided setup path
- developers who want a safer pre-execution workflow
- teams that want cleaner handoff into implementation systems

## Core idea

Vibe Driven Dev owns **pre-execution clarity**.

That means it focuses on:

- planning
- research
- blueprinting
- detail design
- bootstrap generation
- readiness review
- handoff packaging

Then it hands the project into downstream execution.

## The journey

The default workflow looks like this:

1. `/vibe.init`
2. `/vibe.plan`
3. `/vibe.research`
4. `/vibe.blueprint`
5. `/vibe.detail`
6. `/vibe.scaffold`
7. `/vibe.qa`
8. `/vibe.handoff-to-spec`

Supporting commands include:

- `/vibe.next`
- `/vibe.resume`
- `/vibe.status`
- `/vibe.assumptions`
- `/vibe.decide`

## Bootstrap files

Before execution, VDD can help generate a cleaner project foundation such as:

- `PRD.md`
- `Logic.md`
- `Structure.md`
- `Dependencies.md`
- `Memory.md`
- `anti-hallucination.md`
- `repo.md`
- `Design.md`
- `Stack-Decision.md`
- `AI-Provider-Decision.md`

## Multi-agent, multi-source, add-on aware

VDD is designed to work with modern coding-agent workflows.

It supports:

- skills
- specialist agents
- project-local runtime state
- packs
- archive learning sources
- curated imports from external standards repositories
- future MCP-backed freshness and provider intelligence

## Supported and planned agent targets

VDD is designed to integrate cleanly with coding-agent environments such as:

- Claude Code
- Codex
- Cursor
- Windsurf
- OpenCode
- Gemini CLI

The goal is not to force one runtime model everywhere.

The goal is to keep one canonical VDD system and export it in the cleanest native shape for each target.

## Quick start

```bash
npx vibe-driven-dev install claude-code --project
npx vibe-driven-dev doctor
npx vibe-driven-dev run /vibe.init
```

For full setup details, see [INSTALL.md](./INSTALL.md). For workflow usage, see [USAGE.md](./USAGE.md).

## Quickly use with your favorite coding agent

You can paste a setup prompt into your preferred coding agent and ask it to:

- detect the current runtime
- install or scaffold VDD in the cleanest project-local way
- initialize the workflow
- start the first useful commands automatically

See the install guides for runtime-specific setup flows.

## Repository structure

```txt
agents/
archive/
cli/
core/
docs/
examples/
packs/
skills/
templates/
tests/
```

## Current status

VDD is in active build-out.

The architecture is already defined around:

- router-driven workflows
- canonical stages
- specialist agents
- governance skills
- bootstrap generation
- add-on trust tiers
- handoff discipline

Current work focuses on:

- production hardening
- tests
- constitution rules
- artifact registry
- intelligence runtime implementation
- installation targets for coding agents

## Philosophy

VDD is built on a few simple rules:

- do not start coding from chaos
- do not hide assumptions
- do not trust imported sources automatically
- do not confuse polish with readiness
- do not hand off a project dishonestly
- keep archive for learning unless something is explicitly promoted

## Contributing

VDD accepts contributions in multiple lanes:

- core architecture
- packs
- runtime add-ons
- learning-source imports
- docs
- examples

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening major changes.

## Security

If you find a vulnerability, please use the reporting process in [SECURITY.md](./SECURITY.md).

## Roadmap

Near-term priorities:

- tests
- constitution completion
- artifact registry
- intelligence runtime
- bootstrap scaffolding
- pack extraction from imported standards
- install targets for major coding agents

## License

[MIT](./LICENSE)

## Created by

Mamdouh Aboammar
