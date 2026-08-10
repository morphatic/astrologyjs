---
description: Run a structured NLSpec interview — adapts the prodkit feature-spec-interview framework to the tiered NLSpec output (index + contract + rationale)
---

You are running the structured spec interview for this project. The methodology is the **prodkit feature-spec-interview** skill, adapted to produce Morgan's tiered NLSpec output. This slash command is a thin adapter — the authoritative source for phases, prompts, and 61 question groups lives in the prodkit framework file.

## Step 0: Load the framework

**Read `~/dev/prodkit/skills/feature-spec-interview/framework.md`** before doing anything else. Treat it as the source of truth for: interview architecture, question groups, skip matrix, completeness audit, NLSpec writing rules, and interviewer conduct (one question at a time, Insights after every answer, challenging vague answers).

If that file is not present, tell the user: "The prodkit framework is not available at `~/dev/prodkit/`. Either clone prodkit (https://github.com/ramybarsoum/prodkit) or run `/spec-quick` instead."

Also read the three empty NLSpec templates already present in `plinth/specs/` so you know the target file structure and section scaffolding.

## Step 1: Ask depth

Use AskUserQuestion to pick depth. Defaults to Standard.

| Tier | Groups run | When to pick |
|------|-----------|--------------|
| Quick | ~8 groups: problem, goals, architecture sketch, primary capabilities, key constraints, DoD | Small project, clear intent, tolerate [OPEN] items |
| Standard (default) | ~18-22 groups: all behavioral + scenarios + data contracts + NFRs if production | Typical project |
| Deep | Full prodkit flow (up to 61 groups) | High-consequence, production, adversarial input, many external deps |

## Overrides to prodkit (apply throughout)

### The Gate (prodkit Section 2): replaced

Prodkit's gate asks about North Star alignment, user-complaint evidence, opportunity cost, and concept validation. These assume an enterprise PM context. For Morgan's projects, skip that gate entirely and ask these three scoping questions instead:

1. What does the finished project DO, in one paragraph?
2. Who is the primary user — yourself, a team, the public?
3. What is the single most important success criterion?

If the user can't answer, proceed anyway with `[OPEN]` markers. Never block.

### Mode selection (prodkit Phase 0): default All

Do not ask. Morgan's projects are solo; both PM and Engineering roles are the same person. Internally treat the interview as `All` mode.

### Tier 2 content: rationale, not empathy

Prodkit's Tier 2 = strategic + empathy context. **Morgan's Tier 2 is design rationale.** Its content:

- Why architecture X was chosen over alternatives Y and Z
- Approaches considered and rejected, with brief reasoning
- Reference catalogs and enumeration tables that agents consult rather than read linearly
- Deep analysis of inspiration projects and counter-examples (the contract keeps only the short annotated list)
- Agent-discoverability meta (where to find what, how sections cross-reference)

Do NOT produce the prodkit-style empathy walkthrough. If the project has a human touchpoint (UI, CLI, API surface), fold that content into the relevant capability section of the contract.

### Output files: three, not two

Write to `plinth/specs/<name>.nlspec.*`:

| File | Role | Source interview material |
|------|------|--------------------------|
| `<name>.nlspec.md` | Tier 1 contract | Binding behavior from Phase 1 answers |
| `<name>.nlspec.rationale.md` | Tier 2 rationale | Every "we chose X over Y" + reference catalogs + deep example analysis |
| `<name>.nlspec.index.md` | Tier 0 index (always-load) | One-to-two-sentence summary of each section, with correct numbers |
| `<name>.nlspec.audit.md` | Phase 4 completeness audit | Gaps, [OPEN] items, recommendation |

Use the project slug (folder basename) as `<name>` unless the user specifies otherwise.

### Contract format: dense NLSpec prose, not WHAT/WHEN/WHY/VERIFY blocks

Prodkit's contract template uses paragraphed WHAT/WHEN/WHY/VERIFY blocks. Morgan's NLSpec uses a different surface style. Translate:

