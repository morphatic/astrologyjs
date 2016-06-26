/// <reference path="../typings/index.d.ts" />
let rp = require("request-promise");
/**
 * One of the planets, asteroids, the sun or moon
 */
export class Planet {

    /**
     * The planet name, e.g. Mercury
     * @type {string}
     */
    name: string;

    /**
     * A planet's longitude identifies what sign
     * it is in
     * @type {number}
     */
    longitude: number;

    /**
     * A planet's latitude describes it's distance
     * from the ecliptic, and can be used to
     * determine if it is out of bounds
     * @type {number}
     */
    latitude: number;

    /**
     * A planet's speed allows us to know if it is
     * retrograde, and to calculate whether an
     * aspect is applying or separating
     * @type {number}
     */
    speed: number;

    /**
     * The symbol for this planet as represented in
     * the Kairon Semiserif font
     * @type {string}
     */
    symbol: string;

    /**
     * Dictionary of symbols for the planets for
     * use with the Kairon Semiserif font
     * @type {Object}
     */
    private symbols = {
        "sun":        "a",
        "moon":       "s",
        "mercury":    "d",
        "venus":      "f",
        "earth":      "g",
        "mars":       "h",
        "jupiter":    "j",
        "saturn":     "k",
        "uranus":     "ö",
        "neptune":    "ä",
        "pluto":      "#",
        "south node": "?",
        "north node": "ß",
        "ceres":      "A",
        "pallas":     "S",
        "juno":       "D",
        "vesta":      "F",
        "lilith":     "ç",
        "cupido":     "L",
        "chiron":     "l",
        "nessus":     "ò",
        "pholus":     "ñ",
        "chariklo":   "î",
        "eris":       "È",
        "chaos":      "Ê",
        "fortuna":    "%"
    };

    /**
     * Instantiate a new planet object.
     * @param {string} name The planet's name
     * @param {number} lon  The planet's longitude
     * @param {number} lat  The planet's latitude
     * @param {number} spd  The planet's speed relative to earth
     */
    constructor(name: string, lon: number, lat: number, spd: number) {
        this.name = name;
        this.longitude = lon;
        this.latitude = lat;
        this.speed = spd;
        this.symbol = this.symbols[name.toLowerCase()];
    }

    /**
     * A planet is retrograde when it's speed relative
     * to earth is less than zero
     * @return {boolean} Whether or not the planet is retrograde
     */
    isRetrograde(): boolean {
        return this.speed < 0;
    }

    /**
     * Is this one of the major planets typically included in a chart?
     * @return {boolean} Returns true if it is a major planet
     */
    isMajor(): boolean {
        return ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
                "uranus", "neptune", "pluto", "north node", "south node"]
                .indexOf(this.name.toLowerCase()) > -1;
    }
}

interface GoogleAddressComponent {
    long_name: string;
    short_name: string;
    types: Array<string>;
}

export interface GoogleLocation {
    lat: number;
    lng: number;
}

export type Point = GoogleLocation;

interface GoogleViewport {
    northeast: GoogleLocation;
    southwest: GoogleLocation;
}

interface GoogleGeocode {
    address_components: Array<GoogleAddressComponent>;
    formatted_address: string;
    geometry: {
        location: GoogleLocation;
        location_type: string;
        viewport: GoogleViewport;
        bounds?: GoogleViewport
    };
    place_id: string;
    types: Array<string>;
    partial_match?: boolean;
    postcode_localities?: Array<string>;
}

interface GoogleGeocodeResult {
    results: Array<GoogleGeocode>;
    status: string;
    error_message?: string;
}

interface GoogleTimezoneResult {
   status: string;
   dstOffset?: number;
   rawOffset?: number;
   timeZoneId?: string;
   timeZoneName?: string;
   errorMessage?: string;
}

/**
 * Represents a person or event for whom a chart will be created
 */
export class Person {

    /**
     * Google API key
     * @type {string}
     */
    private static _key: string = "AIzaSyAXnIdQxap1WQuzG0XxHfYlCA5O9GQyvuY";

