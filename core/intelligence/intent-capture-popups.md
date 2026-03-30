
# Intent Capture Popups

## Purpose

This document defines how Vibe Driven Dev collects project intent at the very beginning of the user journey through popup-style or card-style chat interactions.

The goal is not to interrogate the user with a long form.

The goal is to:
- capture the user's idea in natural language
- ask one useful question at a time
- adapt each next question based on the previous answer
- stop after a small, controlled number of questions
- reach enough confidence to begin the VDD workflow
- keep the experience simple for non-technical users

## Why This Layer Exists

Most users do not begin with structured product language.

They begin with:
- a vague idea
- a half-formed project
- a problem they want to solve
- a rough picture of a product
- uncertainty about scope, users, and technical shape

If VDD starts with commands or rigid forms, the experience becomes heavy too early.

Intent capture popups exist to:
- make the first interaction feel conversational
- reduce cognitive load
- gather enough information for VDD to start working intelligently
- avoid overwhelming the user with too many questions

## Core Principle

Ask one question at a time.

Each next question must be built from the previous answer.

The system should never present a large fixed questionnaire at the beginning.

It should:
- start wide
- narrow only where needed
- stop early once confidence is high enough
- avoid collecting information that is not yet useful

## Relationship to Autopilot Mode

Intent capture popups are the first visible layer of autopilot mode.

They happen before:
- `/vibe.init`
- `/vibe.plan`
- `/vibe.scaffold`

Their job is to produce the first reliable project profile.

That profile is then translated into:
- project type
- target user
- problem statement seed
- product shape
- AI involvement
- delivery preference
- initial constraints

## User Experience Goal

A non-technical user should feel that VDD is:
- listening
- understanding
- guiding
- not overwhelming
- turning their vague idea into something structured

The experience should feel like:
- a calm intake conversation
- not a technical setup wizard
- not a survey
- not a wall of prompts

## Popup Interaction Model

The system should use popup-like or card-like chat interactions when the host runtime supports them.

If rich UI is not supported, the system should fall back to ordinary chat messages while preserving the same logic.

The interaction model should remain:

- one question at a time
- one answer at a time
- one progress step at a time

## First Question Rule

The first question must always be broad and open-ended.

Recommended first question:

"Tell me generally about the idea you have in mind. What kind of project are you thinking about, who is it for, and what do you hope it will do?"

This first question should:
- invite a natural-language answer
- avoid jargon
- avoid forcing categories too early
- give the system enough raw material to infer the next best question

## Why the First Question Must Stay Open

The first answer often contains multiple signals at once:
- project type
- user type
- problem area
- product category
- possible AI involvement
- urgency
- desired quality level

If the system starts with narrow predefined categories, it can miss important signals or force the user into the wrong frame too early.

## Adaptive Question Rule

Every question after the first must be based on the previous answer.

That means the system should:

- parse the previous answer
- identify what is already known
- identify what is still unclear
- ask only the highest-value next question

The system must not ask generic questions that have already been answered implicitly.

## Example of Good Adaptive Questioning

If the user says:

"I want to build an AI SaaS that helps small businesses write better sales emails"

The next question should not be:
- "Is your project AI-based"

That is already obvious.

A better next question would be:
- "In your product, should the AI write the full email, suggest drafts, or help the user improve something they already wrote"

## Example of Another Good Adaptive Path

If the user says:

"I want a tool for my internal team to organize support requests"

The next question should not be:
- "Is this a public SaaS or an internal tool"

A better next question would be:
- "Who inside the team will use it most often, and what is the hardest part of the current support workflow"

## Question Budget

Intent capture popups must have a strict question limit.

### Default target
- 5 questions maximum

### Hard ceiling
- 7 questions maximum

The system should treat this as a design rule, not a suggestion.

If the system still lacks certainty after the ceiling is reached, it should:
- summarize current understanding
- make visible assumptions
- continue with flagged uncertainty
- avoid starting an endless intake loop

## Why the Question Limit Matters

The first interaction should feel quick and lightweight.

Too many questions at the beginning create:
- fatigue
- confusion
- abandonment
- low trust
- a sense that VDD is making setup harder instead of easier

## Progress Visibility

The popup flow should show simple progress.

Examples:
- "Question 1 of 5"
- "Quick project intake"
- "A few quick questions to understand your project"

The goal is to reassure the user that the intake is short and controlled.

## Editing and Backtracking

The user should be allowed to:
- revise the most recent answer
- go back one step when needed
- clarify without restarting the whole flow

However, backtracking should remain simple and lightweight.
It should not turn the popup flow into a full form editor.

## Intent Confidence Model

The popup system should stop when intent confidence is high enough.

Confidence should be based on whether VDD can answer the following well enough:

- What kind of project is this
- Who is it for
- What problem does it solve
- Is AI part of the product itself
- What shape does the product likely have
- Does the user want speed first or stronger foundations first
- Are there important constraints or deadlines

The system does not need perfect certainty.
It needs enough clarity to begin the workflow responsibly.

## Suggested Confidence States

### Low confidence
Too much ambiguity remains.
Ask another question.

### Medium confidence
Enough is known to continue with visible assumptions.
Ask one more question only if it would materially improve clarity.

### High confidence
Enough is known to begin VDD flow.
Stop asking and move into workflow execution.

### Blocking uncertainty
A core dimension is still too unclear.
Ask the smallest useful clarifying question before proceeding.

## Required Fields the Popup Flow Should Try to Resolve

The popup flow should ideally extract:

- project summary
- target user
- core problem
- product shape
- AI involvement
- delivery preference
- important constraints

These do not need to be asked directly as separate questions if they can be inferred from answers.

## Recommended Question Categories

