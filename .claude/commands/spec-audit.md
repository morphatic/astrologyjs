---
description: Run a completeness audit against an NLSpec — checks structural completeness, content quality, gaps, and cross-file consistency; writes an audit report
---

You are auditing a tiered NLSpec for completeness. Source methodology: prodkit Phase 4 (`~/dev/prodkit/skills/feature-spec-interview/framework.md`, Section 12), adapted to Morgan's six-section NLSpec structure and three-file tier split.

## Step 0: Locate the spec

The user may pass an argument naming the spec (e.g. `/spec-audit morphemeris`). If no argument is given:

1. Glob `plinth/specs/*.nlspec.md`. If exactly one matches, use it. If multiple, list them and ask which to audit. If none, tell the user this project has no NLSpec to audit.

Once a target is chosen, resolve the three sibling files:

- Contract: `plinth/specs/<name>.nlspec.md`
- Rationale: `plinth/specs/<name>.nlspec.rationale.md`
- Index: `plinth/specs/<name>.nlspec.index.md`

All three are expected. If any are missing, flag it in the report.

## Step 1: Read everything

Read all three files end-to-end before starting the audit. Do not skim. The audit depends on cross-referencing sections against index entries and rationale entries. If the contract is large, use sub-agents only if strictly necessary — the audit benefits from the whole spec in one context.

## Step 2: Run the checklist

Apply the following, in order. Mark each item `PASS`, `FAIL`, or `N/A` with a one-line reason. The reason must be specific — cite a section number or line when marking FAIL.

### 2.1 Structural completeness (contract)

- [ ] Section 1 states what the system does AND has a Goals subsection AND has an Out of Scope subsection.
- [ ] Out of Scope items each state: what it is, why excluded, extension point for later.
- [ ] Section 1 includes an Examples and Counter-examples list (brief annotated list; deep analysis belongs in rationale).
- [ ] Section 2 (Architecture) exists with either prose or a diagram description.
- [ ] Section 3 (Data Model) exists if the project has durable data, in-flight data structures, or external data contracts.
- [ ] Each capability section (Section 4.x) describes behavior in declarative present tense.
- [ ] Each capability section has an invariant anchor — either an `-- Invariant:` pseudo-code trailer or a testable DoD entry that the capability owns.
- [ ] Cross-cutting sections present where applicable: Security (if external input or credentials), Errors (always), Performance (if NFRs exist).
- [ ] Definition of Done exists with at least three checkbox items, each independently testable.

### 2.2 Structural completeness (rationale)

- [ ] Rationale file exists and is non-empty.
- [ ] Every "we chose X over Y" decision visible in the contract has a corresponding rationale entry.
- [ ] Reference catalogs / enumeration tables the contract depends on are present (or the contract inlines them).
- [ ] Deep example/counter-example analysis is in rationale (contract should have only the short annotated list).

### 2.3 Structural completeness (index)

- [ ] Index file exists.
- [ ] Every contract section is summarized in one-to-two sentences.
- [ ] Section numbers in the index match the contract exactly.
- [ ] Index points to the rationale file for design-decision questions.
- [ ] Total index size is small enough to always-load without regret (rough target: under ~2KB).

### 2.4 Content quality

- [ ] Every Definition of Done item is verifiable by an independent observer — a human or automated check can produce a yes/no.
- [ ] Language is specific: numbers, names, thresholds, not vague modifiers ("fast", "robust", "gracefully").
- [ ] Every constraint can be traced to a failure mode that would occur if the constraint were removed. If a constraint cannot be so traced, flag it as decorative.
- [ ] Pushback test: for each must-do / must-not-do, ask "If I removed this, what specific thing breaks?" Any item that cannot answer that question gets flagged.
- [ ] Present tense and declarative voice throughout the contract.

### 2.5 Gap detection

For each of these, state whether the spec addresses it. If not, it becomes a gap:

- **Input completeness** — all sources of input/data are named; malformed or adversarial inputs have defined behavior.
- **Output completeness** — all consumers of output are named; consequences of wrong output are described.
- **Concurrency** — simultaneous requests, race conditions, and re-run semantics defined where relevant.
- **Failure and recovery** — explicit retry/backoff behavior, post-failure state consistency.
- **Scope boundaries** — no unintentional overlap with adjacent systems or other specs.
- **Adversarial input** — if any external input exists, the spec describes resistance to malformed, malicious, or poisoned input.

### 2.6 Cross-file consistency (unique to the tiered split)

- [ ] No entity or field is named one way in the contract and another way in the rationale or index.
- [ ] No rationale entry contradicts a contract decision. (If the contract and rationale disagree, the contract is authoritative — flag the rationale for update.)
- [ ] No rationale entry remains for a decision that was reversed in the contract (stale rationale).
- [ ] Every `[OPEN]` marker in the contract is tracked somewhere (a TODO, an issue, a planning doc in `plinth/planning/`, or at minimum, restated at the top of the rationale as an open question).

## Step 3: Classify gaps using the Three Gulfs

For every gap or weakness found in step 2, assign a gulf:

| Gulf | Meaning | Action |
|------|---------|--------|
| **Gulf 1 — Comprehension** | The author does not yet understand the input distribution or a domain subtlety. Interview deeper before spec'ing. | Add to an `[OPEN]` block; defer to clarification. |
| **Gulf 2 — Specification** | The author's intent exists but the spec does not capture it. Fix the spec. | Propose specific text to add to the contract or rationale. |
| **Gulf 3 — Generalization** | The spec is clear but the implementation will misapply it on unfamiliar inputs. | Note for evaluator/test design; do NOT fix by changing the spec. |

The critical gate: do not propose an eval or test fix for a Gulf 2 problem. Fix the spec first.

## Step 4: Write the audit report

Write to `plinth/specs/<name>.nlspec.audit.md`. Structure:

```
# <name> NLSpec audit

**Date:** <today>
**Files audited:** contract, rationale, index (list which are present)

## Overall recommendation

READY / NEEDS <N> CLARIFICATIONS / NEEDS MAJOR REVISION

<one-paragraph justification>

## Structural completeness

### Contract
- [PASS/FAIL/N/A] <item> — <one-line reason>
...

### Rationale
...

### Index
...

## Content quality
...

## Gaps (classified by Gulf)

### Gulf 1 — Comprehension (N items)
1. <gap> — <specific clarification needed from user>

### Gulf 2 — Specification (N items)
1. <gap> — <proposed spec addition>

### Gulf 3 — Generalization (N items)
1. <gap> — <note for evaluator design>

## Cross-file consistency

<findings, or "No cross-file inconsistencies detected">

## [OPEN] items in the contract

<list of unresolved [OPEN] markers, or "None">

## Recommended next actions

1. <highest-priority action>
2. ...
```

## Step 5: Summarize to the user

After writing the audit file, summarize in under 150 words:

- Overall recommendation (READY / NEEDS N / MAJOR).
- The two or three most important gaps, with their Gulf classification.
- Any cross-file inconsistencies worth surfacing immediately.
- Path to the written audit file.

**Do NOT commit.** Do NOT edit the spec files. The audit is read-only; any fixes are the user's call.

## What this command is not

- **Not a rewrite tool.** It does not fix the spec; it reports on it.
- **Not a linter for NLSpec style.** Style belongs to `/spec-quick` and `/spec-interview`. This audits for completeness and internal consistency.
- **Not a replacement for interactive review.** An auditor catches mechanical gaps; a human catches judgment gaps. Use both.