    /**
     * Creates a Person (or Event) object
     * @param {string} public name Name of the person or event
     * @param {string} public date UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param {Point} location The [lat: number, lon: number] of the event or person's birthplace
     */
    constructor(public name: string, public date: string, public location: Point) {}

    /**
     * Asynchronous factory function for creating people or events
     * @param  {string}          name     Name of the person or event
     * @param  {Date | string}   date     Exact datetime for the chart, preferably UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param  {Point | string}  location Either an address or a lat/lng combination
     * @return {Promise<Person>}          The Person or Event object that was created
     */
    static async create(name: string, date: Date | string, location: Point | string): Promise<Person> {

        let dt: string,
            loc: Point;

        // make sure a name was submitted
        if (!name) {
            throw new Error("No name was submitted for the person/event");
        }

        // deal with the type of date submitted
        if (typeof date === "string") {
            if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}\.\d{3})?Z/.test(date)) {
                throw new TypeError("Date not formatted according to ISO 8601 (YYYY-MM-DDTHH:mmZ)");
            }
            dt = date;
        }
        else if (date instanceof Date) {
            dt = date.toISOString();
        }
        else {
            // defaults to "now"
            dt = new Date().toISOString();
        }

        // deal with the type of location submitted
        if (typeof location === "string") {
            loc = await this.getLatLon(location);
        } else {
            // make sure latitude was valid
            if (location.lat < -90 || location.lat > 90) {
                throw new RangeError("Latitude must be between -90 and 90");
            }
            // make sure longitude was valid
            if (location.lng < -180 || location.lng > 180) {
                throw new RangeError("Longitude must be between -180 and 180");
            }
            loc = location;
        }

        return new Person(name, dt, loc);
    }

    /**
     * Gets a timezone given a latitude and longitude
     * @param {Point} p  Contains the latitude and longitude in decimal format
     */
    static async getTimezone(p: Point): Promise<string> {
        return await rp({
            uri: "https://maps.googleapis.com/maps/api/timezone/json",
            qs: {
                key: this._key,
                location: `${p.lat},${p.lng}`,
                timestamp: Math.floor(Date.now() / 1000)
            },
            json: true
        }).then(
            (tzinfo: GoogleTimezoneResult): string => tzinfo.timeZoneId,
            (error:  GoogleTimezoneResult): any => { throw Error(error.errorMessage); }
        );
    }

    /**
     * Get a latitude and longitude given an address
     * @param {string} address The address of the desired lat/lon
     */
    static async getLatLon(address: string): Promise<Point> {
        return await rp({
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                key: this._key,
                address: address
            },
            json: true
        }).then(
            (latlng: GoogleGeocodeResult): Point => latlng.results[0].geometry.location,
            (error:  GoogleGeocodeResult): Point => { throw Error(error.error_message); }
        );
    }
}

/**
 * Alias for the Person class
 * @type {[type]}
 */
export type Event = Person;

interface AspectType {
    major: boolean;
    angle: number;
    orb: number;
    symbol: string;
}

interface AspectTypeArray {
    [name: string]: AspectType;
}

/**
 * Represents an aspect between two planets
 */
export class Aspect {

    /**
     * A label naming the aspect type, e.g. trine
     * @type {string}
     */
    private _type: string;

    /**
     * Number of degrees away from being perfectly in aspect
     * @type {number}
     */
    private _orb: number;

    /**
     * Is the aspect applying or separating
     * @type {boolean}
     */
    private _applying: boolean;

