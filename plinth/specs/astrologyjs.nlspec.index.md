<!--
Tier 0 — Index

Always loaded. Keep this file small (~1–2KB target, hard ceiling ~4KB).
Purpose: give an agent enough signal to know (a) what this spec is, (b) which other files exist, (c) which specific section to pull into context for the task at hand.

Do NOT include implementation detail here. One or two sentences per section.
-->

# <Project or Component Name> — Spec Index

<One-paragraph elevator pitch: what this component is, who it's for, what it does, and what it depends on. Lift from the Tier 1 file's opening paragraph verbatim.>

## Related files

- **Contract (Tier 1, always-load):** [`<name>.nlspec.md`](./<name>.nlspec.md) — binding spec, load fully for any implementation work on this component.
- **Rationale (Tier 2, on-demand):** [`<name>.nlspec.rationale.md`](./<name>.nlspec.rationale.md) — design decision history, alternatives rejected, reference catalogs. Load when a judgment call requires historical context.

## Contract (Tier 1) — section summaries

<One or two sentences per section. Name each section exactly as it appears in the contract file so an agent can grep for it. Include the section number.>

- **1. Overview and Goals** — <summary>
  - **1.5 Examples and Counter-Examples** — reference projects worth studying (examples to learn from, counter-examples to avoid).
- **2. Architecture** — <summary>
- **3. Data Model** — <summary>
- **4. <Capability Area>** — <summary>
- **5. <Capability Area>** — <summary>
- **...** — <summary>
- **N. Design Principles** — <summary, if you keep it as a top-level section>
- **N+1. Definition of Done** — acceptance checklist covering all behaviors in this spec.

## Rationale (Tier 2) — section summaries

<Same treatment for rationale. Reader decides whether to pull based on these.>

- **Why mTLS instead of username/password** — <one-line summary of the tradeoff>
- **Why <tech choice> instead of <alternative>** — <one-line summary>
- **Appendix A: <catalog name>** — <what reference data lives here>
- **...**

## Cross-cutting notes

<Anything a casual loader of the contract should know that doesn't fit the section list. Examples: "Security constraints in Section 11 apply to ALL capability sections, not just the ones that mention auth." Keep to a few bullets max.>
