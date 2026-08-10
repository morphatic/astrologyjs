# astrologyjs — Spec Index

`astrologyjs` turns a person or event — a name, a moment, a place — into an astrological chart: body positions, house cusps, angles, and aspects. Published on npm since 2016 and currently broken; 2.0.0 is a re-implementation on top of the [Morphemeris](https://morphemeris.com) ephemeris API. For application developers building astrology software in JS/TS, and the agents working alongside them. One network dependency; everything else computed locally.

## Related files

- **Contract (Tier 1, always-load):** [`astrologyjs.nlspec.md`](./astrologyjs.nlspec.md) — binding spec, load fully for implementation work.
- **Rationale (Tier 2, on-demand):** [`astrologyjs.nlspec.rationale.md`](./astrologyjs.nlspec.rationale.md) — decision history, rejected alternatives, reference catalogs.
- **Audit:** [`astrologyjs.nlspec.audit.md`](./astrologyjs.nlspec.audit.md) — completeness audit, three spec gaps, one open item.
- **Upstream authority:** `~/dev/morphemeris/docs/morphemeris-api.nlspec.md` — authoritative wherever the two overlap.

## Contract (Tier 1)

- **1. Overview and Goals** — what 1.x broke, and the five principles the rest derives from. **1.2** is the one to read before any judgment call. **1.4** lists out-of-scope items with extension points; **1.5** reference projects; **1.6** what counts as a minor versus major release.
- **2. Architecture** — the pipeline from caller to domain objects, the single network boundary, and what each layer owns and never does.
- **3. Data Model** — `AstrologyConfig`, `ChartOptions` (a chart's *frame*), `GeoPoint`, `Person`, `Planet`, `Aspect`, `Chart`.
- **4. Configuration and Authentication** — key resolution order, Bearer transmission, and the browser-exposure position.
- **5. Person and Time Resolution** — the strictest section, owning the highest-ranked failure mode. Accepted time inputs, zone precedence, unknown-time modes, geocoding, and the rule that ambiguous times **throw**.
- **6. Bodies** — supported-body table and Morphemeris mapping, the data-driven registry rule, south-node derivation, local sign assignment.
- **7. Chart Construction** — seven chart types with request and credit counts, frame consistency, and `refreshTransits()` with its instant rounding.
- **8. Aspects** — orb as distance from exactness, closest-match selection, derived/source exclusion, absence-of-aspect as a value.
- **9. Ephemeris Access** — `POST /v1/chart` only (not `/v1/batch`), adapter invariants, promise-level request deduplication, retry policy.
- **10. Error Handling** — thirteen typed error classes, never-log-a-key, no-silent-catch, and warnings that travel with results.
- **11. Security** — no credentials in the repo, no embedded shared key, Node-gated environment read.
- **12. Performance and Cost** — credits are the scarce resource; request counts asserted by test.
- **13. Verification** — test strategy, the golden-fixture list, and which docs gate the release.
- **14. Definition of Done** — checklist: Correctness / Time / Contract / Safety / Release, plus integration.

## Rationale (Tier 2)

- **Packaging and structure** — why ESM-only; why keep the 1.x domain model; why one async factory and no public data constructor.
- **Correctness fixes** — why `orb` is distance from exactness; why closest-match aspect selection; why "no aspect" is a value; why derived bodies don't aspect their source.
- **Time** — why the library converts local time rather than demanding UTC; why ambiguity throws; the measured dependency comparison behind `tz-lookup` + hand-rolled `Intl`; why unknown-time defaults to `omit`.
- **Astrological doctrine** — why the caller picks the house system even where Placidus is undefined; why true node by default; why the five missing bodies are dropped.
- **Service and cost** — why no shared key and no free proxy; why the cache stores in-flight promises; why 2.0.0 skips `/v1/batch`; why transit instants round to 60s; why typed error classes.
- **Presentation and docs** — why `Planet.symbol` is removed; why the README gates the release but the migration guide doesn't; why a more-correct computed value is still a major bump.
- **Appendices** — A: body catalogue. B: all 21 aspects with angles and orbs. C: glyph mappings, Unicode plus the otherwise-undocumented Kairon Semiserif ASCII map. D: credit costs per chart type.

## Cross-cutting notes

- **§1.2's first principle governs everything.** Where the spec is silent, choose whichever option cannot produce a plausible wrong number. Most invariants elsewhere are that principle applied to a case.
- **Invariants are greppable.** `-- Invariant:` is non-negotiable without a spec change; `-- Behavior:` may be refined if observable behavior is preserved.
- **The Morphemeris spec wins on API questions.** This spec quotes it; it does not define it.
- **1.x code and specs are reference, not baseline.** `src/*.spec.ts` encodes behavior that is known-wrong in at least two places. Never port an assertion without evaluating it.
