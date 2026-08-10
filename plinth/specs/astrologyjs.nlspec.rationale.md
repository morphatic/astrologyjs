# astrologyjs — Rationale and Reference

This file documents *why* the contract ([`astrologyjs.nlspec.md`](./astrologyjs.nlspec.md)) looks the way it does. It is not binding. An implementer following only the contract should produce correct behavior; this file exists so that later readers — or the original author at a future date — can reconstruct the reasoning.

Decisions recorded here were made during the NLSpec interview on 2026-08-09/10 unless noted otherwise.

## Related files

- **Contract:** [`astrologyjs.nlspec.md`](./astrologyjs.nlspec.md) — the binding spec.
- **Index:** [`astrologyjs.nlspec.index.md`](./astrologyjs.nlspec.index.md) — annotated TOC for both files.
- **Audit:** [`astrologyjs.nlspec.audit.md`](./astrologyjs.nlspec.audit.md) — completeness audit and residual findings.

---

## Design Decision Rationale

### Why ESM-only instead of dual ESM + CJS?

`2.x` ships no CommonJS build. Three things make this cheaper than it would have been two years ago: Node 18 reached end of life in April 2025; Node 20.19+ and 22.12+ support `require(esm)` natively, so CJS consumers on any supported Node can still `require()` an ESM-only package; and dropping the dual build eliminates the dual-package hazard, which matters disproportionately here because the domain model is class-based — two loaded copies of the package mean two distinct `Chart` and `Planet` identities, and `instanceof` starts lying.

It also matches `@morphemeris/mcp`, which is already `"type": "module"`, keeping one mental model across the two projects.

A major version is the cheapest moment to make this switch, and 2.0.0 already forces every existing user to change code to add an API key — so nobody is upgraded into a breaking change they didn't already have to handle.

**Revisit when:** a real user reports a concrete break. tsup adds a `cjs` output in one config line, and the `exports` map gains a `require` condition. Do not preemptively add it on speculation.

### Why keep the domain model instead of rewriting from scratch?

The aspect engine, the chart-type decomposition, the combined-chart midpoint math, and the geographic/temporal midpoint helpers are pure computation that does not care where the numbers came from. They encode real astrological content, and re-deriving them from scratch would risk losing detail that took domain knowledge to get right the first time.

The counter-pressure is that 1.x was never finished to a defensible quality bar, so the existing code is *evidence*, not *authority*. The resolution: keep the structure and the astrological content, treat every formula as unverified until a hand-checked fixture confirms it. Two formulas have already failed that check — the orb calculation and the aspect-type selection loop.

### Why is `orb` the distance from exactness, when 1.x computed something else?

1.x computes `this._orb = Number((ng % 1).toFixed(6))` — the fractional part of the raw angular separation. For a trine at 118.5°, `ng % 1` is `0.5`; the true orb is `1.5`. The two coincide only when the aspect's exact angle is an integer *and* the separation happens to fall within one degree of it, which is why the bug survived: it produces small plausible numbers that look like orbs.

Astrologers use orb to judge an aspect's strength. A wrong orb doesn't crash anything; it silently misrepresents which aspects in a chart matter. This is the canonical instance of the failure mode the whole spec is organized around.

Fixing it changes output for anyone still running 1.x. Morgan's direction was explicit: default to fixing mistakes, because anyone relying on the old output needs to know it was wrong. That decision removed backward compatibility as a design constraint across the entire spec, which is why there is no compatibility mode anywhere in the contract.

### Why choose the closest aspect type instead of the last match?

1.x iterates the full aspect catalogue and assigns `this._type = type` on every match, so the **last** matching entry in object-iteration order wins. With the current orb values no two aspect ranges overlap, so this is correct today — by accident. Widening any orb, or adding an aspect type, silently makes it wrong in a way no test would catch.

