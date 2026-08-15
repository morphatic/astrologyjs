# astrologyjs NLSpec — Completeness Audit

Audit of [`astrologyjs.nlspec.md`](./astrologyjs.nlspec.md) and [`astrologyjs.nlspec.rationale.md`](./astrologyjs.nlspec.rationale.md), run 2026-08-10 immediately after drafting.

Interview: `/spec-interview`, **Standard** tier, 19 question groups run of 20 planned.

**Verdict: ready to drive implementation.** No `[OPEN]` items. Four sections thin by deliberate choice.

> **Revision, 2026-08-10.** The three gaps this audit found (G-1 batch endpoint, G-2 cache concurrency, G-3 versioning policy) and the one `[OPEN]` item (transit polling cost) have all been closed in the contract. §3.1 and §6 below record what was found and how each was resolved; they are kept rather than deleted because the findings are the audit's evidence that the process worked.

---

## 1. Structural completeness

| Check | Status | Note |
| --- | :---: | --- |
| Overview states what the component does AND does not do | ✅ | §1.3 and §1.4; every out-of-scope item carries an extension point |
| Design principles are binding and enumerated | ✅ | Five, §1.2, with an explicit governing principle |
| Architecture identifies components, boundaries, and data flow | ✅ | §2, including a per-layer "never does" column |
| Data model covers every persistent/wire structure | ✅ | §3, seven records with invariants inline |
| Capability sections cover all in-scope behavior | ✅ | §4–§9 |
| Cross-cutting concerns present | ✅ | Security §11, Errors §10, Performance §12 |
| Definition of Done is a testable checklist | ✅ | §14, 39 items in five groups plus integration |
| Every constraint traces to a specific failure mode | ✅ | See §2 of this audit |
| `[OPEN]` items labeled with what closes them | ✅ | None remain; the one raised is resolved in §6 |
| Versioning policy states what is breaking | ✅ | §1.6, added after this audit's first pass |
| Rationale contains no binding requirements | ✅ | Checked; all normative content is in the contract |
| Index summarizes every contract and rationale section | ✅ | Section numbers verified against the contract |

---

## 2. Content quality — constraint traceability

The strongest property of this spec is that its invariants are failure-derived rather than defensive. Each one below names a real defect, most of them observed in 1.x source rather than hypothesized.

| Invariant | Failure it prevents | Evidence |
| --- | --- | --- |
| No implicit-zone time input (§5.1) | Same code, different chart on laptop vs. container | `Person.create()` accepts `Date`, 1.x |
| Ambiguity throws (§5.5) | Silently choosing between two instants an hour apart | Ranked worst by Morgan |
| `orb` = distance from exactness (§8.2) | Every non-integer separation misreports aspect strength | `aspect.ts:102` |
| Closest-match aspect type (§8.2) | Silent breakage on any future orb change | `aspect.ts:89-94` |
| No derived/source aspects (§8.3) | A phantom orb-0 opposition atop every chart | Consequence of §6.3 |
| Absence of aspect is a value (§8.4) | Real faults indistinguishable from routine non-aspects | `chart.ts:115-119` |
| `speed` mandatory (§9.2) | Every body reports not-retrograde; applying/separating inverts | Adapter risk |
| Every requested body present (§6.2, §9.2) | Charts silently missing planets | `chart.ts:144` hardcoded literal |
| No catch discards an error (§10.3) | The general form of the two above | 1.x pattern |
| Non-JSON body → `TransportError` (§10.1) | `Unexpected token <` — six years of issue reports | Issues #5, #7 |
| No credential in the repo (§11) | A live key published in every npm tarball | `person.ts:61` |
| Cache key is the complete request (§9.3) | A cache hit returning a chart in the wrong frame | New risk from frame options |
| Frame consistency (§7.2) | A Davison chart from a tropical and a sidereal natal | New risk from §1's scope additions |
| Cache stores in-flight promises (§9.3) | Concurrent identical requests double-billing | Audit finding G-2 |
| Transit instants floored (§7.4) | A polling clock draining the free tier in 8 minutes | Audit finding, formerly `[OPEN]` |
| Changed value is major even if correct (§1.6) | Callers silently comparing charts across versions | Audit finding G-3 |

