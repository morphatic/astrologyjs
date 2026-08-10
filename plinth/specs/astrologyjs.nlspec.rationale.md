<!--
Tier 2 — Rationale

Load on demand. Contains:
  - Design decisions with alternatives considered and rejected
  - Deep analysis of examples / counter-examples (summary/pointer lives in the contract)
  - Appendices: reference catalogs, enumeration tables, large reference data
  - Agent-discoverability meta (llms.txt content, OpenAPI spec notes, etc., if applicable)

Style: explanatory. "Why we chose X instead of Y. What we tried that didn't work. What the tradeoffs were."

Do NOT put binding implementation requirements here. If you notice requirements creeping in, promote them to the contract file.
-->

# <Project or Component Name> — Rationale and Reference

This file documents *why* the contract ([`<name>.nlspec.md`](./<name>.nlspec.md)) looks the way it does. It is not binding. An implementer following only the contract should produce correct behavior; this file exists so that later readers (or the original author at a future date) can reconstruct the reasoning behind the decisions.

## Related files

- **Contract:** [`<name>.nlspec.md`](./<name>.nlspec.md) — the binding spec.
- **Index:** [`<name>.nlspec.index.md`](./<name>.nlspec.index.md) — annotated TOC for both this file and the contract.

---

## Design Decision Rationale

<One "Why X instead of Y?" block per non-obvious decision. Each block should state the decision briefly, name the alternative(s) considered, explain the tradeoff, and note any conditions under which the decision should be revisited.>

**Why <choice> instead of <alternative>?**

<Explanation. What was gained by choosing <choice>. What was given up. What constraints drove the decision. Optionally: "Revisit when <condition changes>.">

**Why <choice> instead of <alternative>?**

<...>

---

## Examples and Counter-Examples — Deep Analysis

<If the contract lists reference projects or counter-examples, this is where extended analysis lives. Keep the contract's summary short; put the detail here.

Structure per entry:
  - Name + link
  - What we adopted from it
  - What we rejected from it and why
  - Specific patterns worth studying>

### <Reference Project Name>

- **Link:** <url or path>
- **What this is:** <one-sentence description>
- **What we adopted:** <bullet list of patterns, APIs, or structural choices we borrowed>
- **What we rejected:** <bullet list of things we deliberately did differently, with reasons>
- **Sections worth studying:** <pointers to specific modules, files, or commits>

### <Counter-Example Name>

- **Link:** <url or path>
- **What this is:** <one-sentence description>
- **Failure mode(s) it illustrates:** <what goes wrong>
- **What we do differently because of it:** <the lesson we extracted>

---

## Appendices

<Reference catalogs, enumeration tables, and large reference data that agents should consult, not read linearly. Each appendix is a self-contained lookup resource.>

### Appendix A: <Catalog Name>

<Table, enum listing, or reference material. Link from the contract where relevant, e.g., "See Appendix A for the full list of supported <thing>." The contract should reference this appendix by its letter + name.>

### Appendix B: <Catalog Name>

<...>

---

## Agent Discoverability (optional)

<If the project exposes agent-facing discoverability surfaces (llms.txt, MCP server descriptions, OpenAPI notes beyond the schema itself, marketing-page structured data), document the content and the rationale here. The binding "this exists and responds at URL X" part belongs in the contract; the shape and wording of the content usually belongs here.>
