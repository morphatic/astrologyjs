<!--
Tier 1 — Contract

This file is the binding spec. Everything in it is implementation-driving. If a section isn't describing behavior an implementer must produce, move it to the rationale file.

Style notes (match observed NLSpec conventions):
- Dense, direct prose. No filler.
- Pseudo-code in fenced blocks with a `-- Behavior:` comment trailer describing invariants the code must uphold.
- Tables for parameter/constant listings.
- Numbered sections and subsections throughout.
- "The system does X" / "The firmware does X" — present tense, declarative.
- "Out of Scope" with explicit Extension Points for deferred work.
-->

# <Project or Component Name>

<One-to-three paragraphs: what this component is, who it's for (including coding agents), what it does at a high level, and what external systems it depends on. This is the elevator pitch — copy it verbatim into the index file.>

## Related files

- **Index:** [`<name>.nlspec.index.md`](./<name>.nlspec.index.md) — annotated TOC. Load first when orienting.
- **Rationale:** [`<name>.nlspec.rationale.md`](./<name>.nlspec.rationale.md) — design decisions, tradeoffs, appendices. Load on demand.

---

- [<Project or Component Name>](#project-or-component-name)
  - [1. Overview and Goals](#1-overview-and-goals)
    - [1.1 Problem Statement](#11-problem-statement)
    - [1.2 Design Principles](#12-design-principles)
    - [1.3 Scope](#13-scope)
    - [1.4 Out of Scope](#14-out-of-scope)
    - [1.5 Examples and Counter-Examples](#15-examples-and-counter-examples)
  - [2. Architecture](#2-architecture)
  - [3. Data Model](#3-data-model)
  - [4. <Capability Area>](#4-capability-area)
  - [N. Security](#n-security)
  - [N+1. Error Handling](#n1-error-handling)
  - [N+2. Performance](#n2-performance)
  - [N+3. Definition of Done](#n3-definition-of-done)

---

## 1. Overview and Goals

### 1.1 Problem Statement

<Describe the concrete problem this component solves. One or two paragraphs. Ground the reader in what the world looks like without this component and what it's like with it. No solution detail yet.>

### 1.2 Design Principles

<Named principles, bolded, each with a short paragraph of elaboration. These are binding — every implementation decision should be consistent with them. 4–7 principles is typical.>

**<Principle name>.** <One-to-three sentence explanation of what the principle means and what it rules out.>

**<Principle name>.** <...>

### 1.3 Scope

This spec covers:

- <Bulleted list of what's in scope for this component.>

This spec does **not** cover:

- <Bulleted list of what's explicitly out of scope. Reference other specs by filename where applicable.>

### 1.4 Out of Scope

<For each deferred item, a named paragraph with:
  - **What it is** (short description)
  - **Why it's excluded** (reason — e.g., scope, infrastructure dependency, cost)
  - **Extension point** — how a future revision could add it without breaking this spec.>

**<Feature name>.** <Description.> Excluded because <reason>. Extension point: <how this would be added later>.

### 1.5 Examples and Counter-Examples

<Projects, libraries, codebases, or prior implementations worth studying before or during work on this spec. Keep the summary here short — one or two lines per entry — and put any extended analysis in the rationale file.

Split into two lists:
  - **Examples** — projects whose approach, API shape, structure, or patterns we are deliberately learning from or emulating.
  - **Counter-examples** — projects whose failures, pitfalls, or rejected approaches informed our decisions. The point is to learn what NOT to do.

Each entry gets a link and a one-line "why this is useful" note. Agents implementing this spec should skim the examples before writing code.>

**Examples (worth studying and borrowing from):**

- [<Project name>](<url or path>) — <one line: what pattern, API, or structural choice is worth learning from here>.
- [<Project name>](<url or path>) — <...>.

**Counter-examples (worth studying to avoid repeating):**

- [<Project name>](<url or path>) — <one line: what failure mode, pitfall, or rejected approach this illustrates>.
- [<Project name>](<url or path>) — <...>.

<Extended analysis of any of these — what we adopted, what we rejected, specific sections to study — lives in the rationale file under "Examples and Counter-Examples — Deep Analysis".>

---

## 2. Architecture

<High-level structure. Diagrams allowed but keep them text-first (ASCII or mermaid). Describe:
- Major components and their responsibilities
- Data flow at the level of major operations
- External system boundaries
- Any layered/modular structure

Use subsections (2.1, 2.2, ...) for distinct architectural concerns.>

---

## 3. Data Model

<Every persistent or wire-format data structure. Use pseudo-code RECORD blocks:

```pseudo
RECORD <Name>:
    field_a : Type      -- description
    field_b : Type?     -- (trailing ? for optional)
```

Include validation rules and invariants inline.>

---

## 4. <Capability Area>

<Each capability area gets a top-level section. Within each, describe:
- The behavior (in pseudo-code where logic is non-trivial)
- Input/output schemas
- Error cases
- Observable state changes

Repeat this section pattern for each distinct capability.>

### 4.1 <Specific Behavior>

<Prose description, then pseudo-code block if behavior is non-trivial:>

```pseudo
FUNCTION <name>(<inputs>):
    <logic>

-- Behavior:
-- - <invariant 1>
-- - <invariant 2>
```

---

## N. Security

<Binding security requirements — authentication, authorization, transport, input validation, secret handling. What the implementation MUST enforce. Rationale for the choices goes in the rationale file.>

## N+1. Error Handling

<Binding error contracts — response formats, categories, retry semantics, what gets logged, what gets surfaced to callers.>

## N+2. Performance

<Binding performance targets — latency, throughput, memory. Expressed as measurable thresholds, not aspirations.>

| Operation | Target | Measurement method |
|-----------|--------|--------------------|
| <op>      | <target> | <how measured> |

---

## N+3. Definition of Done

<Checklist of concrete, verifiable behaviors that must be true when this spec is implemented. Every item should be testable. Mirrors the capability and cross-cutting sections above.>

- [ ] <Verifiable behavior>
- [ ] <Verifiable behavior>
- [ ] <...>

### Integration

- [ ] <End-to-end behavior that exercises the full system from boot through steady-state operation>