Language check: measurable throughout. Targets in §12 are numeric and each names its measurement method. No instances of "fast", "robust", or "handle gracefully".

**One weakness.** §12's "Aspect calculation, 20 bodies < 5 ms" and "Local time → instant < 1 ms" are plausible but were not measured — they are estimates, not observed baselines. They should be treated as smoke thresholds rather than real budgets until a benchmark exists.

---

## 3. Gap detection

### 3.1 Genuine gaps — all closed 2026-08-10

**G-1. The batch endpoint was never considered.** ✅ **Resolved — deliberately not used.** `POST /v1/batch` (`morphemeris-api.nlspec.md` §4.26) never surfaced in the interview. On review: credits are the exact sum with no discount, sub-requests execute sequentially server-side, and a batch counts as one rate-limit unit. Since credits are the scarce resource and batching changes none, the only benefit binds above ~20 charts/minute — a pace that exhausts the free tier's monthly credits in about eight minutes. Against that, per-chart batching adds a second response shape and partial-failure semantics to the adapter. Recorded as the extension point for a future bulk API in §1.4, with the reasoning in §9.1 and the rationale file.

**G-2. Cache concurrency is unspecified.** ✅ **Resolved.** §9.3 now requires the cache to store the **in-flight promise**, stored before the request is issued, so concurrent misses on one key share a single request and a single credit. Also specifies that a rejected promise is evicted, so a transient failure does not cache itself permanently. Two new DoD items and a new §12 measurement row cover it.

**G-3. Versioning policy has no section.** ✅ **Resolved.** Added as §1.6 rather than a new top-level section, to avoid renumbering §13/§14 and every cross-reference into them. States the minor/major split explicitly, including the non-obvious rule that **a changed computed value is major even when the new value is more correct** — the case that matters most for a library whose output is numbers, and the one 2.0.0 itself exemplifies. Question group G26 was planned and not run in the interview; this closes it.

### 3.2 Deliberate omissions — not gaps

- **Scenario walkthroughs (G17).** No end-to-end user-story section. The DoD integration criteria cover the same ground in testable form, and Gherkin scenarios in `features/` are the better home. Not run.
- **Tradeoff matrix (G5).** Folded into §1.2's design principles, which is where a binding tradeoff belongs. The governing principle *never return a plausible wrong number* is the tradeoff statement.
- **Hard constraints as a standalone group (G2).** Derived from failure modes and distributed as `-- Invariant:` trailers rather than collected in one section. The traceability table in §2 above is the collected view.
- **Dependency test-double fidelity (G20–22).** §13.1 specifies recorded responses and §13.2 the fixture set. A separate digital-twin spec would be ceremony for one dependency with a documented wire format.
- **Observability, alerting, on-call, chaos, rollout (prodkit groups 27–37).** A client library has no production to observe. Correctly skipped by the skip matrix.
- **Adversarial resilience (groups 53–56).** The library processes its own caller's input and one trusted API's responses. The one genuine adversarial surface — a key in a browser bundle — is handled in §4.3 and §11.

### 3.3 Coverage checks

- **Input completeness** — four time-input forms, three place forms (point, string+geocoder, explicit zone), all option permutations defaulted. Malformed inputs throw typed errors. ✅
- **Output completeness** — every field on every record has a stated source: fetched, derived, or computed. ✅
- **Concurrency** — requests within one chart are concurrent (§7.1); cross-call races on the cache resolve to one request via in-flight promise storage (§9.3). ✅
- **Failure and recovery** — retry policy in §9.4, thirteen typed error classes, warnings channel for non-failures. ✅
- **Scope boundaries** — no overlap with the Morphemeris spec; §1.3 explicitly cedes API behavior upstream. ✅

---

## 4. Cross-file consistency

