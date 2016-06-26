/// <reference path="../typings/index.d.ts" />
export declare class Planet {
    name: string;
    longitude: number;
    latitude: number;
    speed: number;
    symbol: string;
    private symbols;
    constructor(name: string, lon: number, lat: number, spd: number);
    isRetrograde(): boolean;
    isMajor(): boolean;
}
export interface GoogleLocation {
    lat: number;
    lng: number;
}
export declare type Point = GoogleLocation;
export declare class Person {
    name: string;
    date: string;
    location: Point;
    private static _key;
    constructor(name: string, date: string, location: Point);
    static create(name: string, date: Date | string, location: Point | string): Promise<Person>;
    static getTimezone(p: Point): Promise<string>;
    static getLatLon(address: string): Promise<Point>;
}
export declare type Event = Person;
export declare class Aspect {
    p1: Planet;
    p2: Planet;
    private _type;
    private _orb;
    private _applying;
    private _types;
    constructor(p1: Planet, p2: Planet);
    type: string;
    orb: number;
    symbol: string;
    isApplying(): boolean;
    isMajor(): boolean;
}
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
    _signs: {
        name: string;
        symbol: string;
        v: number;
    }[];
    constructor(name: string, p1: Person, cdata: ChartDataArray, p2?: Person, type?: ChartType);
    getPlanets(cdata: ChartData): Array<Planet>;
    calculateAspects(): void;
    calculateCombinedPlanets(cdata: ChartDataArray): ChartData;
    getLonMidpoint(l1: number, l2: number): number;
    refreshTransits(date?: string): Promise<void>;
    houses: Array<number>;
    aspects: Array<Aspect>;
    ascendant: number;
    innerPlanets: Array<Planet>;
    outerPlanets: Array<Planet>;
}
export declare class ChartFactory {
    static create(name: string, p1: Person | Event, p2?: Person | Event, type?: ChartType): Promise<Chart>;
    static getGeoMidpoint(p1: Point, p2: Point): Point;
    static getDatetimeMidpoint(date1: string, date2: string): string;
    static getChartData(date: string, p: Point): Promise<ChartData>;
    static toRadians: (degrees: number) => number;
    static toDegrees: (radians: number) => number;
}
