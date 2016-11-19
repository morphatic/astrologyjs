declare module "planet" {
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
        private symbols;
        /**
         * Instantiate a new planet object.
         * @param {string} name The planet's name
         * @param {number} lon  The planet's longitude
         * @param {number} lat  The planet's latitude
         * @param {number} spd  The planet's speed relative to earth
         */
        constructor(name: string, lon: number, lat: number, spd: number);
        /**
         * A planet is retrograde when it's speed relative
         * to earth is less than zero
         * @return {boolean} Whether or not the planet is retrograde
         */
        isRetrograde(): boolean;
        /**
         * Is this one of the major planets typically included in a chart?
         * @return {boolean} Returns true if it is a major planet
         */
        isMajor(): boolean;
    }
}
declare module "rp" {
    export interface RequestPromiseOptions {
        uri: string;
        qs: {
            [name: string]: string | number | boolean;
        };
    }
    const rp: (options: RequestPromiseOptions) => Promise<any>;
    export default rp;
}
declare module "person" {
    export interface GoogleLocation {
        lat: number;
        lng: number;
    }
    export type Point = GoogleLocation;
    /**
     * Represents a person or event for whom a chart will be created
     */
    export class Person {
        name: string;
        date: string;
        location: Point;
        /**
         * Google API key
         * @type {string}
         */
        private static _key;
        /**
         * Creates a Person object
         * @param {string} public name Name of the person or event
         * @param {string} public date UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
         * @param {Point} location The [lat: number, lon: number] of the event or person's birthplace
         */
        constructor(name: string, date: string, location: Point);
        /**
         * Asynchronous factory function for creating people or events
         * @param  {string}          name     Name of the person or event
         * @param  {Date | string}   date     Exact datetime for the chart, preferably UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
         * @param  {Point | string}  location Either an address or a lat/lng combination
         * @return {Promise<Person>}          The Person object that was created
         */
        static create(name: string, date: Date | string, location: Point | string): Promise<Person>;
        /**
         * Gets a timezone given a latitude and longitude
         * @param {Point} p  Contains the latitude and longitude in decimal format
         */
        static getTimezone(p: Point): Promise<string>;
        /**
         * Get a latitude and longitude given an address
         * @param {string} address The address of the desired lat/lon
         */
        static getLatLon(address: string): Promise<Point>;
    }
}
declare module "aspect" {
    import { Planet } from "planet";
    /**
     * Represents an aspect between two planets
     */
    export class Aspect {
        p1: Planet;
        p2: Planet;
        /**
         * A label naming the aspect type, e.g. trine
         * @type {string}
         */
        private _type;
        /**
         * Number of degrees away from being perfectly in aspect
         * @type {number}
         */
        private _orb;
        /**
         * Is the aspect applying or separating
         * @type {boolean}
         */
        private _applying;
        /**
         * Catalog of all of the aspect types available in our system
         * @type {AspectTypeArray}
         */
        private _types;
        /**
         * Creates a new Aspect or throws an error if no aspect exists
         * between the planets
         * @param {Planet} public p1 First planet in the relationship
         * @param {Planet} public p2 Second planet in the relationship
         */
        constructor(p1: Planet, p2: Planet);
        /**
         * Get the type assigned to this aspect
         * @return {string} One of the aspect type names
         */
        readonly type: string;
        /**
         * Get the number of degrees away from being in perfect aspect
         * @return {number} The number of degrees (absolute value)
         */
        readonly orb: number;
        /**
         * Get the character that will produce the correct symbol for
         * this aspect in the Kairon Semiserif font
         * @return {string} A character representing a symbol
         */
        readonly symbol: string;
        /**
         * Is the aspect applying or separating?
         * @return {boolean} True if the aspect is applying
         */
        isApplying(): boolean;
        /**
         * Is this a "major" aspect? i.e. one of those you usually
         * hear about in astrological forecasts
         * @return {boolean} True if this is a "major" aspect
         */
        isMajor(): boolean;
    }
}
declare module "chart" {
    import { Person, Point } from "person";
    import { Planet } from "planet";
    import { Aspect } from "aspect";
    export enum ChartType {
        Basic = 0,
        Transits = 1,
        Synastry = 2,
        Combined = 3,
        Davison = 4,
        CombinedTransits = 5,
        DavisonTransits = 6,
    }
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
        name: string;
        p1: Person;
        p2: Person;
        type: ChartType;
        _planets1: Array<Planet>;
        _planets2: Array<Planet>;
        _aspects: Array<Aspect>;
        _ascendant: number;
        _houses: Array<number>;
        _debug: boolean;
        _signs: {
            name: string;
            symbol: string;
            v: number;
        }[];
        constructor(name: string, p1: Person, cdata: ChartDataArray, p2?: Person, type?: ChartType);
        /**
         * Extracts planet data from ChartData and creates Planet objects for each one
         * @param  {ChartData}     cdata JSON data returned from morphemeris REST API
         * @return {Array<Planet>}       An array of Planet objects
         */
        getPlanets(cdata: ChartData): Array<Planet>;
        /**
         * Calculates the aspects between planets in the chart
         */
        calculateAspects(): void;
        /**
         * Calculates longitudes for a combined chart
         * @param {ChartData} p1 Planet data from person one
         * @param {ChartData} p2 Planet data from person two
         */
        calculateCombinedPlanets(cdata: ChartDataArray): ChartData;
        /**
         * Finds the midpoint between two planets on the "short" side
         * @param  {number} l1 Longitude of planet one
         * @param  {number} l2 Longitude of planet two
         * @return {number}    Longitude of the midpoint
         */
        getLonMidpoint(l1: number, l2: number): number;
        /**
         * Gets chart data from the online ephemeris
         * @param {string} date A UTC datetime string in ISO 8601 format
         * @param {Point}  p    An object with numeric lat and lng properties
         * @return {Promise<ChartData>}  A JSON object with the data needed to implement a chart
         */
        static getChartData(date: string, p: Point): Promise<ChartData>;
        /**
         * Refresh or set the transits to a new time
         * @param {string} date (Optional) Target datetime for transits in ISO 8601 format; defaults to now()
         */
        refreshTransits(date?: string): Promise<void>;
        readonly houses: Array<number>;
        readonly aspects: Array<Aspect>;
        readonly ascendant: number;
        readonly innerPlanets: Array<Planet>;
        readonly outerPlanets: Array<Planet>;
    }
}
declare module "chart-factory" {
    import { Person, Point } from "person";
    import { Chart, ChartType } from "chart";
    /**
     * Usage: let chart: Chart = ChartFactory.create("my chart", person);
     */
    export class ChartFactory {
        static create(name: string, p1: Person, p2?: Person, type?: ChartType): Promise<Chart>;
        /**
         * Calculates the lat/lon of the geographic midpoint between two lat/lon pairs
         * @param  {Point} p1 Latitude/longitude of first location
         * @param  {Point} p2 Latitude/longitude of second location
         * @return {Point} The latitude/longitude of the geographic midpoint
         */
        static getGeoMidpoint(p1: Point, p2: Point): Point;
        /**
         * Finds the exact midpoint between two dates
         * @param  {string} date1 The first date
         * @param  {string} date2 The second date
         * @return {string}       The midpoint date as an ISO 8601 string
         */
        static getDatetimeMidpoint(date1: string, date2: string): string;
        /**
         * Converts decimal degrees to radians
         * @param  {number} degrees Decimal representation of degrees to be converted
         * @return {number}         Returns radians
         */
        static toRadians: (degrees: number) => number;
        /**
         * Converts radians to decimal degrees
         * @param  {number} radians Radians to be converted
         * @return {number}         Returns decimal degrees
         */
        static toDegrees: (radians: number) => number;
    }
}
declare module "astrologyjs" {
    export { Planet } from "planet";
    export { Person, Point } from "person";
    export { Aspect } from "aspect";
    export { Chart, ChartType } from "chart";
    export { ChartFactory } from "chart-factory";
}
