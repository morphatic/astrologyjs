# Glyphs

`astrologyjs` does not render anything, and `Planet` has no `symbol` property. Presentation is the
caller's job, so the mapping lives here as documentation instead.

If you are porting from 1.x, this page is what `Planet.symbol` used to give you — see
[Kairon Semiserif](#kairon-semiserif), which is where those values came from.

## Unicode

Works everywhere, in a terminal or a JSON dump, with no font to install and no licensing question.
**Start here.** The one caveat is coverage: several bodies have no codepoint at all (see below).

### Bodies

| Body | Glyph | Codepoint | Body | Glyph | Codepoint |
| --- | :-: | --- | --- | :-: | --- |
| sun | ☉ | `U+2609` | pluto | ♇ | `U+2647` |
| moon | ☽ | `U+263D` | north node | ☊ | `U+260A` |
| mercury | ☿ | `U+263F` | south node | ☋ | `U+260B` |
| venus | ♀ | `U+2640` | ceres | ⚳ | `U+26B3` |
| earth | ♁ | `U+2641` | pallas | ⚴ | `U+26B4` |
| mars | ♂ | `U+2642` | juno | ⚵ | `U+26B5` |
| jupiter | ♃ | `U+2643` | vesta | ⚶ | `U+26B6` |
| saturn | ♄ | `U+2644` | chiron | ⚷ | `U+26B7` |
| uranus | ♅ | `U+2645` | lilith | ⚸ | `U+26B8` |
| neptune | ♆ | `U+2646` | | | |

### Signs

| Sign | Glyph | Codepoint | Sign | Glyph | Codepoint |
| --- | :-: | --- | --- | :-: | --- |
| aries | ♈ | `U+2648` | libra | ♎ | `U+264E` |
| taurus | ♉ | `U+2649` | scorpio | ♏ | `U+264F` |
| gemini | ♊ | `U+264A` | sagittarius | ♐ | `U+2650` |
| cancer | ♋ | `U+264B` | capricorn | ♑ | `U+2651` |
| leo | ♌ | `U+264C` | aquarius | ♒ | `U+2652` |
| virgo | ♍ | `U+264D` | pisces | ♓ | `U+2653` |

### Aspects

| Aspect | Glyph | Codepoint | Aspect | Glyph | Codepoint |
| --- | :-: | --- | --- | :-: | --- |
| conjunct | ☌ | `U+260C` | square | □ | `U+25A1` |
| opposition | ☍ | `U+260D` | trine | △ | `U+25B3` |
| sextile | ⚹ | `U+26B9` | semisquare | ⚻ | `U+26BB` |
| semisextile | ⚺ | `U+26BA` | sesquiquadrate | ⚼ | `U+26BC` |

Square and trine use geometric shapes because Unicode assigns them no astrological codepoints. The
remaining minor aspects in `ASPECTS` — decile, novile, septile, quintile, bilin, binovile,
biseptile, tredecile, biquintile, inconjunct, treseptile, tetranovile, tao — have none either.

### What Unicode does not cover

No codepoint exists for `pholus`, `osculating lilith`, `eris`, `chariklo`, `chaos`, `nessus`, or
`cupido`. Part of Fortune has no official codepoint; `⊗` (`U+2297`) is conventional but not
standardized. Rendering those needs a font or an SVG set.

## Kairon Semiserif

Some astrology fonts park their glyphs on ASCII keys rather than Unicode codepoints, so you type `a`
and the font draws ☉. Kairon Semiserif is one of these, and it is what 1.x's `Planet.symbol`
encoded — which is why 1.x output looked like mojibake to everyone who did not happen to have the
font installed, and why the property is gone in 2.x.

**Availability, honestly:** the font ships bundled inside
[Kairon](https://kairon.cc/en/download.php), a macOS astrology application, as an optional install
during setup. There is no standalone download and no published redistribution license, so this is
not a mapping most projects can use. It is recorded here because it is otherwise undocumented
anywhere, and working it out the first time was not easy.

Apply the font, then emit the key.

### Bodies and signs

| Body | Key | Body | Key | Sign | Key |
| --- | :-: | --- | :-: | --- | :-: |
| sun | `a` | ceres | `A` | aries | `q` |
| moon | `s` | pallas | `S` | taurus | `w` |
| mercury | `d` | juno | `D` | gemini | `e` |
| venus | `f` | vesta | `F` | cancer | `r` |
| earth | `g` | lilith | `ç` | leo | `t` |
| mars | `h` | cupido | `L` | virgo | `z` |
| jupiter | `j` | chiron | `l` | libra | `u` |
| saturn | `k` | nessus | `ò` | scorpio | `i` |
| uranus | `ö` | pholus | `ñ` | sagittarius | `o` |
| neptune | `ä` | chariklo | `î` | capricorn | `p` |
| pluto | `#` | eris | `È` | aquarius | `ü` |
| north node | `ß` | chaos | `Ê` | pisces | `+` |
| south node | `?` | fortuna | `%` | | |

### Aspects

| Aspect | Key | Aspect | Key | Aspect | Key |
| --- | :-: | --- | :-: | --- | :-: |
| conjunct | `<` | sextile | `x` | sesquiquadrate | `b` |
| semisextile | `y` | quintile | `Y` | biquintile | `C` |
| decile | `>` | bilin | `-` | inconjunct | `n` |
| novile | `M` | binovile | `;` | treseptile | `B` |
| semisquare | `=` | square | `c` | tetranovile | `:` |
| septile | `V` | biseptile | `N` | tao | `—` |
| | | tredecile | `X` | opposition | `m` |
| | | trine | `Q` | | |

Recovered from `src/planet.ts`, `src/chart.ts`, and `src/aspect.ts` at commit `1efdb55`, before
those files were removed. `cupido`, `eris`, `chariklo`, `chaos`, and `nessus` are listed for
completeness; 2.x does not carry those bodies, because the ephemeris API does not.

## Using them

Neither table ships as code, so map from the body name in whatever layer renders:

```ts
const GLYPHS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  // ...
};

for (const planet of chart.planets) {
  const glyph = GLYPHS[planet.name] ?? planet.name;
  console.log(`${glyph} ${planet.signDegree.toFixed(2)} ${planet.sign}`);
}
```

Escape sequences rather than literal glyphs are worth the noise in source: several of these
characters are visually indistinguishable from lookalikes in other Unicode blocks, and a copy-paste
that picks up the wrong one is hard to spot in review.
