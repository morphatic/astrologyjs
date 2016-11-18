import { Person, Point } from "./person";
import { Chart, ChartType, ChartData } from "./chart";
/**
 * Usage: let chart: Chart = ChartFactory.create("my cart", person);
 */
export declare class ChartFactory {
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
     * Gets chart data from the online ephemeris
     * @param {string} date A UTC datetime string in ISO 8601 format
     * @param {Point}  p    An object with numeric lat and lng properties
     * @return {Promise<ChartData>}  A JSON object with the data needed to implement a chart
     */
    static getChartData(date: string, p: Point): Promise<ChartData>;
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