    /**
     * Catalog of all of the aspect types available in our system
     * @type {AspectTypeArray}
     */
    private _types: AspectTypeArray = {
       "conjunct":       { major: true,  angle:   0,     orb: 6  , symbol: "<" },
       "semisextile":    { major: false, angle:  30,     orb: 3  , symbol: "y" },
       "decile":         { major: false, angle:  36,     orb: 1.5, symbol: ">" },
       "novile":         { major: false, angle:  40,     orb: 1.9, symbol: "M" },
       "semisquare":     { major: false, angle:  45,     orb: 3  , symbol: "=" },
       "septile":        { major: false, angle:  51.417, orb: 2  , symbol: "V" },
       "sextile":        { major: true,  angle:  60,     orb: 6  , symbol: "x" },
       "quintile":       { major: false, angle:  72,     orb: 2  , symbol: "Y" },
       "bilin":          { major: false, angle:  75,     orb: 0.9, symbol: "-" },
       "binovile":       { major: false, angle:  80,     orb: 2  , symbol: ";" },
       "square":         { major: true,  angle:  90,     orb: 6  , symbol: "c" },
       "biseptile":      { major: false, angle: 102.851, orb: 2  , symbol: "N" },
       "tredecile":      { major: false, angle: 108,     orb: 2  , symbol: "X" },
       "trine":          { major: true,  angle: 120,     orb: 6  , symbol: "Q" },
       "sesquiquadrate": { major: false, angle: 135,     orb: 3  , symbol: "b" },
       "biquintile":     { major: false, angle: 144,     orb: 2  , symbol: "C" },
       "inconjunct":     { major: false, angle: 150,     orb: 3  , symbol: "n" },
       "treseptile":     { major: false, angle: 154.284, orb: 1.1, symbol: "B" },
       "tetranovile":    { major: false, angle: 160,     orb: 3  , symbol: ":" },
       "tao":            { major: false, angle: 165,     orb: 1.5, symbol: "—" },
       "opposition":     { major: true,  angle: 180,     orb: 6  , symbol: "m" }
    };

    /**
     * Creates a new Aspect or throws an error if no aspect exists
     * between the planets
     * @param {Planet} public p1 First planet in the relationship
     * @param {Planet} public p2 Second planet in the relationship
     */
    constructor(public p1: Planet, public p2: Planet) {
        // get key properties of the planets
        let l1 = p1.longitude,
            l2 = p2.longitude,
            ng = Math.abs( l1 - l2 ),
            r1 = p1.isRetrograde(),
            r2 = p2.isRetrograde(),
            s1 = Math.abs(p1.speed),
            s2 = Math.abs(p2.speed),
            ct = false; // corrected?

        // correct for cases where the angle > 180 + the orb of opposition
        if (ng > 180 + this._types["opposition"].orb) {
            ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
            ct = true;
        }

        // determine the aspect type
        for (let type in this._types) {
            let t = this._types[type];
            if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
                this._type = type;
            }
        }

        // bail out if there is no in-orb aspect between these two planets
        if (typeof this._type === "undefined") {
            throw new Error("There is no aspect between these two planets.");
        }

        // determine the orb
        this._orb = Number((ng % 1).toFixed(6));

        // determine if it is applying or not; use speed magnitude (i.e. absolute value)
        let orb = ng - this._types[this._type].angle;
        // planets are in aspect across 0° Aries
        if (( ( (orb < 0 && !ct && l2 > l1) || (orb > 0 && !ct && l1 > l2) ||
                (orb < 0 &&  ct && l1 > l2) || (orb > 0 &&  ct && l2 > l1) ) &&
                ( (!r1 && !r2 && s2 > s1) || (r1 && r2 && s1 > s2) || (r1 && !r2) ) ||
            ( ( (orb > 0 && !ct && l2 > l1) || (orb < 0 && !ct && l1 > l2) ||
                (orb > 0 &&  ct && l1 > l2) || (orb < 0 &&  ct && l2 > l1) ) &&
                ( (!r1 && !r2 && s1 > s2) || (r1 && r2 && s2 > s1) || (!r1 && r2) ) ) )
        ) {
            this._applying = true;
        } else {
            this._applying = false;
        }
    }

    /**
     * Get the type assigned to this aspect
     * @return {string} One of the aspect type names
     */
    get type(): string { return this._type; }

    /**
     * Get the number of degrees away from being in perfect aspect
     * @return {number} The number of degrees (absolute value)
     */
    get orb(): number { return this._orb; }

    /**
     * Get the character that will produce the correct symbol for
     * this aspect in the Kairon Semiserif font
     * @return {string} A character representing a symbol
     */
    get symbol(): string { return this._types[this._type].symbol; }

    /**
     * Is the aspect applying or separating?
     * @return {boolean} True if the aspect is applying
     */
    isApplying(): boolean { return this._applying; }

    /**
     * Is this a "major" aspect? i.e. one of those you usually
     * hear about in astrological forecasts
     * @return {boolean} True if this is a "major" aspect
     */
    isMajor(): boolean { return this._types[this._type].major; }
}

