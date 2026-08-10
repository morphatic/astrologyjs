# astrologyjs

An astrological charting library for JavaScript and TypeScript.

> **Status: 1.x is broken. 2.0 is being rebuilt.**
>
> Versions up to `1.3.1` computed charts by calling a free ephemeris service
> that no longer exists. Every chart operation now fails, usually with
> `Unexpected token <` — that is the library trying to parse an HTTP redirect
> page as JSON. If you are here from one of the open issues: you were right,
> it has been broken for years, and this is being fixed rather than explained
> away.
>
> **Do not install `1.x`.** It cannot work, and separately, some of its
> computations were wrong even when the backend was alive — the reported orb of
> an aspect was the fractional part of the angular separation rather than the
> distance from exactness, so any orb it gave you for a non-integer angle was
> incorrect.

## What 2.0 will be

The same domain model — charts, planets, aspects, synastry, composites,
Davison charts — on top of the [Morphemeris](https://morphemeris.com) ephemeris
API, with the computation bugs fixed and the Google Maps dependency removed.

Notable changes from 1.x:

- You bring your own Morphemeris API key. There is no shared key and no free
  proxy, because that is precisely the arrangement that broke last time.
- Birth times are supplied as local wall-clock time plus a place, and the
  library resolves the zone and the historical offset. A time whose zone is
  ambiguous raises an error naming both candidate instants rather than silently
  picking one.
- No Google Maps key is required for anything.
- ESM only.

## Following along

The binding specification is in [`plinth/specs/`](./plinth/specs/) — start with
[the index](./plinth/specs/astrologyjs.nlspec.index.md). Work in progress is
tracked in the open pull request.

## License

MIT. See [LICENSE](./LICENSE).
