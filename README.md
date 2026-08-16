# astrologyjs 1.x — retired

**This branch is a tombstone. Use [astrologyjs 2.x](https://github.com/morphatic/astrologyjs#readme).**

```
npm install astrologyjs@^2
```

## What happened

astrologyjs 1.x got its planetary positions from a free ephemeris service at
`http://www.morphemeris.com/ephemeris.php`. That service went offline years ago. Since then every
chart request has received an HTML error page instead of JSON, and `JSON.parse` has reported it as:

```
SyntaxError: Unexpected token < in JSON at position 0
```

That message names neither the cause nor the fix, so four issues on this repository going back to
2017 all describe the same wall from four different angles. People kept starring the package and
kept hitting it.

The honest version of the history: this was a part-time project that outran its author's bandwidth,
and when the backend disappeared there was nobody watching.

## What 1.3.2 is

1.3.2 changes one thing. Every entry point — `Person`, `Chart`, `ChartFactory`, `Planet`, `Aspect` —
now throws an error that says what happened and where to go, instead of failing on a parse error
several frames away from the cause. The full text is exported as `RETIREMENT_NOTICE`, and the error
carries `code: 'ASTROLOGYJS_1X_RETIRED'` so it can be matched without parsing prose.

It computes nothing. There is no path through this package that produces a chart.

The public surface of 1.3.1 is preserved exactly — the same class names, the same signatures, the
same `ChartType` values, the same three bundles under the same three filenames. Upgrading from
1.3.1 to 1.3.2 still compiles, still resolves, and then explains itself at runtime. Removing members
instead would have produced "Property 'x' does not exist", which is no more informative than the
error being replaced.

1.3.2 also drops both of 1.3.1's runtime dependencies. A package that computes nothing installs
nothing.

## Do not trust old 1.x output either

The outage is the loud failure. There was a quiet one as well: `Aspect.orb` reported the fractional
part of the separation between two planets rather than the distance from exactness. A trine at
118.5° — an orb of 1.5° — was reported as 0.5. Anything derived from 1.x orbs is suspect, including
results produced while the backend was still up.

This is fixed in 2.x, where `orb` means distance from exactness and is cross-checked against an
independent server-side implementation.

## astrologyjs 2.x

2.x is a ground-up reimplementation on the [Morphemeris](https://api.morphemeris.com) API. It is
ESM-only, it is maintained, and it requires an API key of your own — a shipped shared key or a free
proxy would just recreate the failure this branch documents.

See the [2.x README](https://github.com/morphatic/astrologyjs#readme) for the quickstart.

## This branch

`legacy/1.x` exists so 1.3.2 has somewhere to be built and published from. It is frozen. It is never
merged into `main`, and nothing on it is shared with 2.x.

## License

MIT. See [LICENSE](LICENSE).
