# AstrologyJS

[![Build Status](https://travis-ci.org/morphatic/astrologyjs.svg?branch=master)](https://travis-ci.org/morphatic/astrologyjs)
[![Coverage Status](https://coveralls.io/repos/github/morphatic/astrologyjs/badge.svg?branch=master)](https://coveralls.io/github/morphatic/astrologyjs?branch=master)
[![npm version](https://badge.fury.io/js/astrologyjs.svg)](https://www.npmjs.com/package/astrologyjs)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/morphatic/astrologyjs/master/LICENSE)

AstrologyJS is a NodeJs package that provides functionality for including astrological charts in projects.

## Installation

To use AstrologyJS in a project, run the following in a terminal from the root of your project. This will save AstrologyJS as a dependency within your `package.json` file.

```
npm install astrologyjs --save
```

## Usage

Although there are a number of classes included in the package, the main ones that you'll need are `Person`, `Chart`, `ChartFactory`, and `ChartType`. Import them as follows:

```javascript
// Typescript/ES6 style
import { Person, Chart, ChartFactory, ChartType } from "astrologyjs";

// Node.js style
let Person = require("astrologyjs").Person;
let Chart = require("astrologyjs").Chart;
let ChartFactory = require("astrologyjs").ChartFactory;
```

### Create a `Person`

To create a new chart, first you have to create one or more Person objects. Since creating a person may require some asynchronous calls, you need to use either the `Promise` style or `async/await`:

```javascript
// Using Promise
let person;
Person.create("Kenji", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932}).then(
    p => {
        person = p;
        // ...do other stuff, i.e. create a chart
    },
    err => "Ruh, roh. Something went wrong."
);

// Using async/await
let person;
try {
    person = await Person.create("Kenji", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932});
} catch (err) {
    // uh-oh...
}
// ...do other stuff, i.e. create a chart
```

The parameters for `Person.create()` are:

* The name of the person (or event, if this is an event chart): `string`
* The (precise as possible) date and time for the chart: `Date` or `string` in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)
Be _very careful_ when setting dates to make sure you've properly accounted for the timezone. Using a UTC datetime in the ISO 8601 format is recommended since this format includes accurate timezone information. If you use a `Date` object, be aware that it _usually_ defaults to the timezone in which the computer creating it is located. If this is not the same as the timezone for the chart, your data may come back inaccurate.
* The location for the chart: an `Object` like `{lat: 37.4381927, lng: -79.18932}` or a `string` address
If you submit a `string` addres, e.g. "221B Baker St, Marylebone, London NW1 6XE, UK", behind the scenes `AstrologyJS` will use Google's geocoding service to convert that into a latitude and longitude. If you already know the lat/lng, however, passing them will prevent `Person.create()` from being asynchronous.

If you are creating a Synastry, Combined, or Davison chart, you'll need to create two `Person` objects.

### Create a `Chart`

Chart data is loaded from a remote online ephemeris REST service. As such, when creating a new `Chart` you should use `ChartFactory`. If building an app that stores charts for later viewing, it is recommended that the instantiated `Chart` objects be serialized and stored so that they can be retrieved again later without having to use the factory.

```javascript
// Using Promise
let chart;
ChartFactory.create("Kenji's natal chart", person).then(
    c => {
        chart = c;
        // ... do stuff with your chart ...
    },
    err => "Ruh, roh. Something went wrong."
);

// Using async/await
let chart;
try {
    chart = await ChartFactory.create("Kenji's natal chart", person);
} catch (err) {
    // uh-oh... (probably means web service was unavailable for some reason)
}
// ... do stuff with your chart ...
```

Parameters for `ChartFactory.create()` are:

* A name for your chart: `string`
* A person (or event): `Person`
* A second person: `Person`
* The chart type: one of `ChartType.{Basic, Transits, Synastry, Combined, Davison, CombinedTransits, DavisonTransits}`

Here are some example call signatures. (I've left out the `try/catch` for brevity.)

```javascript
let jack = Person.create("Jack", "1970-01-01T00:00Z", {lat: 37.4381927, lng: -79.18932});
let jill = Person.create("Jill", "1975-05-05T05:05Z", {lat: 42.2462633, lng:  18.26468});

let natal = await ChartFactory.create("Basic natal", jack);
let txits = await ChartFactory.create("Jack with current transits", jack, null, ChartType.Transits);
let snsty = await ChartFactory.create("Jack and Jill's Synastry",   jack, jill, ChartType.Synastry);
let cmbnd = await ChartFactory.create("Jack and Jill Combined",     jack, jill, ChartType.Combined);
let cmbtx = await ChartFactory.create("J/J Combined w/ Transits",   jack, jill, ChartType.CombinedTransits);
let davsn = await ChartFactory.create("Jack and Jill's Davison",    jack, jill, ChartType.Davison);
let davtx = await ChartFactory.create("J/J Davison w/ Transits",    jack, jill, ChartType.DavisonTransits);
```

Charts with transits default to the current time with the location set to the location of the first `Person` passed into the `create()` function. If you'd like to set transit to a specific time, that can be done after the chart has been created by using the `Chart.refreshTransits()` function:

```javascript
// create a chart with transits
let txits = await ChartFactory.create("Jack with current transits", jack, null, ChartType.Transits);

// update them to a specific time, e.g. New Year's eve this year
await txits.refreshTransits("2015-12-31T11:59:59Z");
```

The order of the `Person` objects submitted to the chart determines whether they are considered "inner" or "outer", as follows:

* If there's only one "person", i.e. Basic, Combined, Davison, the planets are "outer"
* If there are transits, the transiting planets are "outer" and the "main" planets are "inner"
* For Synastry, the first `Person` is "inner" and the second `Person` is "outer"

## Using a `Chart`

Once the chart has been instantiated, you can make use of it's data however you like via the `Chart` class' accessor properties:

* `Chart.houses`: returns an array of longitudes corresponding to the house cusps, starting with the 1st
* `Chart.aspects`: returns an array of `Aspect` objects
* `Chart.ascendant`: returns the longitude of the ascendant; same as the 1st house cusp
* `Chart.innerPlanets`/`Chart.outerPlanets`: arrays of `Planet` objects

The interfaces for the `Aspect` and `Planet` classes are as follows:

```javascript
interface Aspect {
    type: string;        // e.g. trine, square, sextile, etc.
    orb: number;         // number of degrees (decimal) from making a "perfect" aspect
    symbol: string;      // character corresponding to the symbol for the aspect in the Kairon Semiserif font
    isMajor: boolean;    // "major" aspects: conjunct, sextile, square, trine, opposition; all others are "minor"
    isApplying: boolean; // is the aspect applying or separating?
}

interface Planet {
    name: string;          // name of the planet
    longitude: number;     // position in the sky
    latitude: number;      // degrees above or below the ecliptic
    speed: number;         // mainly used to determine if the planet is retrograde
    symbol: string;        // character corresponding to the symbol for the planet in the Kairon Semiserif font
    isMajor: boolean;      // "major" planets: Sun, Moon, Mercury-Pluto; all others considered "minor"
    isRetrograde: boolean; // this.speed < 0
}
```

## What Else?

There are probably lots of other things you can do with the code. I've endeavored to make the [source code](https://github.com/morphatic/astrologyjs/blob/master/src/astrologyjs.ts) fairly well documented. Please feel free to ask questions via [the issues page](https://github.com/morphatic/astrologyjs/issues) as well as alerting me to bugs or other problems.

## License

AstrologyJS is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).
