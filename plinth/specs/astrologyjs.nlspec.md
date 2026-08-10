# astrologyjs

`astrologyjs` is a TypeScript library that turns a person or event — a name, a moment, and a place — into an astrological chart: body positions, house cusps, angles, and the aspects between bodies. It is published on npm, has existed since 2016, and is currently broken; version 2.0.0 is a re-implementation on top of the [Morphemeris](https://morphemeris.com) ephemeris API. It is written for application developers building astrology software in JavaScript or TypeScript, and for the coding agents working alongside them. It depends on exactly one network service (Morphemeris, for ephemeris and house cusps) and computes everything else locally.

## Related files

- **Index:** [`astrologyjs.nlspec.index.md`](./astrologyjs.nlspec.index.md) — annotated TOC. Load first when orienting.
- **Rationale:** [`astrologyjs.nlspec.rationale.md`](./astrologyjs.nlspec.rationale.md) — design decisions, tradeoffs, appendices. Load on demand.
- **Audit:** [`astrologyjs.nlspec.audit.md`](./astrologyjs.nlspec.audit.md) — completeness audit against this contract.

---

- [astrologyjs](#astrologyjs)
  - [1. Overview and Goals](#1-overview-and-goals)
    - [1.1 Problem Statement](#11-problem-statement)
    - [1.2 Design Principles](#12-design-principles)
    - [1.3 Scope](#13-scope)
    - [1.4 Out of Scope](#14-out-of-scope)
    - [1.5 Examples and Counter-Examples](#15-examples-and-counter-examples)
    - [1.6 Versioning and Compatibility](#16-versioning-and-compatibility)
  - [2. Architecture](#2-architecture)
  - [3. Data Model](#3-data-model)
  - [4. Configuration and Authentication](#4-configuration-and-authentication)
  - [5. Person and Time Resolution](#5-person-and-time-resolution)
  - [6. Bodies](#6-bodies)
  - [7. Chart Construction](#7-chart-construction)
  - [8. Aspects](#8-aspects)
  - [9. Ephemeris Access](#9-ephemeris-access)
  - [10. Error Handling](#10-error-handling)
  - [11. Security](#11-security)
  - [12. Performance and Cost](#12-performance-and-cost)
  - [13. Verification](#13-verification)
  - [14. Definition of Done](#14-definition-of-done)

---

## 1. Overview and Goals

### 1.1 Problem Statement

`astrologyjs@1.3.1` computes charts by calling `http://www.morphemeris.com/ephemeris.php`, a free unauthenticated endpoint that no longer exists. The host now answers with an nginx 301 redirect; the library parses that HTML as JSON and throws `Unexpected token <`. Every chart operation fails, and the failure gives no indication that the cause is a dead service. Four issues report this, filed by six people between 2017 and 2025. The package continues to accumulate stars.

A second wall sits immediately behind the first: `Person.getLatLon()` and `Person.getTimezone()` call the Google Maps Geocoding and Time Zone APIs, which now require a billing-enabled project. A developer who works around the ephemeris failure hits this next.

Beneath both is a third problem that no issue reports because nobody got far enough to notice: 1.x was never finished to a quality bar its author would defend. Its orb calculation is wrong — `Aspect` reports the fractional part of the raw angular separation rather than the distance from exact aspect, so a trine at 118.5° reports an orb of `0.5` instead of `1.5`. Its `Person.create()` accepts a `Date` object and calls `.toISOString()` on it, so a birth time written as a local wall-clock string resolves against whatever zone the host process happens to be in. The same source code produces a different chart on a developer's laptop than in a UTC container, and neither run errors.

With this component, a developer supplies birth data in the form it actually arrives — a local date and time, a place — and receives a chart whose numbers are correct, whose assumptions are inspectable, and whose failures are loud.

### 1.2 Design Principles

**Never return a plausible wrong number.** The defining failure mode of a chart library is not the crash; it is the chart that renders, reads correctly, and is wrong. Where the library cannot compute a value honestly, it omits the value or raises an error. It does not substitute a default that a caller might mistake for a measurement. Every rule below is downstream of this one.

**No implicit timezone, ever.** A time enters the library either as an unambiguous instant or as a local wall-clock time paired with the place it belongs to. There is no code path in which the host's local zone, the process environment, or a bare `Date` object determines the moment a chart is cast for.

**Astrological doctrine belongs to the caller.** House system, mean versus true node, tropical versus sidereal, which ayanamsha, and what to do about an unknown birth time are matters on which practitioners disagree. The library provides defaults and never silently overrides an explicit choice — including under conditions where the chosen option is difficult to compute.

**Computation is local; the service supplies ephemeris.** Morphemeris provides body positions and house cusps. Aspects, midpoints, combined charts, derived bodies, and geographic and temporal midpoints are computed in-process. A chart, once fetched, is fully usable offline.

**Evolution is additive.** Bodies, aspects, house systems, and ayanamshas are data, not types. Adding one is a minor release. This is a hard structural requirement, not an aspiration — see [§6.2](#62-body-registry).

**Dependencies are small and isomorphic.** The library runs in Node and in browsers from one build. A dependency that works in only one of those, or that is large relative to the value it delivers, is rejected in favor of code this project owns and tests.

### 1.3 Scope

This spec covers:

- Configuration and API key resolution
- `Person` construction, including local-time-to-instant resolution and zone lookup
- Chart construction across all seven chart types
- The body registry and derived bodies
- Aspect calculation
- The Morphemeris adapter, request deduplication, and transport
- The error hierarchy
- Verification strategy and fixtures
- Documentation deliverables that gate the release

This spec does **not** cover:

- The Morphemeris API itself. Its contract is authoritative and lives in `~/dev/morphemeris/docs/morphemeris-api.nlspec.md`. Where this spec describes API behavior it is quoting, not defining.
- Chart interpretation, delineation, or any generated prose about a chart's meaning.
- Rendering of any kind.

### 1.4 Out of Scope

**Server-side computation endpoints.** Morphemeris exposes `/v1/synastry`, `/v1/composite`, `/v1/davison`, `/v1/progressed`, `/v1/returns`, `/v1/dignities`, and `/v1/lots`, several of which duplicate what this library computes locally. Excluded because routing the default path through them costs more credits for a result the library already derives — a synastry chart from two `/v1/chart` calls costs 2 credits against `/v1/synastry`'s 3 — and because local computation keeps a fetched chart usable offline. Extension point: expose them as explicitly-named optional methods (`Chart.createFromServer(…)` or similar) that sit alongside the local path rather than replacing it. Additive; no contract change.

**SVG chart rendering.** Producing a chart wheel as an image. Excluded because it doubles the surface area of a release that must be finishable, and because it is a rendering concern wearing a chart library's clothes. Extension point: a separate package consuming this library's output. The `wheel` crate in `morphatic/heliotrek` (Rust) has already solved the geometry, collision fan-out, and glyph problems and is the reference design; see the rationale file.

**The bodies Morphemeris does not carry.** `eris`, `chariklo`, `chaos`, `nessus`, and `cupido` appear in 1.x's hardcoded body list and are unavailable from the API. Excluded because the library must not declare a body it cannot fill. Extension point: the body registry ([§6.2](#62-body-registry)) is data; when Morphemeris carries these bodies, adding them is a table entry and a minor release. Tracked as a Morphemeris issue.

**Credibility instrumentation.** Attributing Morphemeris signups to traffic from this repository. Excluded as a deliberate non-goal, not a deferred task: it requires tracking infrastructure that does not exist on `morphemeris.com`, and the release is not measured on conversions. Extension point: none planned.

**Batched and bulk chart operations.** Morphemeris exposes `POST /v1/batch`, accepting up to 50 sub-requests. Excluded from 2.0.0 because it changes nothing about credits — cost is the sum of sub-requests with no discount — and credits, not requests, are this library's scarce resource. Its real benefit is that a batch counts as one unit against the per-minute rate limiter, which only binds above roughly 20 charts per minute; on the free tier that pace exhausts the monthly credit budget in about eight minutes. Against that, per-chart batching would add a second response shape and partial-failure semantics to the adapter, since a sub-request can fail inline while its siblings succeed and all are billed. Extension point: a bulk API (`Chart.createMany()`, date-range transits) is where the 50-sub-request limit and the single rate-limit unit genuinely pay, and `/v1/batch` is the mechanism it should use. Additive; no contract change.

**Backward compatibility with 1.x output.** 1.x is known-wrong in at least one computation and was never completed to a defensible quality bar. Excluded because preserving its behavior would preserve its bugs. There is no compatibility mode and no bug-for-bug fidelity requirement. The 1.x specs in `src/*.spec.ts` are a behavioral reference to port critically, **not** a regression baseline — an assertion in them is evidence of what 1.x did, not of what is correct.

### 1.5 Examples and Counter-Examples

**Examples (worth studying and borrowing from):**

- [`morphatic/morphemeris` — `mcp/`](https://github.com/morphatic/morphemeris) — the toolchain precedent: `type: module`, tsup, vitest, `files`-scoped publish. Match its build shape.
- [`morphatic/heliotrek` — `crates/wheel`](https://github.com/morphatic/heliotrek) — `glyphs.rs` curates a 30-glyph Unicode vocabulary and documents the "fonts that park astro glyphs on ASCII keys" problem. The glyph documentation in this project should agree with it rather than diverge.
- [`theriftlab/immanuel-python`](https://github.com/theriftlab/immanuel-python) — chart-centric JSON output with an explicitly configurable house system and ayanamsha. Good reference for how chart options are surfaced without bloating the return type.
- [Temporal `disambiguation` option](https://tc39.es/proposal-temporal/docs/timezone.html) — the standards-committee semantics for ambiguous and nonexistent local times. §5 deliberately mirrors `disambiguation: 'reject'`.

**Counter-examples (worth studying to avoid repeating):**

- `astrologyjs@1.3.1` itself — the primary counter-example. A hardcoded API key in source, a hardcoded body list, `Date`-shaped timezone ambiguity, an orb formula that computes the wrong quantity, and errors used as normal control flow. Each is addressed by a specific rule below.
- [`geo-tz`](https://github.com/evansiroky/node-geo-tz) — 73 MB unpacked and Node-only. Correct, and the wrong shape for a library with browser users. Rejected; see the rationale file.

### 1.6 Versioning and Compatibility

The package follows semantic versioning. Because "additive evolution" ([§1.2](#12-design-principles)) is a structural requirement rather than an aspiration, what counts as breaking is stated rather than left to judgment.

**Minor** — additive, safe for any consumer on the same major:

- A new body in the registry ([§6.2](#62-body-registry)), a new aspect type, a new house system, or a new ayanamsha
- A new optional field on `ChartOptions` or `AstrologyConfig`, with a default preserving current behavior
- A new **optional** field on `Planet`, `Aspect`, `Chart`, or `Person`
- A new `ChartWarning` code
- A new error class subclassing an existing one, provided the parent still matches what existing `catch` clauses expect
- A new method or named export

**Major** — requires a version bump and a migration note:

- Changing any default: house system, node, `unknownTime`, transit granularity, or the default body set
- Removing or renaming any field, method, export, error class, warning code, or body name
- Changing a computed value for identical input — a different orb formula, a different derivation, different rounding
- Narrowing an accepted input, or widening the circumstances under which an error is thrown
- Raising the minimum Node version, or changing the module format

```pseudo
-- Invariant:
-- - Adding a body MUST NOT require a type change, a new union member, or an edit
--   to any switch statement. If it does, §6.2's registry requirement has been
--   violated, and that is the bug — not the release process.
-- - A changed computed value is major EVEN WHEN THE NEW VALUE IS MORE CORRECT.
--   2.0.0 exists because 1.x's orb was wrong; a caller comparing stored charts
--   across versions needs the version boundary to tell them the numbers moved.

-- Behavior:
-- - Release automation is release-please, driven by Conventional Commits. `feat!`
--   or a `BREAKING CHANGE:` trailer produces the major bump. Versions are never
--   hand-edited in `package.json` or `CHANGELOG.md`.
```

The `ChartData` shape the adapter produces is **not** part of the public contract and may change in a minor release. That is why `Chart`'s data-taking constructor is private ([§2.2](#22-module-boundaries)).

---

## 2. Architecture

The library is a pipeline from caller intent to domain objects, with exactly one network boundary.

```text
   caller
     │
     ▼
┌─────────────────┐   key resolution, defaults
│  Configuration  │   (§4)
└────────┬────────┘
         │
         ▼
┌─────────────────┐   local wall-clock + place ──► instant
│     Person      │   zone resolution, ambiguity rejection (§5)
└────────┬────────┘
         │
         ▼
┌─────────────────┐   chart type ──► set of ChartRequests
│  Chart.create   │   (§7)
└────────┬────────┘
         │
         ▼
┌─────────────────┐   dedup cache ──► HTTP ──► Morphemeris /v1/chart
│ EphemerisClient │   auth, retry, error mapping (§9, §10)
└────────┬────────┘
         │  ══════ the only network boundary ══════
         ▼
┌─────────────────┐   wire shape ──► internal ChartData
│     Adapter     │   (§9.2)
└────────┬────────┘
         │
         ▼
┌─────────────────┐   south node from north node (§6.3)
│   Derivation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐   Planet, Aspect, Chart — pure, offline (§7, §8)
│  Domain model   │
└─────────────────┘
```

### 2.1 Layer responsibilities

| Layer | Owns | Never does |
| --- | --- | --- |
| Configuration | Key resolution order, global defaults | Network I/O |
| `Person` | Place, zone resolution, instant resolution | Ephemeris access |
| `Chart.create` | Chart-type decomposition into requests, frame consistency | HTTP, parsing |
| `EphemerisClient` | Auth headers, deduplication, transport, HTTP error mapping | Astrological interpretation of results |
| Adapter | Wire shape → internal shape, unit and name normalization | Network I/O, derivation |
| Derivation | Bodies computed from other bodies | Network I/O |
| Domain model | Aspects, midpoints, accessors | Any I/O whatsoever |

The domain model is pure and synchronous. Once a `Chart` exists, no method on it performs I/O, with the single exception of `refreshTransits()` ([§7.4](#74-refreshing-transits)), which is explicitly asynchronous and documented as billable.

### 2.2 Module boundaries

The public entry points are the module's named exports. `Chart`'s data-taking constructor is **not** public: the only supported way to obtain a `Chart` is `Chart.create()`. This keeps the internal `ChartData` shape out of the public contract so it can change without a major version.

---

## 3. Data Model

### 3.1 Configuration

```pseudo
RECORD AstrologyConfig:
    apiKey       : String?          -- Morphemeris key; see §4 for resolution order
    baseUrl      : String?          -- default "https://api.morphemeris.com/v1"
    fetch        : FetchFn?         -- injectable fetch, for tests and custom transports
    zoneResolver : ZoneResolverFn?  -- (lat, lon) => IANA zone name; see §5.2
    geocoder     : GeocoderFn?      -- (query) => GeoPoint; absent by default, see §5.4
    cache        : Boolean?         -- request deduplication, default true; see §9.3
```

```pseudo
RECORD ChartOptions:
    houseSystem : HouseSystemName   -- default "placidus"
    sidereal    : AyanamshaName?    -- absent = tropical
    node        : "true" | "mean"   -- default "true"
    bodies      : BodyName[]?       -- default: the full supported registry (§6.1)
    unknownTime : "omit" | "noon"   -- default "omit"; see §5.3
    transitGranularitySec : Number? -- default 60; 0 disables rounding. See §7.4
```

`ChartOptions` is the **frame** of a chart. Two charts are comparable only if their frames match; see [§7.2](#72-frame-consistency).

### 3.2 Geographic point

```pseudo
RECORD GeoPoint:
    lat : Number    -- degrees, positive north, [-90, 90]
    lng : Number    -- degrees, positive east, [-180, 180]

-- Invariant:
-- - Out-of-range values are rejected at construction, not clamped.
-- - `lng` is spelled `lng`, matching 1.x. `lon` is not accepted as an alias.
```

### 3.3 Person

```pseudo
RECORD Person:
    name          : String
    location      : GeoPoint
    instant       : String          -- resolved UTC ISO 8601, always present
    zone          : String          -- resolved IANA zone name, always present
    utcOffsetMin  : Number          -- offset applied, in minutes; inspectable
    timeKnown     : Boolean         -- false when constructed without a time (§5.3)

-- Invariant:
-- - `instant`, `zone`, and `utcOffsetMin` are always populated. A Person that
--   cannot resolve all three does not exist; construction throws instead.
-- - `utcOffsetMin` is recorded so a caller can audit what the library assumed.
--   This is the single most important auditable value in the library (§1.1).
```

### 3.4 Planet

```pseudo
RECORD Planet:
    name         : BodyName
    longitude    : Number     -- ecliptic longitude, degrees [0, 360)
    latitude     : Number     -- ecliptic latitude, degrees
    speed        : Number     -- degrees/day; negative = retrograde
    distance     : Number     -- AU
    declination  : Number     -- degrees
    outOfBounds  : Boolean    -- |declination| exceeds obliquity
    sign         : SignName   -- always computed locally from longitude (§6.4)
    signDegree   : Number     -- degrees within sign, [0, 30)
    derived      : Boolean    -- true when computed rather than fetched (§6.3)
    derivedFrom  : BodyName?  -- source body when `derived` is true

-- Behavior:
-- - `isRetrograde()` returns `speed < 0`.
-- - `isMajor()` returns whether the body is in the major set (Appendix A).
-- - There is no `symbol` property. Glyph mapping is documentation (§13.3).

-- Invariant:
-- - `speed` is required, not optional. A position that arrives without speed is
--   an adapter error (§9.2), because `isRetrograde()` silently returning false
--   for every body is the canonical silent-wrongness failure.
```

### 3.5 Aspect

```pseudo
RECORD Aspect:
    p1        : Planet
    p2        : Planet
    type      : AspectName    -- e.g. "trine"; see Appendix B
    angle     : Number        -- exact angle of the aspect type, degrees
    orb       : Number        -- |separation - angle|, degrees, >= 0
    applying  : Boolean
    major     : Boolean

-- Invariant:
-- - `orb` is the absolute angular distance from exactness. It is NOT the
--   fractional part of the separation. See §8.2.
-- - An Aspect instance exists only when the pair is genuinely in aspect.
--   "No aspect" is an absent value, never an exception (§8.4).
```

### 3.6 Chart

```pseudo
RECORD Chart:
    name       : String
    type       : ChartType
    options    : ChartOptions      -- the frame this chart was computed in
    p1         : Person
    p2         : Person?
    planets    : Planet[]          -- primary ring
    transits   : Planet[]?         -- secondary ring, when the type has one
    aspects    : Aspect[]
    houses     : Number[12]?       -- absent when time is unknown and mode is "omit"
    ascendant  : Number?
    midheaven  : Number?
    vertex     : Number?
    warnings   : ChartWarning[]    -- always present, possibly empty (§10.4)

-- Behavior:
-- - `options` is readable so a caller holding two charts can tell whether they
--   are comparable without having tracked the arguments themselves.
-- - Accessors return defensive copies; mutating a returned array does not
--   mutate the chart.

-- Invariant:
-- - `houses`, `ascendant`, `midheaven`, and `vertex` are present or absent
--   together. There is no state in which some angles resolved and others did not.
```

`ChartType` retains the 1.x enumeration: `Basic`, `Transits`, `Synastry`, `Combined`, `Davison`, `CombinedTransits`, `DavisonTransits`.

The 1.x accessors `innerPlanets` and `outerPlanets` are removed. They named chart-wheel rings, not orbital classes, and `innerPlanets` returned `[]` for single-person charts while `outerPlanets` returned everything — inverted relative to every reader's expectation. They are replaced by `planets` and `transits`.

---

## 4. Configuration and Authentication

### 4.1 Key resolution

```pseudo
FUNCTION resolveApiKey(callOption: String?) -> String:
    IF callOption is present:        RETURN callOption
    IF moduleConfig.apiKey is present: RETURN moduleConfig.apiKey
    IF running under Node AND env.MORPHEMERIS_API_KEY is present:
        RETURN env.MORPHEMERIS_API_KEY
    THROW ConfigurationError

-- Behavior:
-- - Precedence is call option, then configure(), then environment.
-- - The environment is read only under Node. Browser bundles never reference
--   `process.env`, so bundlers cannot inline a key into client-side output.
-- - ConfigurationError is thrown BEFORE any network call, and its message names
--   all three configuration paths and links to key creation.

-- Invariant:
-- - The library contains no default, fallback, embedded, or shared API key.
--   A key is supplied by the caller or the operation fails.
```

### 4.2 Key transmission

Keys are sent as `Authorization: Bearer <key>`. The `X-API-Key` header is not used.

### 4.3 Browser use

The library functions in browsers. A key present in a browser bundle is public — it can be read out of the bundle by anyone. The library does not pretend otherwise:

- Documentation states this plainly and recommends a server-side proxy for anything beyond hobby use.
- Documentation directs browser users to create a **separate** key with allowed origins configured and `require_origin` set, which is the Morphemeris feature that makes origin restriction meaningful for a public key (`morphemeris-api.nlspec.md` §5.4).
- The library does not attempt to obfuscate, encrypt, or otherwise conceal the key, because none of those measures work and all of them imply a protection that does not exist.

---

## 5. Person and Time Resolution

This section owns the failure mode ranked most severe ([§1.1](#11-problem-statement)). Its rules are the strictest in the spec.

### 5.1 Accepted time inputs

```pseudo
FUNCTION Person.create(name, timeInput, place, options?) -> Person:

    -- timeInput is exactly one of:
    --   { utc: "1980-05-15T18:30:00Z" }        an unambiguous instant
    --   { local: "1980-05-15T14:30" }          wall-clock at `place`
    --   { local: "...", offsetMin: -240 }      wall-clock + explicit offset
    --   { unknown: true }                       no time available (§5.3)

-- Behavior:
-- - A bare `Date` object is rejected. A bare string is rejected. Both are
--   accepted by 1.x and both silently import the host's local zone.
-- - `{ local }` without a `place` is rejected: a wall-clock time with no place
--   is not a moment.
-- - When `offsetMin` is supplied it is authoritative; no zone lookup occurs and
--   no ambiguity can arise. This is the escape hatch for callers who already
--   know the offset, including those resolving an ambiguity from §5.5.

-- Invariant:
-- - There is no input form whose meaning depends on the host's local timezone,
--   the process environment, or the machine's clock.
```

### 5.2 Zone resolution

```pseudo
FUNCTION resolveZone(place: GeoPoint, config) -> String:
    IF person was constructed with an explicit `zone`: RETURN it
    IF config.zoneResolver is present:                 RETURN config.zoneResolver(place)
    RETURN builtinResolver(place)          -- tz-lookup

-- Behavior:
-- - Precedence: explicit zone, then caller-supplied resolver, then built-in.
-- - The built-in resolver is `tz-lookup` (152 KB, zero dependencies,
--   isomorphic). It is a compressed approximation accurate to a few kilometers.
-- - The resolved zone is recorded on the Person as `zone`, so a caller near a
--   zone border can detect a wrong answer and override it.

-- Invariant:
-- - A failure to resolve a zone throws. It never falls back to UTC.
```

### 5.3 Unknown birth time

When `{ unknown: true }` is supplied, behavior is governed by `ChartOptions.unknownTime`:

| Mode | Instant used | Houses, ASC, MC, vertex | `Person.timeKnown` |
| --- | --- | --- | --- |
| `"omit"` (default) | 12:00 local at `place` | **Omitted from the chart** | `false` |
| `"noon"` | 12:00 local at `place` | Computed and returned | `false` |

```pseudo
-- Behavior:
-- - Both modes compute body positions, which move little over a day. The Moon
--   is the exception, moving up to ~13°; a warning records this in both modes.
-- - "omit" is the default because a caller who never read the documentation
--   receives missing data rather than an arbitrary ascendant. An ascendant
--   sweeps the entire zodiac in 24 hours; a noon value is not an approximation
--   of the true one, it is unrelated to it.
-- - "noon" exists because assuming noon is common practice and the caller, not
--   the library, is entitled to that choice (§1.2).

-- Invariant:
-- - `timeKnown` is false in both modes. The mode changes what is returned,
--   never whether the chart records that the time was unknown.
```

### 5.4 Geocoding

Address-to-coordinate lookup is **optional and absent by default**. `Person.create()` with an explicit `GeoPoint` requires no configuration and no network access beyond the ephemeris call.

```pseudo
TYPE GeocoderFn = (query: String) -> Promise<GeoPoint>

-- Behavior:
-- - When `place` is a string and no geocoder is configured, construction throws
--   ConfigurationError naming the geocoder option. It does not silently fail
--   or attempt a built-in service.
-- - The library ships no default geocoder and has no Google Maps dependency.

-- Invariant:
-- - No credential for any third-party service appears in this repository.
```

### 5.5 Ambiguous and nonexistent local times

```pseudo
FUNCTION toInstant(local: WallClock, zone: String) -> String:
    LET candidates = offsetsFor(local, zone)   -- via Intl.DateTimeFormat round-trip

    IF candidates.length == 2:  THROW AmbiguousTimeError(candidates)
    IF candidates.length == 0:  THROW NonexistentTimeError(gapStart, gapEnd)
    RETURN applyOffset(local, candidates[0])

-- Behavior:
-- - Two candidates: the wall-clock time occurs twice (a DST fall-back hour).
--   The error carries both candidate instants and both offsets.
-- - Zero candidates: the wall-clock time never occurred (a spring-forward gap).
--   The error carries the gap boundaries.
-- - In both cases the caller re-calls with `offsetMin` to state which they mean.
-- - Conversion uses `Intl.DateTimeFormat` with `formatToParts` against the
--   platform's own tzdb. No timezone library is bundled.

-- Invariant:
-- - The library NEVER resolves an ambiguity by rule, preference, or default.
--   Silently choosing one of two instants an hour apart is the precise shape of
--   the failure this library exists to stop producing.
```

Correct handling of pre-standard-time dates (local mean time), historical war time, non-hour offsets (`Asia/Kolkata` at +05:30, `Asia/Kathmandu` at +05:45), southern-hemisphere transitions, and `Australia/Lord_Howe`'s 30-minute DST shift is required and verified by fixture ([§13.2](#132-fixtures)).

---

## 6. Bodies

### 6.1 Supported bodies

| Library name | Morphemeris `BodyId` | Notes |
| --- | --- | --- |
| `sun` … `pluto` | `SUN` … `PLUTO` | The ten classical bodies |
| `north node` | `TRUE_NODE` / `MEAN_NODE` | Selected by `ChartOptions.node` |
| `south node` | — | **Derived** (§6.3) |
| `lilith` | `MEAN_APOGEE` | Black Moon Lilith is the lunar apogee |
| `osculating lilith` | `OSCULATING_APOGEE` | Opt-in |
| `chiron`, `pholus` | `CHIRON`, `PHOLUS` | |
| `ceres`, `pallas`, `juno`, `vesta` | `CERES`, `PALLAS`, `JUNO`, `VESTA` | |

`eris`, `chariklo`, `chaos`, `nessus`, and `cupido` appear in 1.x and are **not supported**; see [§1.4](#14-out-of-scope). `cupido` is additionally ambiguous — in Uranian astrology it denotes a hypothetical planet with no ephemeris body, while asteroid 763 Cupido is a distinct real object, and 1.x does not record which it meant.

### 6.2 Body registry

```pseudo
-- Invariant:
-- - The mapping in §6.1 is a data table consulted at runtime, not a union type,
--   a switch statement, or a hardcoded object literal like 1.x's
--   `calculateCombinedPlanets`. Adding a body is a table entry.
-- - Requesting a body absent from the registry throws UnsupportedBodyError
--   naming the body. It never silently returns a chart with fewer bodies than
--   were asked for.
-- - The adapter verifies that every requested, non-derived body appears in the
--   response. A missing body is an adapter error (§9.2), never a silent omission.
```

### 6.3 Derived bodies

```pseudo
FUNCTION deriveSouthNode(northNode: Planet) -> Planet:
    RETURN Planet {
        name: "south node",
        longitude: (northNode.longitude + 180) MOD 360,
        latitude: -northNode.latitude,
        speed: northNode.speed,
        distance: northNode.distance,
        declination: -northNode.declination,
        derived: true,
        derivedFrom: "north node",
        ...
    }

-- Behavior:
-- - Morphemeris returns no south node; it is exact by definition, so deriving it
--   is preferable to a second request.
-- - `derived` and `derivedFrom` are set so downstream logic can identify the
--   relationship. §8.3 depends on this.
```

### 6.4 Sign assignment

```pseudo
-- Behavior:
-- - `sign` and `signDegree` are ALWAYS computed locally from `longitude`,
--   even though /v1/chart returns them.
-- - Rationale: the API returns them for tropical output only. Computing locally
--   yields one code path that is correct in both tropical and sidereal frames.
```

---

## 7. Chart Construction

### 7.1 Chart types and requests

| `ChartType` | Requests | Credits | Second ring |
| --- | --- | --- | --- |
| `Basic` | p1 | 1 | — |
| `Transits` | p1, now@p1 | 2 | transits |
| `Synastry` | p1, p2 | 2 | p2 |
| `Combined` | p1, p2 → midpoints | 2 | — |
| `Davison` | midpoint(time, place) | 1 | — |
| `CombinedTransits` | p1, p2, now@p1 | 3 | transits |
| `DavisonTransits` | midpoint, now@midpoint | 2 | transits |

Combined charts take the shorter-arc midpoint of each body's longitude, the arithmetic mean of latitude and speed, and the shorter-arc midpoint of each house cusp and angle. Davison charts request a single chart for the temporal midpoint at the geographic midpoint of the two people.

```pseudo
-- Behavior:
-- - Requests within one chart are issued concurrently.
-- - `Chart.create` requires p2 for Synastry, Combined, CombinedTransits,
--   Davison, and DavisonTransits, and throws ValidationError if absent.

-- Invariant:
-- - The shorter-arc midpoint of two longitudes exactly 180° apart is undefined.
--   The library resolves it to the midpoint on the ascending arc from the lower
--   longitude and records a warning; it does not throw and does not pick silently.
```

### 7.2 Frame consistency

```pseudo
-- Invariant:
-- - All requests composing a single Chart use the same ChartOptions. A chart
--   whose two halves were computed under different house systems, different
--   ayanamshas, or different node choices cannot be constructed.
-- - The resulting frame is recorded on `Chart.options`, so two Chart objects can
--   be compared for comparability without the caller having tracked arguments.
```

### 7.3 Body positions

Positions arrive per request and are adapted, derived, and assembled into `planets` and, where the chart type has a second ring, `transits`.

### 7.4 Refreshing transits

```pseudo
ASYNC FUNCTION Chart.refreshTransits(at?: Instant) -> void

-- Behavior:
-- - Throws ValidationError for chart types with no transit ring
--   (Basic, Synastry, Combined, Davison).
-- - Defaults to the current instant when `at` is omitted.
-- - The instant is FLOORED to ChartOptions.transitGranularitySec (default 60)
--   before the request is built, so it becomes a stable cache key.
-- - A cache hit consumes no credit. A miss consumes one.

-- Invariant:
-- - Rounding is bounded and disclosed, never silent. At 60 seconds the worst
--   case is the Moon, which moves ~0.009°/minute — about 0.5 arcminutes, half of
--   the last digit any chart displays. Every other body is slower.
-- - `transitGranularitySec: 0` disables rounding and restores exact instants.
--   The credit consequence is documented adjacent to the option.
-- - Without rounding, the default instant carries millisecond precision, every
--   call is a distinct cache key, and a caller polling at 1 fps consumes the
--   entire 500-credit monthly free tier in about eight minutes. Rounding is what
--   makes the deduplication cache (§9.3) work for the case that motivated it.
```

---

## 8. Aspects

### 8.1 Aspect catalogue

Twenty-one aspect types with their exact angles and orbs, unchanged from 1.x, are listed in Appendix B of the rationale file. The catalogue is data, per [§1.2](#12-design-principles).

### 8.2 Orb calculation

```pseudo
FUNCTION separation(p1, p2) -> Number:
    LET d = ABS(p1.longitude - p2.longitude)
    RETURN d > 180 ? 360 - d : d          -- always [0, 180]

FUNCTION findAspect(p1, p2) -> Aspect?:
    LET sep = separation(p1, p2)
    LET best = the catalogue entry minimizing ABS(sep - entry.angle)
               among entries where ABS(sep - entry.angle) <= entry.orb
    IF best is absent: RETURN null
    RETURN Aspect { type: best.name, angle: best.angle,
                    orb: ABS(sep - best.angle), ... }

-- Behavior:
-- - `orb` is the angular distance from exactness, in degrees.
-- - When more than one catalogue entry is in range, the closest wins. 1.x took
--   the last match in iteration order, which is correct only by accident of the
--   current orb values.

-- Invariant:
-- - `orb` is NEVER the fractional part of the separation. 1.x computed
--   `Number((ng % 1).toFixed(6))`, reporting 0.5 for a trine at 118.5° whose
--   true orb is 1.5. Every non-integer separation in 1.x reported a wrong orb.
```

### 8.3 Excluded pairs

```pseudo
-- Invariant:
-- - No Aspect is produced between a derived body and the body it was derived
--   from. A derived south node is exactly 180° from its north node BY
--   CONSTRUCTION, so an unfiltered engine reports a perfect opposition with
--   orb 0.000000 in every chart ever produced — an artifact of the derivation,
--   not a feature of the sky, sorted to the top of every aspect list.
-- - Self-pairs are excluded. Each unordered pair is considered exactly once.
```

For single-ring charts, aspects are computed between all pairs within `planets`. For two-ring charts, aspects are computed between `planets` and `transits` — cross-ring only, matching 1.x.

### 8.4 Absence of aspect is not an error

```pseudo
-- Invariant:
-- - `findAspect` returns null when no aspect exists. It does not throw.
-- - 1.x threw from Aspect's constructor for the ordinary case of two planets not
--   in aspect — which is most pairs in every chart — and Chart.calculateAspects
--   caught and discarded it unless a private `_debug` flag was set. A genuine
--   adapter fault and "these two are not in aspect" were indistinguishable, and
--   both were silent.
-- - No blanket try/catch surrounds aspect construction.
```

---

## 9. Ephemeris Access

### 9.1 Requests

All ephemeris access is a single `POST /v1/chart` per required moment. `/v1/positions` and `/v1/houses` are not used separately: `/v1/chart` returns both for the same one credit.

Requests composing one chart are issued **concurrently as individual calls**, not via `POST /v1/batch`. Batch sub-requests execute sequentially server-side, so a 3-request chart pays roughly 10 ms more in median latency, and batching changes no credit cost ([§1.4](#14-out-of-scope)). The tradeoff reverses for bulk operations, which are out of scope for 2.0.0.

### 9.2 Adapter

```pseudo
FUNCTION adapt(response: MorphemerisChartData, requested: BodyName[]) -> ChartData

-- Behavior:
-- - Maps `longitude`/`latitude`/`speed`/`distance`/`declination`/`out_of_bounds`
--   onto the Planet record, and `cusps`/`ascendant`/`midheaven`/`vertex` onto the
--   chart's angles.
-- - Passes `HouseCusps.warnings` through to `Chart.warnings` (§10.4).

-- Invariant:
-- - Every requested non-derived body MUST appear in the response. A missing body
--   throws AdapterError naming it.
-- - `speed` MUST be present on every position. A position without speed throws
--   AdapterError. Accepting it would make every body report `isRetrograde()`
--   false and invert every applying/separating determination, with nothing
--   thrown and a chart that renders (§1.1).
-- - Longitudes are validated to [0, 360) and latitudes to [-90, 90] before use.
--   A value outside range is an AdapterError, not a clamp.
```

### 9.3 Request deduplication

```pseudo
-- Behavior:
-- - Identical requests resolve from an in-process map instead of re-billing.
-- - The cache key is the full request tuple: instant, lat, lng, house system,
--   sidereal setting, node choice, and the sorted body list.
-- - Entries never expire. Ephemeris data for a fixed instant does not change,
--   so a hit can never be stale.
-- - The cache is per-process and in-memory. Nothing is persisted.
-- - Disabled by `AstrologyConfig.cache = false`.

-- Invariant:
-- - The cache is keyed on the complete request. A partial key that collided
--   across house systems or ayanamshas would return a chart in the wrong frame.
-- - The cache stores the IN-FLIGHT PROMISE, not the resolved value, and stores
--   it before the request is issued. Two concurrent misses on the same key
--   therefore share one request and one credit. Storing only resolved values
--   would double-bill the ordinary cases: a Synastry chart for two people who
--   share a birthplace and instant, or any caller building charts in a
--   Promise.all. Deduplication that only works sequentially is not
--   deduplication for an async API.
-- - A rejected in-flight promise is EVICTED from the cache, so a failed request
--   is retryable rather than a permanently cached failure.
```

### 9.4 Retry

```pseudo
-- Behavior:
-- - 429 and 503 are retried with exponential backoff: base 1s, max 3 attempts,
--   honouring `Retry-After` when present.
-- - 4xx other than 429 are never retried; they are deterministic.
-- - A request that exhausts retries throws the mapped error (§10.2).
```

---

## 10. Error Handling

### 10.1 Hierarchy

All errors extend `AstrologyError`, which carries `code` and, when the failure originated upstream, the Morphemeris `code`, `message`, and `param` verbatim.

| Class | Thrown when | Retryable |
| --- | --- | --- |
| `ConfigurationError` | No API key; string place with no geocoder | No |
| `ValidationError` | Bad coordinates, missing p2, unsupported chart operation | No |
| `AmbiguousTimeError` | Local time occurs twice; carries both candidates | No |
| `NonexistentTimeError` | Local time never occurred; carries the gap | No |
| `UnsupportedBodyError` | Body not in the registry; names the body | No |
| `AuthError` | 401 `invalid_api_key` | No |
| `OriginError` | 403 `origin_not_allowed` / `origin_required` | No |
| `InsufficientCreditsError` | 402 `insufficient_credits` | No |
| `RateLimitError` | 429; carries `retryAfterSec` | Yes |
| `UpstreamError` | 400/404/500 from the API | No |
| `ServiceUnavailableError` | 503 `data_unavailable` | Yes |
| `AdapterError` | Response violates §9.2 invariants | No |
| `TransportError` | Network failure, timeout, unparseable body | Yes |

```pseudo
-- Invariant:
-- - InsufficientCreditsError and RateLimitError are distinct classes. They are
--   different situations for an application: one needs a purchase, the other
--   needs a wait.
-- - A non-JSON response body produces TransportError with the first bytes of the
--   body in the message. This is the exact 1.x failure — an nginx redirect page
--   parsed as JSON — and it must name what happened rather than surface
--   "Unexpected token <".
```

### 10.2 Secrets in errors

```pseudo
-- Invariant:
-- - No error message, error property, log line, or stack trace contains an API
--   key, in whole or in part. Request URLs and headers are never included in
--   error output. This is verified by test (§13.1).
```

### 10.3 No silent failure

```pseudo
-- Invariant:
-- - No catch block in the library discards an error. Every catch either handles
--   the error meaningfully or rethrows it wrapped in a typed class.
```

### 10.4 Warnings

Conditions that are noteworthy but not failures travel with the result rather than being raised:

```pseudo
RECORD ChartWarning:
    code    : String
    message : String
    detail  : Object?
```

| Code | Meaning |
| --- | --- |
| `high_latitude_houses` | Passed through from the API's `HouseCusps.warnings` |
| `unknown_time` | Time was not known; Moon uncertainty up to ~13° |
| `noon_assumed` | `unknownTime: "noon"` produced the angles |
| `antipodal_midpoint` | A combined-chart midpoint was exactly 180° (§7.1) |
| `zone_resolved_by_default` | Zone came from the built-in resolver, not the caller |

```pseudo
-- Invariant:
-- - The library never substitutes a different house system for the one
--   requested. If Placidus is undefined at the given latitude, the API's warning
--   is surfaced and the API's own result is returned unmodified. Choosing a
--   house system is the caller's doctrinal decision (§1.2).
```

---

## 11. Security

```pseudo
-- Invariant:
-- - No credential of any kind is committed to this repository. 1.x shipped a
--   live Google Maps API key hardcoded at src/person.ts:61, published in every
--   dist bundle on npm and present throughout git history.
-- - No default, embedded, or shared Morphemeris key exists in the package. A
--   shared key would be extracted within a day and would recreate the exact
--   failure this release exists to fix: a free service dependent on one
--   person's goodwill, which eventually dies and strands everyone.
-- - Keys are transmitted only over HTTPS, only to the configured base URL, and
--   only in the Authorization header. They never appear in a query string.
-- - The Node-only environment read (§4.1) is written so bundlers cannot inline
--   `process.env` into browser output.
-- - CI runs secret scanning. The `morphemeris_live_` prefix is designed for it.
```

---

## 12. Performance and Cost

Credits, not milliseconds, are this library's scarce resource. Latency is dominated by the network and is Morphemeris's concern.

| Operation | Target | Measurement |
| --- | --- | --- |
| Credits per chart | Exactly the count in §7.1 | Test asserts request count per chart type |
| Repeat identical chart, one process | 0 additional credits | Test asserts cache hit |
| Concurrent identical charts, one process | 1 request total | Test races two `create()` calls on one key |
| `refreshTransits()` polled at 1 fps | ≤ 1 credit/minute at default granularity | Test asserts request count over a simulated minute |
| Aspect calculation, 20 bodies | < 5 ms | Local benchmark, no I/O |
| Local time → instant | < 1 ms | Local benchmark |
| Package install size | < 500 KB unpacked, excluding `tz-lookup` | `npm pack` in CI |

```pseudo
-- Invariant:
-- - No operation issues more requests than §7.1 specifies. A regression here is
--   a regression in the caller's bill, which is why it is asserted rather than
--   measured.
```

---

## 13. Verification

### 13.1 Test strategy

- **Unit tests** cover the domain model — aspects, midpoints, sign assignment, derivation — with no network access.
- **Adapter tests** run against recorded Morphemeris responses covering the real wire format, including the high-latitude warning case and a sidereal response.
- **Time resolution tests** are the largest suite, matching the risk in §5.
- **Live API tests** read `MORPHEMERIS_API_KEY` from the environment and skip cleanly when it is absent. They never run in CI on pull requests.
- A test asserts that no error thrown by any code path contains a configured key.

The 1.x specs in `src/*.spec.ts` are ported **critically**: each assertion is evaluated against correct behavior before being carried over. An assertion encoding 1.x behavior that contradicts this spec is discarded and the discrepancy noted.

### 13.2 Fixtures

Golden fixtures are hand-verified against [Astrodienst](https://www.astro.com) and committed. The set covers at minimum:

- An ordinary northern-hemisphere birth with a known time
- A high-latitude birth where Placidus is undefined
- A DST-ambiguous birth time (must throw)
- A spring-forward nonexistent birth time (must throw)
- A pre-standard-time birth resolving against local mean time
- A southern-hemisphere birth with a mid-year DST transition
- A half-hour-offset zone (`Asia/Kolkata`) and a 45-minute zone (`Asia/Kathmandu`)
- An unknown-time birth in both `omit` and `noon` modes
- A sidereal chart with an explicit ayanamsha

Fixtures are independent of Morphemeris, so they detect an adapter error or an upstream regression. A snapshot of the library's own output could not — it would have preserved the 1.x orb bug indefinitely.

### 13.3 Documentation deliverables

| Deliverable | Gates 2.0.0 |
| --- | --- |
| Rewritten `README.md` — honest history, quickstart, key setup, free-tier explanation, browser caveat | **Yes** |
| Glyph mapping tables — Kairon Semiserif ASCII map and Unicode codepoints | **Yes** |
| Generated API reference (TypeDoc or equivalent) | **Yes** |
| Migration guide, 1.x → 2.x | No — lands with the issue replies |

The README must describe Morphemeris's maturity accurately and must not overstate it. The glyph tables preserve the Kairon ASCII mapping that 1.x's `Planet.symbol` encoded — Kairon Semiserif ships only inside a Mac application and publishes no key, making that table a genuinely scarce artifact — and should agree with the glyph vocabulary in `heliotrek`'s `wheel` crate.

---

## 14. Definition of Done

### Correctness

- [ ] `Aspect.orb` returns the angular distance from exactness; a trine at 118.5° reports `1.5`
- [ ] The closest in-range aspect type wins when several are in range
- [ ] No aspect is produced between a derived body and its source body
- [ ] "No aspect" returns an absent value; no code path throws for it
- [ ] `sign` and `signDegree` are computed locally and are correct in both tropical and sidereal frames
- [ ] South node derivation is exact: 180° opposed, latitude and declination negated
- [ ] Every golden fixture in §13.2 matches Astrodienst within tolerance

### Time

- [ ] A bare `Date` or bare string is rejected by `Person.create()`
- [ ] An ambiguous local time throws `AmbiguousTimeError` carrying both candidate instants
- [ ] A nonexistent local time throws `NonexistentTimeError` carrying the gap
- [ ] `offsetMin` bypasses zone lookup entirely and cannot raise either error
- [ ] `Person.zone` and `Person.utcOffsetMin` are populated and inspectable on every Person
- [ ] Pre-standard-time, war-time, southern-hemisphere, 30-minute, and 45-minute zone fixtures pass
- [ ] No code path consults the host's local timezone

### Contract

- [ ] Every chart type in §7.1 verified against the live API
- [ ] Request count per chart type asserted by test
- [ ] A repeated identical chart in one process issues zero additional requests
- [ ] Two *concurrent* identical charts in one process issue one request, not two
- [ ] A failed in-flight request is evicted from the cache and is retryable
- [ ] `refreshTransits()` floors its instant to `transitGranularitySec`, and polling at 1 fps costs at most one credit per minute
- [ ] Adding a body requires no type change, union member, or switch edit (§1.6)
- [ ] Every requested body appears in the result or an error names the missing one
- [ ] A position lacking `speed` throws `AdapterError`
- [ ] `Chart.options` reports the frame the chart was computed in
- [ ] `Chart` cannot be constructed from raw data through the public API
- [ ] Adding a body requires only a registry entry

### Safety

- [ ] No credential anywhere in the repository; the 1.x Google key is gone from the working tree
- [ ] No error, log, or stack trace contains an API key
- [ ] A missing key throws before any network call
- [ ] A non-JSON response produces `TransportError` naming the problem, never `Unexpected token <`
- [ ] `InsufficientCreditsError` and `RateLimitError` are distinct classes
- [ ] No catch block discards an error

### Release

- [ ] ESM-only; `type: module`, no `require` condition in exports
- [ ] Full suite passes; `pnpm test` green
- [ ] README, glyph tables, and generated API reference published
- [ ] `2.0.0` published to npm via release-please
- [ ] `1.3.2` published, whose error states both that the backend is gone and that 1.x results were unreliable

### Integration

- [ ] A developer with only a Morphemeris API key and a lat/lng produces a correct natal chart in one call, with no other configuration, in both Node and a browser bundle
- [ ] The four open issues (#3, #4, #5, #7) each receive an individual reply and are closed

---

There are no `[OPEN]` items. Every decision this spec depends on has been made.