| Check | Status |
| --- | :---: |
| Index section numbers match the contract | ✅ |
| Index describes 13 error classes; contract lists 13 | ✅ |
| Rationale's dependency table matches §5.2's choice | ✅ |
| Appendix B aspect count (21) matches §8.1's claim | ✅ |
| Appendix D credit table matches §7.1's request counts | ✅ |
| Body table (§6.1) and Appendix A agree on the unsupported five | ✅ |
| Glyph appendix covers every body in §6.1 | ✅ |
| No `[OPEN]` item depends on another | ✅ |

**Consistency with upstream** (`morphemeris-api.nlspec.md`): body identifiers, error codes, the response envelope, `require_origin` semantics, and credit costs were each checked against the API spec while drafting. One correction to the revival plan resulted — §4.2 of the plan lists strict browser-key mode as an issue to file, but `require_origin` is already specified upstream with a full behavior matrix. The revival plan should be updated.

---

## 5. Three Gulfs diagnostic

| Gulf | Instances | Disposition |
| --- | --- | --- |
| **1 — Comprehension** (input distribution not understood) | Unknown birth time; DST-ambiguous times; pre-standard-time dates; high-latitude houses | All surfaced during the interview and specified. §13.2's fixture list is the coverage proof. |
| **2 — Specification** (spec doesn't capture intent) | The batch endpoint (G-1); cache concurrency (G-2); versioning policy (G-3) | **All three fixed in the spec, as Gulf 2 requires** — no evaluator was built for any of them. Tests were then added to the DoD to cover the newly-specified behavior, which is the correct order. |
| **3 — Generalization** (spec clear, system misapplies) | None identifiable pre-implementation | Expected to surface during implementation; the fixture set in §13.2 is the detector. |

The critical gate held: G-1, G-2, and G-3 were Gulf 2 problems and were closed with spec text, not with tests written against unspecified behavior.

---

## 6. Open items

**None.** The one item this audit raised is closed:

**Transit polling cost.** ✅ **Resolved 2026-08-10 — round, with the granularity configurable.** `refreshTransits()` now floors its instant to `ChartOptions.transitGranularitySec`, default 60 seconds, with `0` restoring exact instants. At 60 seconds the worst-case error is the Moon at roughly 0.5 arcminutes — half the last digit any chart displays — so the precision cost is below the resolution of the output, while a 1 fps transit clock drops from 60 credits per minute to 1. It is not a silent tradeoff: the granularity is a documented option, and the rounding is what finally makes the deduplication cache useful for the case that motivated caching in the first place.

---

## 7. Tensions worth Morgan's review

1. **The 2.0 scope grew during the interview.** It opened as "corrected 1.x parity plus an API key" and closed with house-system selection, sidereal support, and four additional per-body fields. Each is individually cheap and each was chosen deliberately — but together they meaningfully widen a release whose stated goal was to get something correct published quickly. Worth a conscious confirmation that this is still the smallest thing worth shipping.

2. **`unknownTime` defaults to `omit` on my assumption, not your decision.** You asked for both modes and did not state a default. §5.3 defaults to `omit` on the reasoning that missing data is safer than an arbitrary ascendant. Noon is the more common convention in astrology software, so this is a real fork and reasonable people pick differently.

3. **The hand-rolled `Intl` conversion is the riskiest code in the library and has no upstream maintainer.** That was the right call on dependency grounds, and it means the timezone suite carries more weight than any other test in the project. If it is under-tested, the library's worst failure mode is unguarded.

4. **`tz-lookup`'s border imprecision is an accepted risk.** Mitigated three ways (pluggable resolver, explicit zone, resolved zone readable), but a caller who does none of those and whose birthplace is near a zone border gets a wrong chart with no signal. The `zone_resolved_by_default` warning is the only breadcrumb.

---

## 8. Recommendation

Proceed to implementation. G-1, G-2, and G-3 are closed, and no `[OPEN]` items remain.

Begin with §5 (time resolution) and its fixture set. It carries the highest risk in the library, everything else composes above it, and it is the one area where the code has no upstream maintainer to inherit edge cases from.

The spec meets the new-hire test: an implementer with no context could build from it without a clarifying question.
