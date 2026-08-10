---
description: Generate a tiered NLSpec (contract + rationale + index) from a freeform project description
---

You are helping the user produce a tiered NLSpec for this project. The tier model is:

- **Tier 0 (index):** `plinth/specs/<name>.nlspec.index.md` — annotated TOC, always loaded.
- **Tier 1 (contract):** `plinth/specs/<name>.nlspec.md` — binding spec, always loaded for implementation.
- **Tier 2 (rationale):** `plinth/specs/<name>.nlspec.rationale.md` — design decisions, examples, appendices, load on demand.

## Process

1. **Read the three template files** already present in `plinth/specs/`. They contain placeholders (`<...>`) and inline `<!-- -->` guidance. Preserve the section structure.
2. **Ask the user for a freeform project description** — 2–5 paragraphs is ideal. If they've already given one in the current turn, skip this step.
3. **Draft each section.** Work section by section in the order they appear in the contract:
   - Overview and Goals (problem, principles, scope, out of scope, examples/counter-examples)
   - Architecture
   - Data Model
   - Capability sections (invent section numbers and titles that fit the domain)
   - Cross-cutting concerns (Security, Errors, Performance — include whichever apply)
   - Definition of Done
4. **Fill the rationale file** with design decisions that surfaced while drafting the contract. Every "we chose X over Y" moment belongs here, not in the contract.
5. **Fill the index file** last, after the contract and rationale are drafted. One-to-two sentence summary per section, with correct section numbers.

## Rules for what goes where

- **Binding behavior an implementer must produce** → contract (Tier 1).
- **Why a decision was made, alternatives rejected, tradeoffs** → rationale (Tier 2).
- **Reference catalogs, enumeration tables, large lookup data** → rationale appendices.
- **Deep analysis of example/counter-example projects** → rationale (Tier 2). The contract keeps only the short annotated list.
- **If a cross-cutting constraint is security/observability/data-contract-related and implementers need it frequently** → contract (Tier 1), even if it could plausibly be rationale.

## Style (match existing NLSpec conventions)

- Dense, declarative prose. Present tense. "The system does X."
- Pseudo-code in fenced blocks with a `-- Behavior:` comment trailer describing invariants.
- Tables for parameter/constant listings.
- Numbered sections and subsections throughout.
- "Out of Scope" items each get: what it is, why excluded, extension point for later.
- Definition of Done items are checkbox-list items, each testable.

## After drafting

Summarize in 3–5 bullets: (a) which capability sections were created, (b) which Out of Scope items were noted, (c) which design decisions made it into the rationale file, (d) any spots where you had to make a judgment call the user should review, (e) any sections left thin because you lacked information.

Do NOT commit. Leave everything in the working tree for the user to review and edit.