export enum ChartType {
    Basic,
    Transits,
    Synastry,
    Combined,
    Davison,
    CombinedTransits,
    DavisonTransits
};

export interface PlanetData {
    name: string;
    lon: number;
    lat: number;
    spd: number;
    r: number;
}

export interface PlanetDataArray {
    [name: string]: PlanetData;
}

export interface ChartData {
    planets: PlanetDataArray;
    houses: Array<number>;
    ascendant: number;
    mc: number;
}

export interface ChartDataArray {
    [index: number]: ChartData;
}

export class Chart {

    _planets1: Array<Planet>;
    _planets2: Array<Planet>;
    _aspects: Array<Aspect>;
    _ascendant: number;
    _houses: Array<number>;

    _signs = [
        {name: "aries",       symbol: "q", v: 1},
        {name: "taurus",      symbol: "w", v: 1},
        {name: "gemini",      symbol: "e", v: 1},
        {name: "cancer",      symbol: "r", v: 1},
        {name: "leo",         symbol: "t", v: 1},
        {name: "virgo",       symbol: "z", v: 1},
        {name: "libra",       symbol: "u", v: 1},
        {name: "scorpio",     symbol: "i", v: 1},
        {name: "sagittarius", symbol: "o", v: 1},
        {name: "capricorn",   symbol: "p", v: 1},
        {name: "aquarius",    symbol: "ü", v: 1},
        {name: "pisces",      symbol: "+", v: 1}
    ];

    constructor(public name: string, public p1: Person, cdata: ChartDataArray, public p2?: Person, public type: ChartType = ChartType.Basic) {
        let pdata: ChartData;
        switch (type) {
            case ChartType.Combined:
                pdata = this.calculateCombinedPlanets(cdata);
                this._planets1 = this.getPlanets(pdata);
                this._ascendant = pdata.ascendant;
                this._houses = pdata.houses;
                break;
            case ChartType.CombinedTransits:
                pdata = this.calculateCombinedPlanets(cdata);
                this._planets1 = this.getPlanets(pdata);
                this._planets2 = this.getPlanets(cdata[2]);
                this._ascendant = pdata.ascendant;
                this._houses = pdata.houses;
                break;
            default:
                this._planets1 = this.getPlanets(cdata[0]);
                if (cdata[1]) {
                    this._planets2 = this.getPlanets(cdata[1]);
                }
                this._ascendant = cdata[0].ascendant;
                this._houses = cdata[0].houses;
                break;
        }
        this.calculateAspects();
    }

    /**
     * Extracts planet data from ChartData and creates Planet objects for each one
     * @param  {ChartData}     cdata JSON data returned from morphemeris REST API
     * @return {Array<Planet>}       An array of Planet objects
     */
    getPlanets(cdata: ChartData): Array<Planet> {
        let planets: Array<Planet> = [];
        for (let p in cdata.planets) {
            let pd = cdata.planets[p];
            planets.push(new Planet(pd.name, pd.lon, pd.lat, pd.spd));
        }
        return planets;
    }

    /**
     * Calculates the aspects between planets in the chart
     */
    calculateAspects(): void {
        this._aspects = [];
        if (!this._planets2) {
            // calculate aspects within the _planets1 array
            for (let i in this._planets1) {
                for (let j in this._planets1) {
                    if (i !== j && j > i) {
                        try {
                            this._aspects.push(new Aspect(this._planets1[i], this._planets1[j]));
                        } catch (err) {}
                    }
                }
            }
        }
        else {
            // calculate aspects between the _planets1 and _planets2 arrays
            for (let i in this._planets1) {
                for (let j in this._planets2) {
                    try {
                        this._aspects.push(new Aspect(this._planets1[i], this._planets2[j]));
                    } catch (err) {}
                }
            }
        }
    }