- **WHAT** → declarative present-tense prose in the relevant numbered section. "The system does X."
- **WHEN** → conditional phrasing or a trigger enumeration inside the section.
- **WHY** → route to `.nlspec.rationale.md`. Never appears in the contract.
- **VERIFY** → route to either (a) a checkbox line in the Definition of Done section or (b) an `-- Invariant:` / `-- Behavior:` comment trailer on a pseudo-code block.

The information content is preserved; only the presentation changes.

### Section structure of the contract

Instead of the prodkit 14-section spec template, produce sections matching the NLSpec template:

1. Overview and Goals (problem, principles, scope, out of scope, short examples / counter-examples list)
2. Architecture
3. Data Model
4. Capability sections — one per major capability, section titles invented from the interview answers
5. Cross-cutting concerns — Security, Errors, Performance (include whichever apply)
6. Definition of Done — checkbox list, each item testable

NLSpec style rules (from `plinth/specs/<name>.nlspec.md` template and the `.nlspec.md` prior art):

- Dense declarative prose; present tense.
- Pseudo-code in fenced blocks with `-- Behavior:` or `-- Invariant:` trailing comments.
- Tables for parameter and constant listings.
- Numbered sections and subsections (`1`, `1.1`, `1.1.1`).
- Out-of-scope items each state: what it is, why excluded, extension point for later.

## Step 2: Apply the adapted gate

Ask the three scoping questions (above). Record answers. Do not use prodkit's four original gate questions.

## Step 3: Build the skip matrix

Use the skip matrix logic in prodkit Section 3, filtered by the chosen depth tier. Present the selected groups in a TodoWrite/TaskCreate list so the user can see progress.

## Step 4: Run the interview

Follow prodkit Phase 1 verbatim:

- One question at a time.
- After each answer, show a 2-3 line **Insight** connecting the answer to a constraint, surfacing a tension, or flagging a dependency.
- Probe vague answers ("That's a policy statement, not a constraint. What specific failure does this prevent?").
- Credit spec-ready answers briefly and move on.
- Mark each group `in_progress` when started, `completed` when done.

Use AskUserQuestion for discrete choices (tradeoffs, priority ordering, multi-select failure modes). Use conversational prompts for open-ended questions (scenario walkthroughs, failure-mode extraction).

## Step 5: Draft the four files

Produce in this order:

1. **Contract** (`.nlspec.md`) — populate all six section groups with the interview answers in dense NLSpec style. Every binding behavior goes here. WHY reasoning is deferred to the rationale file.
2. **Rationale** (`.nlspec.rationale.md`) — every "why X over Y" moment from the interview, the full example/counter-example analysis, any reference catalogs, and the agent-discoverability notes.
3. **Index** (`.nlspec.index.md`) — always written last, after contract and rationale are complete. One-to-two sentence summary per section, with correct section numbers pointing into the contract.
4. **Audit** (`.nlspec.audit.md`) — the Phase 4 completeness audit output (see prodkit Section 12). Report structural pass/fail, content quality, gaps, and [OPEN] items with what's needed to close them.

## Step 6: Summarize

After all files are written, show:

- Depth tier used and which groups ran (from the skip matrix).
- Which capability sections were created.
- Which `[OPEN]` items remain and what evidence would close each.
- Which design decisions made it into the rationale.
- Any sections left thin because the interview didn't surface enough information.
- Any tensions or contradictions between answers that need user review.

**Do NOT commit.** Leave everything in the working tree for the user to review and edit.

## When not to use this command

- If the user wants a fast freeform → spec pass, tell them to run `/spec-quick` instead.
- If `plinth/specs/` doesn't exist, tell them to run the `new-project` scaffold first.
- If they ask "which is faster, quick or standard," say: Quick takes ~10-15 minutes and produces a rough draft with many `[OPEN]` items. Standard takes ~45-60 minutes and produces a spec that can drive implementation with minimal follow-up.