Choosing the minimum `|separation − angle|` is the same result under current data and remains correct under any future catalogue. The catalogue is data ([§8.1](./astrologyjs.nlspec.md#81-aspect-catalogue)), so it *will* change.

### Why is "no aspect" an absent value instead of an exception?

1.x throws from `Aspect`'s constructor when two planets aren't in aspect, and `Chart.calculateAspects()` wraps construction in a `try/catch` that discards the error unless a private `_debug` field is set. For a 20-body chart that's 190 pairs, most of which are not in aspect — so the common case is an exception, and exceptions are the expensive path in every JS engine.

The correctness argument matters more than the performance one: with a blanket catch, an adapter fault (`undefined.longitude`), a `TypeError` from a malformed body, and "these two planets are 47° apart" all produce the same silent nothing. The one design rule that would have caught the most bugs in 1.x is *no catch block discards an error*, and it can't be applied while absence-of-aspect is expressed as a throw.

### Why exclude aspects between a derived body and its source?

The south node is derived as exactly 180° from the north node. An unfiltered aspect engine therefore reports a perfect opposition with orb `0.000000` in every chart the library ever produces — and since it sorts as the tightest aspect present, it lands at the top of every list.

It is an artifact of the derivation, not an observation about the sky. The two nodes are definitionally opposite; that is not information. Generalizing the rule to "no aspect between a derived body and its source" rather than special-casing the nodes means Part of Fortune and any future derived point inherit the correct behavior for free.

### Why does the library convert local time instead of demanding UTC?

This was the pivotal decision of the interview. Morgan ranked the timezone error as the most egregious and insidious of the candidate failure modes.

The instinct is that demanding UTC is safer — the library takes on no timezone responsibility and cannot get it wrong. The problem is that it doesn't remove the failure, it relocates it: every caller reimplements local→UTC conversion, and they reimplement it badly, because "which IANA zone was Springfield, Illinois in 1962, and what was its offset on that date" is not a question an application developer can answer.

Worse, 1.x's API actively invites the mistake. `Person.create()` accepts a `Date`, and `new Date("1980-05-15 14:30")` parses in the *host's* zone — the developer's laptop in `America/New_York`, a production container in UTC. Same source, two different charts, no error either time. The API made the wrong thing the easy thing.

So the constraint isn't "convert timezones correctly." It's **never accept a time whose zone is implicit**, which is what [§5.1](./astrologyjs.nlspec.md#51-accepted-time-inputs) encodes. Conversion follows from taking that seriously.

### Why throw on ambiguous times instead of resolving by rule?

01:30 on a fall-back date occurs twice; 02:30 on a spring-forward date never occurs. Both appear on real birth certificates.

Options considered: resolve by documented rule and expose what was chosen; resolve by rule and attach a warning; or refuse. The first two both mean a caller who doesn't check a flag gets a silently-chosen chart — roughly a degree of Moon and potentially a different ascendant, from a decision they never made. That is precisely the failure class ranked worst, rebuilt with better documentation.

Confirmation that this is the right shape: TC39's Temporal proposal offers exactly this as `disambiguation: 'reject'`, having worked through the same problem independently. The `offsetMin` escape hatch in [§5.1](./astrologyjs.nlspec.md#51-accepted-time-inputs) is what makes throwing tolerable — the caller resolves the ambiguity explicitly and moves on.

### Why `tz-lookup` + hand-rolled `Intl`, instead of `geo-tz`, Temporal, or Luxon?

Revival-plan open question #4 asked whether `geo-tz` was acceptable. Measured `npm view` figures closed it:

| Package | Unpacked | Deps | Isomorphic |
| --- | --- | --- | --- |
| `geo-tz@8.1.8` | 73.4 MB | 4 | No — reads data files from disk |
| `tz-lookup@6.1.25` | 152 KB | 0 | Yes |
| `temporal-polyfill@1.0.3` | 1.0 MB | 2 | Yes |
| `luxon@4.7.2` | 4.6 MB | 0 | Yes |

`geo-tz` is exact — it does true polygon point-in-boundary tests — but 73 MB and Node-only is a worse dependency than the Google Maps call it replaces, in a library whose users include browser apps.

Temporal would give `disambiguation: 'reject'` as a one-liner, but it is **not available in Node 22.22** (verified: `typeof Temporal === "undefined"`), so it means shipping a 1 MB polyfill today.

The chosen path — `tz-lookup` for zone lookup, plus offset resolution via `Intl.DateTimeFormat` + `formatToParts` against the platform's own tzdb — costs roughly forty lines of fiddly code this project owns, and both the ambiguous and nonexistent cases fall out of the offset round-trip naturally. It is the technique `date-fns-tz` uses internally.

The honest cost: `tz-lookup` is a compressed approximation accurate to a few kilometers, so near a zone border it can return the wrong zone — a wrong offset, which is the ranked-worst failure. Three mitigations: the resolver is pluggable, so a Node user needing exactness can drop in `geo-tz` without every other user paying 73 MB; an explicit `zone` can be passed per `Person`; and the resolved zone is always readable on the `Person`, so a wrong answer is detectable rather than invisible.

**Revisit when:** Node ships Temporal natively in a version this package supports. At that point the hand-rolled conversion can be replaced by `disambiguation: 'reject'` with no contract change, since the observable behavior is identical by design.

### Why is unknown-time handling a caller choice with `omit` as the default?

Morgan's answer was to support both modes rather than pick one, because assuming noon is common practice and the caller is entitled to that choice.

The default is `omit`, which was an assumption made during drafting rather than a stated decision. The reasoning: an ascendant sweeps the entire zodiac in 24 hours, so a noon-derived ascendant is not an approximation of the true one — it is unrelated to it. A caller who never reads the documentation gets missing data (loud, obvious) instead of an arbitrary angle (quiet, plausible, wrong). That is the same principle that drove throwing on ambiguous times, applied consistently.

Both modes set `timeKnown: false` and emit a warning, so the mode changes what is *returned*, never whether the chart records the uncertainty.

### Why does the caller choose the house system, even where it's undefined?

Placidus is undefined above roughly 66° latitude. Three options: pass the API's warning through unchanged; silently substitute a system that is defined everywhere (Porphyry is the usual choice); or throw.

Substituting means the library makes a doctrinal decision on the caller's behalf and returns cusps from a system they did not ask for. Throwing breaks a legitimate case — people are born in Tromsø — and forces `try/catch` around ordinary geography.

Passing the warning through keeps the library out of an argument astrologers should have with each other. It generalizes to the design principle in [§1.2](./astrologyjs.nlspec.md#12-design-principles): the library provides defaults and never silently overrides an explicit choice.

### Why true node as the default?

Morphemeris offers both mean and true; 1.x said only "north node" and the dead backend can't be asked which it returned. Contemporary Western practice tends toward the true node, and 1.x's aspect catalogue is unambiguously Western — it carries sesquiquadrate, quintile, and biquintile, which are Western minor aspects. Defaulting to true node keeps the library internally consistent with the tradition the rest of it already assumes.

Vedic practice conventionally uses the mean node, but Vedic work requires opting into sidereal mode anyway, so those users are already passing options.

Returning both as distinct bodies was rejected: it doubles the node entries in every chart and forces every consumer, including the aspect engine, to decide which to use.

### Why drop the five missing bodies rather than block on them?

1.x's hardcoded body list includes `eris`, `chariklo`, `chaos`, `nessus`, and `cupido`, none of which Morphemeris carries.

That list looks less like a considered choice than an accretion. `cupido` is the clearest evidence: in Uranian astrology it names a *hypothetical* planet with no ephemeris body at all, while asteroid 763 Cupido is a real and completely unrelated object. 1.x does not record which it meant, and there is no way to recover the answer.

Blocking 2.0.0 on another repository's roadmap, for bodies whose 1.x semantics can't be reconstructed, trades a shippable release for a question that may have no correct answer. Dropping them and making the registry data-driven means they arrive as a minor release whenever the API carries them.

### Why remove `Planet.symbol` rather than fix it?

1.x maps body names to the Kairon Semiserif font's private ASCII encoding: Aquarius is `"ü"`, Pluto `"#"`, Uranus `"ö"`. Anyone without that font sees mojibake, and the library never names the font it means.

Morgan's preference was for Kairon Semiserif on aesthetic grounds, conditional on it being easy for people to get. It isn't: it ships bundled inside [Kairon](https://kairon.cc/en/download.php), a Mac-only astrology application whose installer offers to install `kairon_semiserif` during setup. There is no standalone download and no published redistribution license. So the condition resolves against it.

Presentation is not a chart library's job, so the property comes off `Planet` entirely. But the mapping itself is a genuinely scarce artifact — Morgan's note that "figuring out which characters map to which symbols was not easy" is the point, and nobody publishes the key — so it is preserved as documentation ([Appendix C](#appendix-c-glyph-mappings)) rather than discarded.

`heliotrek`'s `wheel` crate already curates the Unicode side and its `glyphs.rs` documents the same "fonts that park astro glyphs on ASCII keys instead of Unicode codepoints" problem. The two projects should share one glyph vocabulary.

### Why one async factory instead of keeping `ChartFactory`?

1.x exports both `ChartFactory.create()` (async, does all the fetching) and `new Chart(name, p1, cdata, …)` (takes raw wire-format data). The second is public but unusable unless the caller hand-assembles `ChartDataArray`, and nobody did.

Collapsing to one entry point removes the useless door and, more importantly, takes the internal `ChartData` shape out of the public contract — so the adapter's output can change without a major version. `ChartFactory` as a class existing solely to hold one static method is a Java-ism in a language with modules.

A public data-taking constructor was considered for callers who cache responses or supply their own ephemeris. Rejected because it would freeze the wire shape into the contract permanently, which is a high price for a use case nobody has asked for. Request deduplication ([§9.3](./astrologyjs.nlspec.md#93-request-deduplication)) covers the caching motivation.

### Why in-memory deduplication rather than no caching or a pluggable cache?

Ephemeris data for a fixed instant never changes, so a cache keyed on the full request tuple can never go stale — which removes invalidation, the hard part of caching, entirely.

The concrete win is modest but real: Synastry and Combined for the same pair of people, or re-deriving a natal chart already fetched in the same process, stop double-billing.

A pluggable cache interface (Redis, filesystem) was rejected for 2.0.0 because it adds a public interface and a class of bugs where a bad implementation silently returns charts in the wrong frame. The in-memory version can be extended later without breaking anyone.

**What deduplication does not fix on its own:** `refreshTransits()` defaults to `new Date().toISOString()` at millisecond precision, so successive calls are distinct keys by construction and never hit the cache. That is what transit rounding, below, exists to solve.

### Why the cache stores in-flight promises rather than resolved values

Found by the completeness audit rather than the interview. The obvious implementation — check the map, miss, fetch, store the result — coalesces nothing when two calls race, because both miss before either stores. Two requests go out and two credits are spent for one logical fetch.

This is not an exotic case. A `Synastry` chart for two people born in the same city at the same instant issues two identical requests concurrently by design ([§7.1](./astrologyjs.nlspec.md#71-chart-types-and-requests)), and any caller building several charts inside a `Promise.all` hits it immediately. Deduplication that only works when calls are sequential is not deduplication for an async API.

Storing the promise before the request is issued fixes it in about three lines. The subtlety worth writing down is eviction: a rejected promise must be removed from the map, or the first transient network failure caches itself forever and every later call for that chart replays the same error.

### Why 2.0.0 does not use `POST /v1/batch`

Also an audit finding — the endpoint never came up during the interview.

The facts that decided it, from `morphemeris-api.nlspec.md` §4.26: credit cost is the exact sum of sub-requests with no discount; sub-requests execute **sequentially** server-side; and a batch counts as **one unit** against the per-minute rate limiter regardless of size.

So batching changes nothing about credits, which are this library's scarce resource. Against Morphemeris's own targets (`/v1/chart` computation under 5 ms, P50 response under 50 ms), a 3-request `CombinedTransits` costs roughly 50 ms as three concurrent calls and roughly 60 ms as one batch — the serialized compute is added latency the parallel version overlaps away. Batch does win on rate-limit units (1 versus 3) and on tail latency, since three independent requests each carry their own P99 risk.

What tips it is the adapter cost. A batch returns per-sub-request `status` and `error` fields, so a sub-request can fail inline while its siblings succeed — and all of them are billed. Supporting that means a second response shape and a decision about what a half-built chart means, in exchange for a rate-limit benefit that only binds above roughly 20 charts per minute. On the free tier, sustaining that pace exhausts the monthly credit budget in about eight minutes, so the limit that binds first is never the rate limiter.

The calculus inverts for bulk work — generating charts for a list of people, or scanning a date range — which is exactly the use case §4.26 was written for. That is where the 50-sub-request ceiling and the single rate-limit unit pay, and it is recorded as the extension point rather than built now.

### Why transit instants are rounded, and why 60 seconds

The polling problem is real: `refreshTransits()` is cheap to call in a loop, and an animated transit clock at 1 fps consumes the entire 500-credit monthly free tier in about eight minutes.

The options were to round, or to document the cost and leave behavior alone. Documenting is more honest in the abstract but leaves a footgun that callers discover through their credit balance rather than their code — and the "honesty" argument weakens once you look at the actual precision cost.

The Moon is the fastest-moving body at roughly 13° per day, or 0.009° per minute. Sixty-second rounding therefore introduces at most about **0.5 arcminutes** of error, and less for everything else. Charts display degrees and minutes, so that is half of the last digit shown — below the resolution of the output. It is not a meaningful loss of precision; it is a rounding that no consumer can observe.

Rounding is also not silent, which was the real objection: `transitGranularitySec` is a documented option and `0` disables it. And it makes the deduplication cache work for the one case that motivated caching in the first place, which the millisecond default defeated entirely.

### Why the versioning policy is stated explicitly

The audit flagged that [§1.2](./astrologyjs.nlspec.md#12-design-principles) asserts additive evolution while nothing said what "breaking" means for this library. That matters more here than for most packages, because the very next question after 2.0.0 ships is what 2.1 may safely add — and the answer is non-obvious for a library whose output is numbers.

The rule that needed writing down is that **a changed computed value is major even when the new value is more correct**. 2.0.0 exists precisely because 1.x's orb was wrong; a caller comparing charts stored across versions needs the version boundary to tell them the numbers moved. Treating a bug fix as a patch because it is a fix would reproduce, at a smaller scale, exactly the situation this release is cleaning up.

### Why typed error classes rather than one error with a code?

`InsufficientCreditsError` and `RateLimitError` are the argument. To an application they are entirely different situations — one needs a purchase, the other needs a wait of a known duration — and collapsing them into a single class forces every caller into a switch statement over string codes that editors cannot autocomplete and typos silently break.

A discriminated result union was considered and rejected: it is a large idiom shift for a library whose 1.x surface threw, and most of these failures are genuinely exceptional rather than expected control flow.

The `TransportError` case for a non-JSON body deserves special note. It exists specifically so the 1.x experience — an nginx redirect page parsed as JSON, surfacing as `Unexpected token <` — can never recur. Six years of issue reports came down to an error message that named the parser instead of the problem.

### Why does the README gate 2.0.0 when the migration guide doesn't?

Morgan initially selected only the glyph tables and generated API reference as release-gating documentation. Flagged as a possible misread, since publishing to npm with the current README means the package's front page describes a free unauthenticated service that no longer exists and walks people through obtaining a Google Maps key for APIs that now require billing — recreating the exact arrival experience the release exists to remove.

The resolution was deliberate: **README yes, migration guide no.** The README is what npm renders and what a stranger sees; the migration guide only ever gets linked from the issue replies, which are Phase 3 work. Gating the release on a document whose only consumer isn't ready yet would delay the release for nothing.

### Why no shared API key, and no free proxy?

Both recreate the failure being fixed.

A shared key embedded in the package would be extracted within a day, and its inevitable revocation would strand every user exactly as the dead PHP endpoint did. A free unauthenticated proxy *is* the original architecture — `morphemeris.com/ephemeris.php` was precisely that — and rebuilding it means repeating the mistake with better infrastructure and the same ending.

Requiring callers to bring their own key costs a signup and is honest about what they are depending on. Issue #3 asked for exactly that honesty in 2017: *"Is this service guaranteed to be offered in the future, and if so, for free? I would be unable to use this module if there'll be a significant cost associated to it or if at some point the service is terminated."* The free tier's 500 credits per month covers the hobby use this audience represents.

### Why is the browser story documentation rather than a mechanism?

Any key in a browser bundle is public. The library does not obfuscate it, because obfuscation implies a protection that does not exist.

Revival-plan §4.2 proposed filing a Morphemeris issue for a strict browser-key mode. That turns out to be unnecessary — `require_origin` is **already specified** in `morphemeris-api.nlspec.md` §5.4, complete with the full allow/deny matrix and an explicit note that origin restriction alone does not protect a leaked key because a non-browser caller simply omits the header. Whether it is implemented is a separate question, but the API design decision is made, and this library's documentation should point browser users at it.

---

## Examples and Counter-Examples — Deep Analysis

### `astrologyjs@1.3.1` (this repository, before 2.0.0)

- **Link:** `git log` before the 2.0.0 work; `src/` at commit `1efdb55`
- **What this is:** the previous version of this library — the primary counter-example, and the most useful one, because every defect is a decision someone plausibly makes again.
- **Failure modes it illustrates:**
  - A live Google Maps API key hardcoded at `src/person.ts:61`, published in every `dist` bundle on npm and present throughout git history. Revoked years ago, never removed.
  - `Aspect._orb` computing the fractional part of the separation rather than the distance from exactness.
  - `Person.create()` accepting a `Date`, importing the host's zone silently.
  - A blanket `try/catch` making adapter faults indistinguishable from ordinary non-aspects.
  - A hardcoded 23-body object literal in `calculateCombinedPlanets` that crashes if the backend returns a body it doesn't list, and silently omits any body it lists that the backend doesn't return.
  - `innerPlanets`/`outerPlanets` naming chart-wheel rings in terms every reader will parse as orbital classes — and returning `[]` from `innerPlanets` for single-person charts while `outerPlanets` returns everything.
  - A `_signs` table declared on `Chart` and never referenced.
- **What we do differently because of it:** every item above maps to a named invariant in the contract. The spec is in large part a list of things this code did.
- **Worth studying:** `getLonMidpoint` and `getGeoMidpoint` are correct and worth porting nearly verbatim. `calculateAspects`' cross-ring logic is right in structure. The chart-type decomposition in `ChartFactory.create` is sound and survives into [§7.1](./astrologyjs.nlspec.md#71-chart-types-and-requests).

### `@morphemeris/mcp`

- **Link:** `~/dev/morphemeris/mcp/`
- **What this is:** the MCP server for the Morphemeris API — the closest sibling project and the toolchain precedent.
- **What we adopt:** `"type": "module"`; tsup for bundling; vitest for tests; `files`-scoped publishing; `engines.node >= 20`; `typecheck` as `tsc --noEmit`.
- **What we reject:** nothing yet. The build shape should match closely enough that a change to one is obviously portable to the other.
- **Worth studying:** `package.json` and `tsup.config.ts` first; they answer most build questions without discussion.

### `heliotrek` — `crates/wheel`

- **Link:** `~/dev/heliotrek/crates/wheel/`
- **What this is:** a Rust chart-wheel SVG renderer. Not a dependency — a vocabulary and design reference.
- **What we adopt:** the glyph vocabulary. `GlyphId::ALL` with `codepoint()` covers 30 glyphs, and `glyphs.rs` already documents the ASCII-parked-glyph problem this project hit from the other side. [Appendix C](#appendix-c-glyph-mappings) should stay consistent with it.
- **What we reject:** nothing; the projects don't overlap in scope. If SVG rendering is ever added to the JS side, `wheel` is the design to port rather than reinvent — it has already solved collision fan-out for stacked planets and Astrodienst-standard orientation.

### `theriftlab/immanuel-python`

- **Link:** <https://github.com/theriftlab/immanuel-python>
- **What this is:** a Python chart library with JSON output, 114 stars.
- **What we adopt:** its handling of chart configuration — house system and ayanamsha as explicit settings that travel with the chart rather than being ambient — informed [§7.2](./astrologyjs.nlspec.md#72-frame-consistency)'s frame-consistency rule.
- **What we reject:** its breadth of configuration surface. This library ships fewer knobs in 2.0.0 deliberately.

### `geo-tz`

- **Link:** <https://github.com/evansiroky/node-geo-tz>
- **What this is:** exact polygon-boundary timezone lookup for Node.
- **Failure mode it illustrates:** not a bug — a shape mismatch. 73.4 MB unpacked and filesystem-dependent, in a library that must run in browsers. Correct and unusable here.
- **What we do differently because of it:** the resolver is an interface, so `geo-tz` remains available to Node users who need polygon exactness without imposing itself on everyone else.

---

## Appendices

### Appendix A: Body catalogue

The **major** set, for which `Planet.isMajor()` returns true — the bodies typically shown in a chart reading:

`sun`, `moon`, `mercury`, `venus`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`, `north node`, `south node`

Supported bodies and their Morphemeris identifiers are tabulated in [§6.1](./astrologyjs.nlspec.md#61-supported-bodies) of the contract. Bodies present in 1.x and unsupported in 2.0.0: `eris`, `chariklo`, `chaos`, `nessus`, `cupido`. `earth` was in 1.x's symbol table but never in its chart data; it is meaningful only in heliocentric mode, which 2.0.0 does not expose.

### Appendix B: Aspect catalogue

Carried forward from 1.x unchanged. Angles in degrees; orb is the maximum deviation from exactness at which the aspect is recognized.

| Aspect | Angle | Orb | Major |
| --- | ---: | ---: | :---: |
| conjunct | 0 | 6 | ● |
| semisextile | 30 | 3 | |
| decile | 36 | 1.5 | |
| novile | 40 | 1.9 | |
| semisquare | 45 | 3 | |
| septile | 51.417 | 2 | |
| sextile | 60 | 6 | ● |
| quintile | 72 | 2 | |
| bilin | 75 | 0.9 | |
| binovile | 80 | 2 | |
| square | 90 | 6 | ● |
| biseptile | 102.851 | 2 | |
| tredecile | 108 | 2 | |
| trine | 120 | 6 | ● |
| sesquiquadrate | 135 | 3 | |
| biquintile | 144 | 2 | |
| inconjunct | 150 | 3 | |
| treseptile | 154.284 | 1.1 | |
| tetranovile | 160 | 3 | |
| tao | 165 | 1.5 | |
| opposition | 180 | 6 | ● |

Note for implementers: no two ranges in this table overlap, which is why 1.x's last-match-wins loop produced correct results. That property is not guaranteed to survive any edit to the table — hence the closest-match rule in [§8.2](./astrologyjs.nlspec.md#82-orb-calculation).

The 1.x orb values are uniform by aspect class (6° for majors, 3° for most minors) rather than varying by body, which is a simplification — many astrologers use wider orbs for the Sun and Moon. Configurable per-body orbs are a candidate for a future minor release; the catalogue being data makes that additive.

### Appendix C: Glyph mappings

`Planet.symbol` is removed from the API ([§3.4](./astrologyjs.nlspec.md#34-planet)); these tables are the documentation that replaces it. They ship in the published docs.

#### C.1 Unicode

Renderable in any modern font, no licensing question, works in a terminal and a JSON dump.

| Body | Char | Codepoint | | Sign | Char | Codepoint |
| --- | :---: | --- | --- | --- | :---: | --- |
| sun | ☉ | `U+2609` | | aries | ♈ | `U+2648` |
| moon | ☽ | `U+263D` | | taurus | ♉ | `U+2649` |
| mercury | ☿ | `U+263F` | | gemini | ♊ | `U+264A` |
| venus | ♀ | `U+2640` | | cancer | ♋ | `U+264B` |
| earth | ♁ | `U+2641` | | leo | ♌ | `U+264C` |
| mars | ♂ | `U+2642` | | virgo | ♍ | `U+264D` |
| jupiter | ♃ | `U+2643` | | libra | ♎ | `U+264E` |
| saturn | ♄ | `U+2644` | | scorpio | ♏ | `U+264F` |
| uranus | ♅ | `U+2645` | | sagittarius | ♐ | `U+2650` |
| neptune | ♆ | `U+2646` | | capricorn | ♑ | `U+2651` |
| pluto | ♇ | `U+2647` | | aquarius | ♒ | `U+2652` |
| north node | ☊ | `U+260A` | | pisces | ♓ | `U+2653` |
| south node | ☋ | `U+260B` | | | | |
| ceres | ⚳ | `U+26B3` | | | | |
| pallas | ⚴ | `U+26B4` | | | | |
| juno | ⚵ | `U+26B5` | | | | |
| vesta | ⚶ | `U+26B6` | | | | |
| chiron | ⚷ | `U+26B7` | | | | |
| lilith | ⚸ | `U+26B8` | | | | |

No Unicode codepoint exists for `pholus`, `eris`, `chariklo`, `chaos`, `nessus`, or `cupido`. Part of Fortune has no official codepoint; `⊗` (`U+2297`) is conventional but not standardized. Consumers needing those glyphs need a font or an SVG set.

Aspect glyphs: conjunction `☌` `U+260C`, opposition `☍` `U+260D`, sextile `⚹` `U+26B9`, semisextile `⚺` `U+26BA`, semisquare `⚻` `U+26BB`, sesquiquadrate `⚼` `U+26BC`. Square and trine use geometric shapes — `□` `U+25A1` and `△` `U+25B3` — as Unicode assigns them no astrological codepoints. The remaining minor aspects have none.

#### C.2 Kairon Semiserif

The font ships only inside [Kairon](https://kairon.cc/en/download.php), a Mac astrology application, and publishes no standalone download or redistribution license. This mapping is recorded because it is otherwise undocumented and was expensive to derive.

Type the ASCII character with the font applied to render the glyph.

| Body | Key | | Body | Key | | Sign | Key | | Aspect | Key |
| --- | :---: | --- | --- | :---: | --- | --- | :---: | --- | --- | :---: |
| sun | `a` | | ceres | `A` | | aries | `q` | | conjunct | `<` |
| moon | `s` | | pallas | `S` | | taurus | `w` | | semisextile | `y` |
| mercury | `d` | | juno | `D` | | gemini | `e` | | decile | `>` |
| venus | `f` | | vesta | `F` | | cancer | `r` | | novile | `M` |
| earth | `g` | | lilith | `ç` | | leo | `t` | | semisquare | `=` |
| mars | `h` | | cupido | `L` | | virgo | `z` | | septile | `V` |
| jupiter | `j` | | chiron | `l` | | libra | `u` | | sextile | `x` |
| saturn | `k` | | nessus | `ò` | | scorpio | `i` | | quintile | `Y` |
| uranus | `ö` | | pholus | `ñ` | | sagittarius | `o` | | bilin | `-` |
| neptune | `ä` | | chariklo | `î` | | capricorn | `p` | | binovile | `;` |
| pluto | `#` | | eris | `È` | | aquarius | `ü` | | square | `c` |
| north node | `ß` | | chaos | `Ê` | | pisces | `+` | | biseptile | `N` |
| south node | `?` | | fortuna | `%` | | | | | tredecile | `X` |
| | | | | | | | | | trine | `Q` |
| | | | | | | | | | sesquiquadrate | `b` |
| | | | | | | | | | biquintile | `C` |
| | | | | | | | | | inconjunct | `n` |
| | | | | | | | | | treseptile | `B` |
| | | | | | | | | | tetranovile | `:` |
| | | | | | | | | | tao | `—` |
| | | | | | | | | | opposition | `m` |

Source: `src/planet.ts`, `src/chart.ts`, and `src/aspect.ts` at commit `1efdb55`, before their removal.

### Appendix D: Credit cost reference

At 1 credit per `/v1/chart` call, against the free tier's 500 credits per calendar month:

| Chart type | Credits | Charts per free month |
| --- | ---: | ---: |
| Basic | 1 | 500 |
| Transits | 2 | 250 |
| Synastry | 2 | 250 |
| Combined | 2 | 250 |
| Davison | 1 | 500 |
| CombinedTransits | 3 | 166 |
| DavisonTransits | 2 | 250 |
| `refreshTransits()` | 1 per distinct rounded instant | ≤ 1 per minute at the default 60 s granularity |

Rate limits are 60 requests per minute on the free tier and 300 on paid, enforced per customer across all their keys. `POST /v1/batch` counts as one request against that limiter regardless of how many sub-requests it carries, but bills the exact sum of their costs — which is why it is an extension point for bulk work rather than a per-chart optimization.

---

## Agent Discoverability

Load order for an agent working on this project:

1. `astrologyjs.nlspec.index.md` — always.
2. `astrologyjs.nlspec.md` — for any implementation work.
3. This file — only when a judgment call needs history, or when a reference table is needed.
4. `~/dev/morphemeris/docs/morphemeris-api.nlspec.md` §3–§8 — when touching the adapter, auth, or error mapping. It is authoritative for API behavior; this spec is not.

The contract's invariants are written as `-- Invariant:` comment trailers on pseudo-code blocks and are greppable as such. Anything phrased as an invariant is non-negotiable without a spec change; anything phrased as `-- Behavior:` describes expected operation and may be refined during implementation if the behavior is preserved.