    /**
     * Calculates longitudes for a combined chart
     * @param {ChartData} p1 Planet data from person one
     * @param {ChartData} p2 Planet data from person two
     */
    calculateCombinedPlanets(cdata: ChartDataArray): ChartData {
        let cd: ChartData = {"planets":{"sun":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"moon":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"mercury":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"venus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"mars":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"jupiter":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"saturn":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"uranus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"neptune":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pluto":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"north node":{"name":"north node","lon":null,"lat":null,"spd":null,"r":null},"south node":{"name":"south node","lon":null,"lat":null,"spd":null,"r":null},"chiron":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pholus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"ceres":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pallas":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"juno":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"vesta":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"cupido":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"chariklo":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"chaos":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"eris":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"nessus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null}},"houses":[null,null,null,null,null,null,null,null,null,null,null,null], "ascendant": null, "mc": null};
        for (let p in cdata[0].planets) {
            cd.planets[p].name = p;
            cd.planets[p].lon = this.getLonMidpoint(cdata[0].planets[p].lon, cdata[1].planets[p].lon);
            cd.planets[p].lat = (cdata[0].planets[p].lat + cdata[1].planets[p].lat) / 2;
            cd.planets[p].spd = (cdata[0].planets[p].spd + cdata[1].planets[p].spd) / 2;
        }
        for (let h in cdata[0].houses) {
            cd.houses[h] = this.getLonMidpoint(cdata[0].houses[h], cdata[1].houses[h]);
        }
        cd.ascendant = this.getLonMidpoint(cdata[0].ascendant, cdata[1].ascendant);
        cd.mc = this.getLonMidpoint(cdata[0].mc, cdata[1].mc);
        return cd;
    }

    /**
     * Finds the midpoint between two planets on the "short" side
     * @param  {number} l1 Longitude of planet one
     * @param  {number} l2 Longitude of planet two
     * @return {number}    Longitude of the midpoint
     */
    getLonMidpoint(l1: number, l2: number): number {
        let mp: number, high: number, low: number;

        // if they are exactly the same, return either one
        if (l1 === l2) {
            return l1;
        }

        // figure out which has a higher/lower longitude
        high = l1 > l2 ? l1 : l2;
        low  = l1 < l2 ? l1 : l2;

        if (high - low <= 180) {
            mp = (high + low) / 2;
        }
        else {
            mp = ((((low + 360) - high) / 2) + high) % 360;
        }

        return mp;
    }

    /**
     * Refresh or set the transits to a new time
     * @param {string} date (Optional) Target datetime for transits in ISO 8601 format; defaults to now()
     */
    async refreshTransits(date: string = null) {
        if (ChartType.Synastry === this.type) {
            throw new Error("You cannot refresh transits on a synastry chart");
        }
        if (null === date) {
            date = new Date().toISOString();
        }
        let cdata = await ChartFactory.getChartData(date, this.p1.location);
        this._planets2 = this.getPlanets(cdata);
        this.calculateAspects();
    }

    get houses():  Array<number> { return this._houses;  }
    get aspects(): Array<Aspect> { return this._aspects; }
    get ascendant(): number { return this._ascendant; }
    get innerPlanets(): Array<Planet> { return this._planets2 ? this._planets1 : []; }
    get outerPlanets(): Array<Planet> { return this._planets2 ? this._planets2 : this._planets1; }

}

/**
 * Usage: let chart: Chart = ChartFactory.create("my cart", person);
 */
export class ChartFactory {

    static async create(name: string, p1: Person | Event, p2: Person | Event = null, type: ChartType = ChartType.Basic) {
        // make sure a name was passed in
        if (null === name || "undefined" === typeof name || 0 === name.length) {
            throw Error("Chart must have a name (ChartFactory)");
        }
        // check for undefined people
        if (null === p1 || typeof p1 === "undefined") {
            throw Error("Person or Event cannot be null or undefined (ChartFactory)");
        }
        switch (type) {
            case ChartType.Synastry:
            case ChartType.Combined:
            case ChartType.CombinedTransits:
            case ChartType.Davison:
                if (null === p2) {
                    throw Error("2nd Person or Event cannot be null for this chart type (ChartFactory)");
                }
        }

        let cdata: Array<ChartData> = [], date: string, p: Point;
        switch (type) {
            case ChartType.Transits:
                cdata = await Promise.all([
                    ChartFactory.getChartData(p1.date, p1.location),
                    ChartFactory.getChartData(new Date().toISOString(), p1.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.Synastry:
            case ChartType.Combined:
                cdata = await Promise.all([
                    ChartFactory.getChartData(p1.date, p1.location),
                    ChartFactory.getChartData(p2.date, p2.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.CombinedTransits:
                cdata = await Promise.all([
                    ChartFactory.getChartData(p1.date, p1.location),
                    ChartFactory.getChartData(p2.date, p2.location),
                    ChartFactory.getChartData(new Date().toISOString(), p1.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.Davison:
                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                cdata.push(await ChartFactory.getChartData(date, p));
                return new Chart(name, p1, cdata);
            case ChartType.DavisonTransits:
                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                cdata = await Promise.all([
                    ChartFactory.getChartData(date, p),
                    ChartFactory.getChartData(new Date().toISOString(), p)
                ]);
                return new Chart(name, p1, cdata, null, type);
            default:
                cdata.push(await ChartFactory.getChartData(p1.date, p1.location));
                return new Chart(name, p1, cdata);
        }
    }

    /**
     * Calculates the lat/lon of the geographic midpoint between two lat/lon pairs
     * @param  {Point} p1 Latitude/longitude of first location
     * @param  {Point} p2 Latitude/longitude of second location
     * @return {Point} The latitude/longitude of the geographic midpoint
     */
    static getGeoMidpoint(p1: Point, p2: Point): Point {
        let lat1 = ChartFactory.toRadians( p1.lat ),
            lng1 = ChartFactory.toRadians( p1.lng ),
            lat2 = ChartFactory.toRadians( p2.lat ),
            lng2 = ChartFactory.toRadians( p2.lng ),
            bx   = Math.cos( lat2 ) * Math.cos( lng2 - lng1 ),
            by   = Math.cos( lat2 ) * Math.sin( lng2 - lng1 ),
            lng3 = lng1 + Math.atan2( by, Math.cos( lat1 ) + bx ),
            lat3 = Math.atan2( Math.sin( lat1 ) + Math.sin( lat2 ),
                   Math.sqrt( Math.pow( Math.cos( lat1 ) + bx, 2 ) + Math.pow( by, 2 ) ) );

        return {
            lat: ChartFactory.toDegrees( lat3 ),
            lng: ChartFactory.toDegrees( lng3 )
        };
    }

    /**
     * Finds the exact midpoint between two dates
     * @param  {string} date1 The first date
     * @param  {string} date2 The second date
     * @return {string}       The midpoint date as an ISO 8601 string
     */
    static getDatetimeMidpoint(date1: string, date2: string): string {
        let d1 = new Date(date1).getTime(),
            d2 = new Date(date2).getTime(),
            ts: number;

        // if two dates are the same, midpoint is just that date
        if (d1 === d2) {
            return date1;
        }

        ts = d1 < d2 ? d1 + ((d2 - d1) / 2) : d2 + ((d1 - d2) / 2);
        return new Date(ts).toISOString();
    }

    /**
     * Gets chart data from the online ephemeris
     * @param {string} date A UTC datetime string in ISO 8601 format
     * @param {Point}  p    An object with numeric lat and lng properties
     * @return {Promise<ChartData>}  A JSON object with the data needed to implement a chart
     */
    static async getChartData(date: string, p: Point): Promise<ChartData> {
        return await rp({
            uri: "http://www.morphemeris.com/ephemeris.php",
            qs: {
                date: date,
                lat: p.lat,
                lon: p.lng
            },
            json: true
        }).then((cdata: ChartData) => cdata);
    }

    /**
     * Converts decimal degrees to radians
     * @param  {number} degrees Decimal representation of degrees to be converted
     * @return {number}         Returns radians
     */
    static toRadians = (degrees: number) => degrees * Math.PI / 180;

    /**
     * Converts radians to decimal degrees
     * @param  {number} radians Radians to be converted
     * @return {number}         Returns decimal degrees
     */
    static toDegrees = (radians: number) => radians * 180 / Math.PI;
}
