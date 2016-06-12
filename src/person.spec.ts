/// <reference path="../typings/index.d.ts" />
import { Person } from "./person";

describe("A Person or Event", () => {

    it("can be instantiated with lat/lon", () => {
        let person = new Person("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lon: -79.18932});
        expect(person).toBeDefined();
    });

    it("can be instantiated with an address", async () => {
        let person = await new Person("Morgan", "1974-02-17T23:30Z", "Virginia Baptist Hospital, Rivermont Avenue, Lynchburg, VA");
        expect(person).toBeDefined();
    });

    it("throws an error if the person/event was instantiated without a name", () => {
        let p: Person;
        try {
            p = new Person("", "1974-02-17T23:30Z", { lat: 37.4381927, lon: -79.18932});
        } catch (err) {
            expect(err.message).toBe("No name was submitted for the person/event");
        }
    });

    it("throws an error if the date is not formatted correctly", () => {
        let p: Person;
        try {
            p = new Person("Morgan Benton", "1974-02-17T23:30", { lat: 37.4381927, lon: -79.18932});
        } catch (err) {
            expect(err.message).toBe("Date not formatted according to ISO 8601 (YYYY-MM-DDTHH:mmZ)");
        }
    });

    it("throws an error if the latitude is out of range", () => {
        let p: Person;
        try {
            p = new Person("Morgan Benton", "1974-02-17T23:30Z", { lat: 137.4381927, lon: -79.18932});
        } catch (err) {
            expect(err.message).toBe("Latitude must be between -90 and 90");
        }
    });

    it("throws an error if the longitude is out of range", () => {
        let p: Person;
        try {
            p = new Person("Morgan Benton", "1974-02-17T23:30Z", { lat: 37.4381927, lon: -279.18932});
        } catch (err) {
            expect(err.message).toBe("Longitude must be between -180 and 180");
        }
    });

    it("can get a lat/lon from an address", async () => {
        let person = await new Person("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lon: -79.18932}),
            point = await person.getLatLon("1990 Buttonwood Ct, Harrisonburg, VA 22802");
        expect(point.lat).toBe(38.48500900000001);
        expect(point.lon).toBe(-78.872845);
    });

    it("can get a timezone from a lat/lon", async () => {
        let person = await new Person("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lon: -79.18932}),
            tz = await person.getTimezone(person.location);
        expect(tz.timeZoneId).toBe("America/New_York");
    });

});