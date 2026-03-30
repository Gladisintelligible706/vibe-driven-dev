# INSTALL.md — Vibe Driven Dev

> **VDD installs a pre-execution clarity layer for AI coding agents.**
> It is not an editor plugin. It is not a linter. It is an orchestration system that should run before broad implementation begins.

## What this install actually does

When you install VDD, it should create three layers:

| Layer | What gets created | Why it exists |
| --- | --- | --- |
| Runtime integration | Agent definition files or runtime-specific setup such as `.claude/agents/` or project-local command/config surfaces | So your coding agent can actually load and use VDD |
| Project workspace | `.vdd/` with project state, install metadata, and future runtime data | So VDD can track the project instead of relying on chat memory |
| Install manifest | `.vdd/install-manifest.json` | So the system knows what was installed, where, and for which target |

VDD should **not** silently rewrite your app code, `package.json`, or unrelated project config during installation.

## Source of truth before install

Any coding agent installing VDD should read these first if they exist locally:

1. `README.md`
2. `INSTALL.md`
3. `USAGE.md`
4. `AGENTS.md`
5. `docs/architecture/guided-user-workflow.md`
6. `docs/architecture/autopilot-mode.md`
7. `docs/architecture/intent-capture-popups.md`
8. `docs/architecture/prd-skill-stack.md`
9. `docs/architecture/post-prd-artifact-expansion.md`
10. `docs/architecture/code-audit-and-remediation.md`

Official repository:
- `https://github.com/OpenOps-Studio/vibe-driven-dev`

## Preflight

Before installing, make sure:

- Node.js 20 or newer is available
- the current working directory is the project you want VDD to manage
- your coding agent runtime is known, or you are willing to use generic compatibility mode

## Installation modes

### Try once with `npx`

```bash
npx vibe-driven-dev install claude-code --project
```

Use this when:
- you want to test VDD quickly
- you do not want a global install yet

### Install globally

```bash
npm install -g vibe-driven-dev
vdd install claude-code --project
```

Use this when:
- you plan to use VDD often
- you want a shorter command surface

## Runtime targets

| Target | Best use case | Preferred install |
| --- | --- | --- |
| `claude-code` | Claude Code project workflows | Project-level |
| `generic-agents-md` | Cursor, Windsurf, OpenCode, Codex-style, or any AGENTS-aware runtime | Project-level |
| future runtime adapters | Runtime-specific installs as VDD grows | Project-level unless there is a strong reason otherwise |

## Recommended installs

### Claude Code project-level install

```bash
npx vibe-driven-dev install claude-code --project
```

This is the default recommendation for most users.

Why:
- Claude Code supports project-level subagents in `.claude/agents/`
- project-level agents take precedence over user-level ones
- the setup stays local to the repo and easier to reason about. citeturn237601search0turn237601search3

### Claude Code user-level install

```bash
npx vibe-driven-dev install claude-code --global
```

Use this when:
- you want the same VDD agent layer across many projects
- you understand that project-level setups should usually win when they exist. citeturn237601search0turn237601search3

### Generic AGENTS.md compatibility mode

```bash
npx vibe-driven-dev install generic-agents-md --project
```

Use this when:
- your runtime understands `AGENTS.md`
- you want a portable project-local compatibility layer
- you are not using Claude Code native subagents

## Quick start

Do not copy comments into your shell.
Run only the commands.

```bash
npx vibe-driven-dev install claude-code --project
npx vibe-driven-dev doctor
npx vibe-driven-dev targets
npx vibe-driven-dev run /vibe.start --idea "Describe the project in plain language"
```

If you want VDD to keep moving automatically after onboarding:

```bash
npx vibe-driven-dev run /vibe.start --autopilot --idea "Describe the project in plain language"
```

## What should happen after install

A good install does **not** end at setup.

A good coding agent should:

1. tell you what runtime it detected
2. tell you what it installed and where
3. start guided onboarding in plain language
4. ask a small number of useful questions
5. build each next question from the previous answer
6. translate your answers into the VDD workflow
7. continue automatically unless a real checkpoint needs approval

## Runtime-specific prompts

Paste one of the prompts below directly into your coding agent.

Each prompt is designed to make the agent:
- understand what VDD is before installing it
- treat this repository as the source of truth
- install VDD in the cleanest project-local way for the current runtime
- start guided onboarding after install instead of dumping raw commands

## Universal prompt

