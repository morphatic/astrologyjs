# astrologyjs

An astrological charting library for JavaScript and TypeScript. Give it a name, a moment, and a
place; get back body positions, house cusps, angles, and the aspects between them.

```ts
import { configure, createPerson, createChart } from 'astrologyjs';

configure({ apiKey: process.env.MORPHEMERIS_API_KEY });

const person = await createPerson(
  'Subject',
  { local: '1990-06-15T14:30' }, // local wall clock at the place
  { lat: 51.5074, lng: -0.1278 }, // London
);

const chart = await createChart('Subject — natal', person);

for (const planet of chart.planets) {
  console.log(`${planet.name}: ${planet.signDegree.toFixed(2)}° ${planet.sign}`);
}
```

## If you are here from an issue

You were right. Versions up to `1.3.1` computed charts by calling a free ephemeris service that no
longer exists, so every chart operation fails — usually with `Unexpected token <`, which is the
library trying to parse an HTTP redirect page as JSON. Issues reporting this have been open since
2017.

The short version of what happened: this was a part-time project that outran its author's bandwidth,
and the backend went away. There is a real, maintained service behind it now.

**Do not install `1.x`.** Beyond the dead backend, some of its arithmetic was wrong even while the
service was alive. The reported `orb` of an aspect was the fractional part of the angular separation
rather than the distance from exactness, so a trine at 118.5° reported `0.5` instead of `1.5` — an
aspect looked three times tighter than it was. And `Person.create()` accepted a `Date`, which meant
the host process's timezone silently decided what moment the chart was cast for: the same code
produced different charts on a laptop and in a UTC container, with no error either time.

If you stored charts produced by 1.x, treat their orbs as unreliable and re-derive them.

## Install

```sh
npm install astrologyjs
```

