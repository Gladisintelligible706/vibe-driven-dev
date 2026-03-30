---
name: onboarding-guide
description: Guide a non-technical user through the first project conversation using Intent Capture Popups, capture minimal intent, translate it into VDD state, and propose the next best step in plain language.
category: governance
stage: any
version: 0.2.0
triggers:
  - /vibe.start
  - onboarding
  - first-run
  - intent-capture
inputs:
  required:
    - user_goal
  optional:
    - existing_project_state
    - current_runtime
    - guided_mode
    - autopilot_mode
    - partial_answers
    - popup_flow_state
outputs:
  - onboarding-summary
  - normalized-project-intent
  - intent-summary
  - assumptions
  - next-step-recommendation
  - command-handoff-plan
handoff:
  next:
    - vibe-init
    - vibe-plan
    - vibe-scaffold
state_effect: write
authority:
  final: orchestrator
compatibility:
  core: "0.1.x"
  skill_schema: "1.x"
---

# Onboarding Guide

## Purpose

Guide a non-technical user into the VDD workflow using the **Intent Capture Popups** system — a one-question-at-a-time adaptive intake flow that collects project intent through popup-style or card-style chat interactions.

This skill turns a vague project idea into normalized workflow input through a calm, conversational experience.

## Intent Capture Popups

The primary interaction model for onboarding is now **Intent Capture Popups**.

Instead of presenting a form or a fixed list of questions, the system:

1. Starts with one broad, open-ended question
2. Parses the answer and extracts signals
3. Builds the next question adaptively based on what's still unclear
4. Repeats until confidence is high enough or the question budget is exhausted
5. Produces an IntentSummary that hands off directly into `/vibe.init`

### Architecture Components

The popup flow is powered by four core modules in `core/autopilot/`:

| Module | Responsibility |
|--------|---------------|
| `intent-capture-engine.ts` | Parses free-text answers and extracts structured signals (project type, user, AI role, etc.) |
| `question-builder.ts` | Builds the next adaptive question based on current signal state and missing dimensions |
| `intent-confidence.ts` | Scores confidence and determines whether to continue, ask one more, or stop |
| `popup-flow-controller.ts` | Orchestrates the full flow: start → answer → next → complete → handoff |

### Question Budget

- **Default maximum:** 5 questions
- **Hard ceiling:** 7 questions (only if ambiguity is dangerously high)
- The system should stop early when confidence is high enough

### Confidence Model

The popup flow measures confidence across these dimensions:

| Dimension | Weight | Threshold |
|-----------|--------|-----------|
| Core problem | 2.0 | 30+ characters |
| Project type | 1.5 | Must not be "unknown" |
| Target user | 1.5 | Must not be "unknown" |
| Product shape | 1.0 | Must not be "unknown" |
| AI clarity | 1.0 | If AI present, role must be clear |
| Delivery preference | 0.5 | Must not be "unknown" |
| Platform | 0.5 | Must not be "unknown" |

Confidence tiers:
- **High** (≥75%): Ready to proceed into VDD workflow
- **Medium** (50-74%): Proceed with visible assumptions
- **Blocking** (critical missing): Ask one more focused question
- **Low** (<50%): Need more information

### First Question

The first question must always be broad and open-ended:

> احكيلي بشكل عام عن فكرتك والمشروع اللي في بالك.
> شايفه بيساعد مين وبيحل إيه؟

This invites natural-language input and gives the system enough raw material to build adaptive follow-ups.

### Adaptive Questioning Rules

Every question after the first must:

- Be built from the previous answer
- Target the highest-value missing dimension
- Never repeat what the user already said
- Never ask about something already implied or inferred
- Use plain language, no jargon

### Stop Conditions

The popup flow stops when:

- High confidence is reached
- The hard question ceiling is hit
- The user asks to skip or continue with assumptions
- The current answer resolves remaining ambiguity

## When to Use