```text
You are my coding agent and setup operator.

You are going to install and activate Vibe Driven Dev for this project, then guide me through the first project-definition workflow in plain language.

Important context:
Vibe Driven Dev is an agent-first pre-execution system for AI coding agents.
Its job is to turn vague product ideas into:
- structured planning
- project truth
- bootstrap and execution-readiness artifacts
- stack decisions
- AI provider and model decisions for the product itself
- handoff-ready workflows

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/intent-capture-popups.md
- docs/architecture/prd-skill-stack.md
- docs/architecture/post-prd-artifact-expansion.md
- docs/architecture/code-audit-and-remediation.md

Your responsibilities:
1. Inspect the repository and understand VDD first.
2. Detect which coding-agent runtime you are currently running inside.
3. Install VDD using the cleanest native project-level method supported by this runtime.
4. Keep the setup minimal and tidy.
5. Do not overwrite important files without warning me first.
6. After installation, do not stop at raw commands.
7. Immediately move me into a guided onboarding loop in simple non-technical language.

Guided onboarding rules:
- Assume I am a non-technical user.
- Ask only the minimum useful questions.
- Start with one broad open question about the idea.
- Build each next question from my previous answer.
- Keep the question budget small.
- Do not overwhelm me with technical wording.

Workflow rules:
- Translate my answers into the VDD workflow.
- Start with `/vibe.start` when available, otherwise run the equivalent onboarding-first flow.
- Then continue into the right early steps such as `/vibe.init`, `/vibe.plan`, and `/vibe.scaffold` only when the idea is grounded enough.
- Always explain what stage or mission we are in.
- Always tell me the next best step.
- Continue automatically unless a high-impact decision needs my approval.

Decision rules:
- If stack selection is needed, explain the top recommendation simply.
- If AI provider or model selection is needed for the product itself, explain the best fit simply.
- If this project would benefit from extra coding-agent skills, recommend or install them in a focused way.

PRD quality rule:
- Once you have enough information to create a serious PRD, say so clearly.
- At that point, recommend a stronger model temporarily if that would clearly improve PRD quality.
- For Anthropic users, prefer the latest active flagship available to them, such as Claude Opus 4.6 where available.
- For OpenAI or Codex users, prefer GPT-5.4 or Codex on GPT-5.4 with stronger reasoning when the extra depth is worth it.
- Do not force the switch, but explain why it would improve the result.

At the end of each major step, tell me:
1. what you just did
2. what you learned
3. what stage or mission we are in
4. what the next best step is
5. whether you need my approval or can continue automatically
```

## Claude Code prompt

```text
You are running inside Claude Code.

Install and activate Vibe Driven Dev for this project using Claude Code native project-level integration.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/intent-capture-popups.md
- docs/architecture/prd-skill-stack.md
- docs/architecture/post-prd-artifact-expansion.md
- docs/architecture/code-audit-and-remediation.md

Use Claude-native conventions:
- project subagents in .claude/agents/
- project scope first unless there is a real reason otherwise

Your job:
- inspect the VDD repository first
- understand what VDD is and how it works
- install it cleanly into this project using Claude-native project-level conventions
- keep the installation minimal
- do not overwrite important files without warning me first
- after installation, do not stop at setup
- immediately start a guided onboarding conversation in simple language
- ask one broad open question first
- build each next question from the previous answer
- keep the question budget small
- translate the answers into the VDD workflow
- start with `/vibe.start` when available

At every stage:
- tell me what stage or mission we are in
- tell me the next best step
- continue automatically unless a high-impact decision needs my approval

When enough information exists for a serious PRD:
- say so clearly
- recommend a stronger model temporarily if it would clearly improve depth and structure
- explain the benefit simply
```

## Cursor / Windsurf / OpenCode / AGENTS.md prompt

```text
You are my coding agent.

Please install and activate Vibe Driven Dev in this repository using the most native project-level integration available for this runtime.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/intent-capture-popups.md
- docs/architecture/prd-skill-stack.md
- docs/architecture/post-prd-artifact-expansion.md
- docs/architecture/code-audit-and-remediation.md

Preferred behavior:
- use AGENTS.md if this runtime supports it
- use project-local rules or config when supported
- keep everything inside the project
- avoid unnecessary files
- do not overwrite important files without checking first

Your tasks:
1. Detect the best native project-level integration surface for this runtime.
2. Install or scaffold VDD accordingly.
3. Keep the setup clean and understandable.
4. Start the guided workflow with `/vibe.start` after installation.
5. Ask simple onboarding questions in plain language.
6. Build each next question from the previous answer.
7. Continue into the first valid workflow steps only after the idea is grounded.
8. Recommend a stronger model temporarily only when PRD-heavy work would clearly benefit from it.
```

## Gemini CLI prompt

