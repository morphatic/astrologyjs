import { Person, Point } from "./person";
import { Chart, ChartType, ChartData } from "./chart";

/**
 * Usage: let chart: Chart = ChartFactory.create("my chart", person);
 */
export class ChartFactory {

    static async create(name: string, p1: Person, p2: Person = null, type: ChartType = ChartType.Basic) {
        // make sure a name was passed in
        if (null === name || "undefined" === typeof name || 0 === name.length) {
            throw Error("Chart must have a name (ChartFactory)");
        }
        // check for undefined people
        if (null === p1 || typeof p1 === "undefined") {
            throw Error("Person cannot be null or undefined (ChartFactory)");
        }
        switch (type) {
            case ChartType.Synastry:
            case ChartType.Combined:
            case ChartType.CombinedTransits:
            case ChartType.Davison:
                if (null === p2) {
                    throw Error("2nd Person cannot be null for this chart type (ChartFactory)");
                }
        }

        let cdata: Array<ChartData> = [], date: string, p: Point;
        switch (type) {
            case ChartType.Transits:
                cdata = await Promise.all([
                    Chart.getChartData(p1.date, p1.location),
                    Chart.getChartData(new Date().toISOString(), p1.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.Synastry:
            case ChartType.Combined:
                cdata = await Promise.all([
                    Chart.getChartData(p1.date, p1.location),
                    Chart.getChartData(p2.date, p2.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.CombinedTransits:
                cdata = await Promise.all([
                    Chart.getChartData(p1.date, p1.location),
                    Chart.getChartData(p2.date, p2.location),
                    Chart.getChartData(new Date().toISOString(), p1.location)
                ]);
                return new Chart(name, p1, cdata, null, type);
            case ChartType.Davison:
                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                cdata.push(await Chart.getChartData(date, p));
                return new Chart(name, p1, cdata);
            case ChartType.DavisonTransits:
                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                cdata = await Promise.all([
                    Chart.getChartData(date, p),
                    Chart.getChartData(new Date().toISOString(), p)
                ]);
                return new Chart(name, p1, cdata, null, type);
            default:
                cdata.push(await Chart.getChartData(p1.date, p1.location));
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