The popup system may draw from these categories, but should not ask all of them every time:

### Category 1: General project idea
What is the project in general terms

### Category 2: Target user
Who will use it most

### Category 3: Core problem
What pain point it solves

### Category 4: Product shape
Whether it is closer to:
- web app
- SaaS
- internal tool
- AI wrapper
- something else

### Category 5: AI role
If AI is part of the product, what exactly the AI should do

### Category 6: Build priority
Whether the user wants:
- a quick MVP
- or a stronger, cleaner foundation from the start

### Category 7: Constraints
Deadlines, team size, compliance needs, platform constraints, or other hard boundaries

## Suggested Default Flow

### Popup 1
Open question:
Tell me generally about the idea you have in mind. What kind of project are you thinking about, who is it for, and what do you hope it will do?

### Popup 2
Clarify the most important missing dimension from popup 1.

Examples:
- target user
- product type
- business problem
- AI role

### Popup 3
Clarify product shape.

Examples:
- internal tool versus public product
- SaaS versus workflow assistant
- dashboard versus content tool

### Popup 4
Clarify delivery priority.

Example:
Do you want the first version to be fast and lightweight, or cleaner and more stable from the beginning?

### Popup 5
Clarify the most important remaining uncertainty.

Examples:
- AI role
- integration needs
- key constraints
- user access model

Then stop if confidence is high enough.

## Natural Language Style Rule

Questions must sound human and calm.

Avoid:
- excessive PM jargon
- technical stack language too early
- multi-part compound questions
- robotic phrasing

Prefer:
- one clean sentence
- one simple follow-up
- one idea at a time

## Translation Layer

Once the popup flow ends, VDD should create an internal intent summary.

That summary should include:

- project summary
- project type guess
- target user guess
- problem statement seed
- AI involvement summary
- delivery preference
- initial assumptions
- confidence level

This summary should become the first structured state for the workflow.

## Suggested Output Artifact

The popup flow may write:

- `Intent-Summary.md`

Optional contents:
- user answers
- interpreted summary
- extracted fields
- visible assumptions
- confidence notes

This file is optional but useful for inspectability and debugging.

## Handoff Into Workflow

Once confidence is sufficient, the popup flow should automatically hand off to the canonical early workflow:

1. `/vibe.init`
2. `/vibe.plan`
3. `/vibe.scaffold`

The user should not need to choose the next command manually.

## User-Facing Transition Language

A recommended transition message is:

"Thanks. I understand your idea well enough to start structuring the project. I’ll now set up the project foundation, then build the first planning pass."

This creates continuity between intake and execution.

## Stop Conditions

The popup flow must stop when any of the following is true:

- high enough confidence has been reached
- the hard question ceiling is reached
- the user asks to continue with assumptions
- the user says they want to skip intake
- the current answer already resolves the remaining ambiguity

## Failure Handling

If the popup flow cannot reach strong confidence, VDD should:

- summarize what it understands so far
- identify the main unknowns
- mark assumptions explicitly
- continue only if the remaining uncertainty is not dangerously high

If the uncertainty is too high, VDD should ask one final focused question or pause for the user to clarify.

## Anti-Patterns

The popup flow must avoid:

- asking all questions up front
- repeating what the user already said
- forcing technical categories too early
- turning the intake into a long survey
- continuing to ask questions when confidence is already high enough
- asking vague questions that do not improve state

## Suggested Internal Components

The implementation may eventually include modules such as:

```txt
core/
  autopilot/
    intent-capture-engine.ts
    question-builder.ts
    intent-confidence.ts
    popup-flow-controller.ts

These names are conceptual and may evolve.

Suggested Internal Skill

A likely internal skill for this feature is:
	•	skills/governance/onboarding-guide/SKILL.md

This skill should define:
	•	the first-question policy
	•	adaptive questioning rules
	•	the question limit
	•	confidence thresholds
	•	transition into /vibe.init

Contribution Rule

Contributors extending this layer must declare:
	•	how next questions are selected
	•	what confidence signals are used
	•	how the system avoids unnecessary questions
	•	what triggers early stop
	•	how the system stays understandable for non-technical users

This keeps the intake layer inspectable.

V1 Boundary

V1 should support:
	•	one open first question
	•	adaptive next questions
	•	a strict question limit
	•	one-question-at-a-time interaction
	•	visible progress
	•	confidence-based early stop
	•	automatic handoff into the early VDD workflow

V1 should not yet support:
	•	long branching form trees
	•	large up-front questionnaires
	•	hidden black-box questioning logic
	•	deep technical discovery before the basics are clear

The first version should feel light, calm, and smart.

اعتمدت في صياغة الـ feature على ثلاث نقاط عملية من مصادر حديثة:  
Typeform تشرح أن فلسفة **one question at a time** تجعل التجربة أكثر إنسانية وتقلل الإحساس بالإرهاق، كما تعرض completion rate متوسطًا 47% وتوضح أن الـ logic مهم لأن المستخدم يرى فقط الأسئلة ذات الصلة به. كذلك تشير إلى أن وضوح الوقت أو قصر التجربة يحسن الإكمال. Microsoft Copilot Studio توضح أن **Adaptive Cards** داخل المحادثة تدعم حقول إدخال وأزرار وتخزن إجابات المستخدم في variables لاحقًا، وهذا يجعل تنفيذ popup-like chat intake منطقيًا جدًا عندما يدعم الـ host rich UI.  [oai_citation:0‡Typeform Help Center](https://help.typeform.com/hc/en-us/articles/360029615911-whats-the-average-completion-rate-of-a-typeform?utm_source=chatgpt.com)

الخطوة التالية المنطقية جدًا هي:
`skills/governance/onboarding-guide/SKILL.md`