```text
You are running inside Gemini CLI.

Please set up Vibe Driven Dev for this project using the most native Gemini CLI approach available.

Official repository:
https://github.com/OpenOps-Studio/vibe-driven-dev

Treat the official VDD repository as the source of truth before installation and workflow execution.

Read these files first if they exist locally:
- README.md
- INSTALL.md
- USAGE.md
- AGENTS.md
- docs/architecture/guided-user-workflow.md
- docs/architecture/autopilot-mode.md
- docs/architecture/intent-capture-popups.md
- docs/architecture/prd-skill-stack.md
- docs/architecture/post-prd-artifact-expansion.md
- docs/architecture/code-audit-and-remediation.md

Preferred Gemini-style behavior:
- use project-local commands if useful
- use project-local extensions if useful
- use MCP configuration only when it improves the setup clearly
- keep the setup minimal and understandable
- prefer project-level setup over user-level setup

Your tasks:
- inspect the repository
- determine the best Gemini CLI integration path
- install or scaffold VDD cleanly
- start the guided workflow with `/vibe.start`
- ask one broad open onboarding question first
- build each next question from the previous answer
- keep the question budget small
- continue into the first valid workflow steps only after the idea is grounded
- recommend a stronger model temporarily only when premium PRD work would clearly benefit from it
```

## What the agent should do after install

A good setup run should:
- detect the runtime
- understand VDD from the repository first
- prefer project-level installation
- keep the setup tidy
- avoid unnecessary files
- start guided onboarding
- translate plain-language answers into the first workflow steps
- keep explaining the current stage or mission
- keep proposing or executing the next best step
- explain clearly what was installed and where

If the runtime does not support native agents or skills well, the agent should fall back to a clean generic project-local setup instead of forcing a bad integration.

## Installation details for Claude Code

Claude Code stores custom subagents as Markdown files with YAML frontmatter in two locations:

| Scope | Path | Priority |
| --- | --- | --- |
| Project | `.claude/agents/` | Highest |
| User | `~/.claude/agents/` | Lower |

Project-level subagents take precedence over user-level subagents when names conflict. citeturn237601search0turn237601search3

### Claude Code project-level install

```bash
npx vibe-driven-dev install claude-code --project
```

Expected structure:

```txt
.claude/
  agents/
    vdd-orchestrator.md
    vdd-planner.md
    vdd-architect.md
    vdd-detailer.md
    vdd-researcher.md
    vdd-qa-guardian.md
    vdd-handoff-manager.md
.vdd/
  project-state.json
  install-manifest.json
  addons/
    installed/
      local/
```

### Claude Code user-level install

```bash
npx vibe-driven-dev install claude-code --global
```

## Generic AGENTS.md compatibility mode

```bash
npx vibe-driven-dev install generic-agents-md --project
```

This mode should write:
- `AGENTS.md`
- canonical agent files in `.vdd/agents/`

## Verify the installation

```bash
vdd doctor
```

A healthy result should confirm:
- `.vdd/project-state.json`
- `.vdd/install-manifest.json`
- runtime-specific integration files
- executable sources discovered cleanly

Use this too:

```bash
vdd scan
```

Use `scan` when you want to inspect discovered agents, skills, and runtime sources.

## First workflow after install

Recommended first command:

```bash
vdd run /vibe.start
```

Then let VDD route the workflow.

If you are operating more manually, the early flow usually becomes:

```bash
vdd run /vibe.init
vdd run /vibe.plan
vdd run /vibe.scaffold
```

See [USAGE.md](./USAGE.md) for the broader journey.

## Packs and add-ons

Add an external skill pack:

```bash
vdd add ../my-coding-standards
vdd packs
```

Discover and promote learning sources:

```bash
vdd scan
vdd validate <source-id>
vdd promote <source-id>
```

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `404` from `npx vibe-driven-dev` | Confirm the package is published under the exact name you are using and that npm can see it. |
| `zsh: command not found: #` | You copied comments into the shell. Run only the commands. |
| `No agent folder found` | Re-run install for the correct runtime and scope. |
| `No project state found` | Run the install again or initialize the project state cleanly. |
| `Validation failed` | Run `vdd validate <id>` and inspect the findings. |
| `Version mismatch` | Check `.vdd/install-manifest.json` and reinstall if needed. |
| `Command not recognized` | Ensure the `vdd` binary is in PATH or use `npx vibe-driven-dev`. |
| Agents not appearing in Claude Code | Make sure you used the expected scope and restart Claude Code if needed. |

## Why this install style matters

The install flow is designed this way because:
- Claude Code has explicit project and user subagent locations with project priority. citeturn237601search0turn237601search3
- Gemini CLI has project-level custom commands in `.gemini/commands/` and project-level extensions, which makes project-local integration the right default there too. citeturn237601search1turn237601search2
- VDD works best when the install stays close to the project, the docs remain discoverable, and the workflow can start immediately after setup. citeturn237601search0turn237601search1turn237601search2