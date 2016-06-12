import * as rp from "request-promise";
import { Point } from "./point";

export class Person {

    private _key: string = "AIzaSyAXnIdQxap1WQuzG0XxHfYlCA5O9GQyvuY";

    location: Point;

    /**
     * Creates a Person (or Event) object
     * @param {string} public name Name of the person or event
     * @param {string} public date UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param {Point|string} location An address or lat/lon of the event or person's birthplace
     */
    constructor(public name:string, public date: string, location: Point | string) {
        // make sure a name was submitted
        if (!name) {
            throw new Error("No name was submitted for the person/event");
        }

        // make sure valid date was submitted
        if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}\.\d{3})?Z/.test(date)) {
            throw new TypeError("Date not formatted according to ISO 8601 (YYYY-MM-DDTHH:mmZ)");
        }

        if (typeof location === "string") {
            this.getLatLon(location).then((p: Point) => {this.location = p;});
        } else {
            // make sure latitude was valid
            if (location.lat < -90 || location.lat > 90) {
                throw new RangeError("Latitude must be between -90 and 90");
            }
            // make sure longitude was valid
            if (location.lon < -180 || location.lon > 180) {
                throw new RangeError("Longitude must be between -180 and 180");
            }
            this.location = location;
        }

    }

    /**
     * Gets a timezone given a latitude and longitude
     * @param {Point} p  Contains the latitude and longitude in decimal format
     */
    async getTimezone(p: Point) {
        return await rp({
            uri: "https://maps.googleapis.com/maps/api/timezone/json",
            qs: {
                key: this._key,
                location: `${p.lat},${p.lon}`,
                timestamp: Math.floor(Date.now()/1000)
            },
            json: true
        }).then(tzinfo => tzinfo.timeZoneId);
    }

    // TODO: error checking and other functionality from old project?
    /**
     * Get a latitude and longitude given an address
     * @param {string} address The address of the desired lat/lon
     */
    async getLatLon(address: string) {
        return await rp({
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                key: this._key,
                address: address
            },
            json: true
        }).then((latlon): Point => latlon.results[0].geometry.location);
    }

}