**ESM only.** `2.x` ships no CommonJS build. Node 20.19+ or 22.12+ (both support `require(esm)`),
or any modern browser — read the [browser note](#using-this-in-a-browser) first.

## Getting an API key

`astrologyjs` needs an ephemeris. It uses [Morphemeris](https://morphemeris.com), which wraps the
Swiss Ephemeris behind a REST API. **You bring your own key** — the library ships no shared key and
runs no free proxy, because a shared free endpoint is exactly the arrangement that broke last time
and stranded everyone using it.

1. Create an account at [morphemeris.com](https://morphemeris.com).
2. Generate an API key.
3. Give it to the library, by any of:

```ts
// Explicitly, per call — wins over everything else
await createChart('natal', person, { apiKey: 'mk_live_…' });

// Once, for the process
configure({ apiKey: 'mk_live_…' });

// Or set MORPHEMERIS_API_KEY in the environment (Node only; never read in a browser build)
```

**Disclosure:** Morphemeris is run by this library's maintainer. It is a young service — newer than
the library it now backs — so judge it on that basis rather than on a track record it does not yet
have. It is not a hobby endpoint on shared hosting, which is what the original was, and it does not
depend on anyone's spare weekend to stay up. That is the honest extent of the claim.

### What it costs

The free tier is **500 credits per calendar month**, replenished on the 1st, with no payment method
required. One `/v1/chart` request is one credit, and a chart costs as many credits as it needs
requests:

| Chart type | Credits | Charts per free month |
| --- | ---: | ---: |
| Basic (natal) | 1 | 500 |
| Davison | 1 | 500 |
| Transits | 2 | 250 |
| Synastry | 2 | 250 |
| Combined | 2 | 250 |
| DavisonTransits | 2 | 250 |
| CombinedTransits | 3 | 166 |

Identical requests inside one process are deduplicated, so building the same chart twice — or a
synastry chart for two people born at the same instant in the same place — costs one credit, not
two.

`refreshTransits()` is the one thing that can surprise you: it is cheap to call in a loop, and at
millisecond precision an animated transit clock would drain the free tier in minutes. Transit
instants are therefore rounded to 60 seconds by default, which costs at most half an arcminute on
the Moon — below the resolution a chart displays. Set `transitGranularitySec: 0` to disable it, and
watch your balance.

## What you get

```ts
const chart = await createChart('natal', person, {
  houseSystem: 'placidus', // default
  sidereal: 'lahiri', // omit for tropical
  node: 'true', // or 'mean'
});

chart.planets; // 20 bodies: Sun–Pluto, nodes, Lilith, Chiron, Pholus, Ceres, Pallas, Juno, Vesta
chart.houses; // 12 cusps
chart.ascendant;
chart.midheaven;
chart.aspects; // every pair in aspect, with orb measured from exactness
chart.warnings; // anything the library assumed on your behalf
```

Aspects, midpoints, composites, and Davison charts are computed locally, so a chart is fully usable
offline once fetched. The service supplies ephemeris and house cusps; nothing else.

### Times, and why the API looks like this

There is deliberately no way to pass a `Date` or a bare date-time string. Both carry an implicit
zone, and every chart cast from one is a coin flip. A moment enters the library in exactly one of
three forms:

```ts
{ utc: '1815-12-10T19:00:00Z' }                     // already unambiguous
{ local: '1815-12-10T19:00' }                       // wall clock at the place
{ date: '1815-12-10', timeUnknown: true }           // the date is known, the time is not
```

The zone comes from the coordinates, and the historical offset from the platform's own timezone
database — so wartime DST, half-hour and quarter-hour zones, and pre-standard-time local mean time
all resolve correctly. Every assumption is readable afterwards on the `Person`: `zone`,
`utcOffsetMinutes`, `timeKnown`, and `zoneFromDefaultResolver`.

When a local time is genuinely ambiguous — the hour that repeats when clocks go back — the library
refuses rather than guessing, and hands you both candidates:

```ts
try {
  await createPerson('Subject', { local: '2023-11-05T01:30' }, { lat: 40.7128, lng: -74.006 });
} catch (error) {
  if (error instanceof AmbiguousTimeError) {
    error.candidates; // both instants, with their offsets — pick one
  }
}

// Then answer it:
await createPerson('Subject', { local: '2023-11-05T01:30', offsetMinutes: -240 }, place);
```

An unknown birth time omits the houses and angles by default rather than inventing them: an
ascendant sweeps the whole zodiac in 24 hours, so a noon value is not an approximation of the true
one, it is unrelated to it. If you prefer the common noon convention, ask for it explicitly with
`{ unknownTime: 'noon' }` — body positions are the same either way, and the chart tells you which
you got in `warnings`.

### Errors

Every failure is a typed class extending `AstrologyError`, each with a `code` and a `retryable`
flag: `ConfigurationError`, `ValidationError`, `AmbiguousTimeError`, `NonexistentTimeError`,
`UnsupportedBodyError`, `AuthError`, `OriginError`, `InsufficientCreditsError`, `RateLimitError`,
`UpstreamError`, `ServiceUnavailableError`, `AdapterError`, `TransportError`.

`InsufficientCreditsError` and `RateLimitError` are separate types on purpose — one needs a
purchase, the other needs a wait — and a response that is not JSON raises a `TransportError` naming
the status, the content type, and the first bytes of what actually came back. `Unexpected token <`
does not happen here.

## Using this in a browser

The library runs in a browser, and `process.env` is never read in a browser build. But **any key in
a browser bundle is public** — this library does not obfuscate it, because obfuscation implies a
protection that does not exist.

If you ship a key to browsers, restrict it with Morphemeris's `require_origin` setting. Note that
origin restriction alone does not protect a leaked key, since a non-browser caller simply omits the
header. For anything beyond a demo, proxy through your own backend and keep the key there.

## Notes on accuracy

- **Declination and out-of-bounds are computed locally**, not read from the API response, which
  currently returns ecliptic latitude in its `declination` field
  ([morphemeris#83](https://github.com/morphatic/morphemeris/issues/83)). The local derivation uses
  true obliquity — mean plus nutation — and agrees with the engine's own equatorial output to within
  0.1 arcsecond.
- **`orb` is the distance from exactness**, always non-negative. This is cross-checked against
  Morphemeris's independently implemented server-side aspect endpoint.
- **Two charts are comparable only if their frames match.** House system, zodiac, and node choice
  travel with the chart on `chart.options` rather than being ambient.
- A body has no `symbol` property; see [docs/glyphs.md](./docs/glyphs.md) for Unicode and Kairon
  Semiserif glyph tables, including the ASCII mapping 1.x encoded.

## Documentation

- [Glyph tables](./docs/glyphs.md) — Unicode codepoints and the Kairon Semiserif ASCII map
- API reference — generated with `pnpm docs`
- [Specification](./plinth/specs/astrologyjs.nlspec.index.md) — the binding contract, if you want to
  know why something behaves the way it does

## Contributing

Tests come before code, and a failing test means the code is wrong until proven otherwise. Run
`pnpm test` — that is unit tests plus the Gherkin acceptance suite, and both must pass. Tests
against the live API read `MORPHEMERIS_API_KEY` from the environment and no-op cleanly without it.

## License

MIT. See [LICENSE](./LICENSE).
