/// <reference path="../typings/index.d.ts" />
import * as rp from "request-promise";
import { Chart, ChartType, ChartData } from "./chart";
import { Person } from "./person";
import { Point  } from "./point";

export class ChartFactory {

    static async create(name: string, p1: Person, p2?: Person, type: ChartType = ChartType.Basic) {
        let cdata: Array<ChartData> = [], date: string, p: Point;
        switch(type) {
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
     * @param {Point} p1 Latitude/longitude of first location
     * @param {Point} p2 Latitude/longitude of second location
     * @return {Point} The latitude/longitude of the geographic midpoint
     */
    static getGeoMidpoint(p1: Point, p2: Point): Point {
        let lat1 = ChartFactory.toRadians( p1.lat ),
            lon1 = ChartFactory.toRadians( p1.lon ),
            lat2 = ChartFactory.toRadians( p2.lat ),
            lon2 = ChartFactory.toRadians( p2.lon ),
            bx   = Math.cos( lat2 ) * Math.cos( lon2 - lon1 ),
            by   = Math.cos( lat2 ) * Math.sin( lon2 - lon1 ),
            lon3 = lon1 + Math.atan2( by, Math.cos( lat1 ) + bx ),
            lat3 = Math.atan2( Math.sin( lat1 ) + Math.sin( lat2 ),
                   Math.sqrt( Math.pow( Math.cos( lat1 ) + bx, 2 ) + Math.pow( by, 2 ) ) );
        
        return { 
            lat: ChartFactory.toDegrees( lat3 ), 
            lon: ChartFactory.toDegrees( lon3 )
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
     * @param {number} lat  The latitude for the chart
     * @param {number} lon  The longitude for the chart
     */
    static async getChartData(date: string, p: Point) {
        return await rp({
            uri: "http://www.morphemeris.com/ephemeris.php",
            qs: {
                date: date,
                lat: p.lat,
                lon: p.lon
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