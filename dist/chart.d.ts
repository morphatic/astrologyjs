import { Person } from "./person";
import { Planet } from "./planet";
import { Aspect } from "./aspect";
export declare enum ChartType {
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
export declare class Chart {
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
