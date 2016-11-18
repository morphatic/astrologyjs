import { default as rp } from "./rp";

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
     * Creates a Person object
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
     * @return {Promise<Person>}          The Person object that was created
     */
    static async create(name: string, date: Date | string, location: Point | string): Promise<Person> {

        let dt: string,
            loc: Point;

        // make sure a name was submitted
        if (!name) {
            throw new Error("No name was submitted for the person");
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
            }
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
            }
        }).then(
            (latlng: GoogleGeocodeResult): Point => latlng.results[0].geometry.location,
            (error:  GoogleGeocodeResult): Point => { throw Error(error.error_message); }
        );
    }
}