Use this skill when:
- the user is starting a new project
- the user has just installed VDD
- the user asks how to begin
- the current state is empty or too weak for reliable planning
- the system needs to convert plain-language intent into structured VDD inputs

## When Not to Use

Do not use this skill when:
- the project is already well into a later stage and context is clear
- the user explicitly requests a specialist workflow step only
- the task is deep architecture or implementation work rather than onboarding
- the user already supplied normalized project state and does not need guided capture

## Core Principle

Ask the smallest useful number of questions, one at a time.

The user should feel:
- understood
- guided
- protected from workflow confusion
- informed in plain language

The user should not feel:
- interrogated
- tested on technical knowledge
- forced to choose engineering details too early
- overwhelmed by a wall of questions

## Progress Visibility

Each popup shows simple progress:
- "سؤال سريع لفهم فكرتك" (for the first question)
- "سؤال X من Y" (for subsequent questions)

This reassures the user that the intake is short and controlled.

## Backtracking Support

The user can:
- Revise the most recent answer
- Go back one step when needed
- Clarify without restarting the whole flow

The `PopupFlowController.goBack()` method handles this by popping the last answer and rebuilding signals.

## Translation Rules

This skill must translate user answers into normalized VDD inputs such as:
- `project type`
- `target user`
- `core problem`
- `product shape`
- `AI involvement`
- `delivery preference`
- `constraints`

The user does not need to supply these fields by name.

## Assumption Rules

If the user gives incomplete information:
- choose the safest reasonable default
- record the assumption explicitly
- continue unless the missing detail blocks correctness materially

Recommended defaults:
- unclear platform -> web app
- unclear delivery priority -> MVP
- unclear AI usage -> no embedded AI
- unclear product shape -> web app
- unclear target user -> broad audience

## Intent Summary Output

When the popup flow completes, it produces an `IntentSummary` containing:

```typescript
{
  projectSummary: string;
  projectType: string;
  targetUser: string;
  coreProblem: string;
  productShape: string;
  aiRole: string;
  hasAiFeatures: boolean;
  deliveryPreference: string;
  platform: string;
  constraints: string[];
  assumptions: string[];
  confidenceTier: string;
  confidenceScore: number;
  questionCount: number;
  answers: Array<{ category: string; text: string }>;
}
```

This summary becomes the first structured state for the VDD workflow.

## Modes

### Guided Mode

Use when the user should confirm each major transition.

In this mode:
- the popup flow collects intent through adaptive questions
- summarize understanding at the end
- propose next step
- wait for explicit confirmation before continuing

### Autopilot Mode

Use when the user wants the system to continue through the obvious early workflow.

In this mode:
- the popup flow collects intent through adaptive questions
- summarize what was understood
- continue into `init`, `plan`, and `scaffold` if confidence is high
- stop at heavy decisions or high-impact assumptions

## Required Output Shape

The output should always contain:
1. what the system understood
2. which assumptions were made
3. confidence level and score
4. what stage the user is entering
5. what the next best step is
6. whether the system can continue automatically

## Command Handoff

After intent capture completes, the expected internal handoff path is:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.scaffold`

The user should not need to choose the next command manually.

## Transition Language

A recommended transition message after popup completion:

> Thanks. I understand your idea well enough to start structuring the project. I'll now set up the project foundation, then build the first planning pass.

This creates continuity between intake and execution.

## Safety Rules

This skill must not:
- overwhelm the user with too many questions
- require technical choices too early
- pretend understanding when user intent is ambiguous in a material way
- skip explanation of what is happening
- jump deep into implementation before the project idea is grounded
- ask more than the question budget allows
- repeat questions the user already answered

## Halt Conditions

Halt when:
- the user goal is too unclear to identify even a rough project type after the full budget
- there is a direct contradiction in core intent
- continuing would create misleading state
- the system would need to fabricate a major decision

In halt cases, summarize what is known, flag the unknowns, and ask the user to clarify the single most important gap.
