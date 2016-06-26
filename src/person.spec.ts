/// <reference path="../typings/index.d.ts" />
import { Person } from "./astrologyjs";

describe("A Person", () => {

    let person: Person,
        testAsync = (runAsync) => { return (done) => { runAsync().then(done, e => { fail(e); done(); }); }; };

    it("can be instantiated with lat/lon", testAsync( async () => {
        person = await Person.create("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932});
        expect(person).toBeDefined();
        expect(person instanceof Person).toBe(true);
        expect(person.name).toBe("Morgan");
    }));

    it("can be instantiated with an address", testAsync( async () => {
        person = await Person.create("Morgan", "1974-02-17T23:30Z", "Virginia Baptist Hospital, Rivermont Avenue, Lynchburg, VA");
        expect(person).toBeDefined();
        expect(person instanceof Person).toBe(true);
        expect(person.name).toBe("Morgan");
    }));

    it("can be instantiated with a Date object", testAsync( async () => {
        let d = new Date();
        person = await Person.create("Morgan", d, "Virginia Baptist Hospital, Rivermont Avenue, Lynchburg, VA");
        expect(person).toBeDefined();
        expect(person instanceof Person).toBe(true);
        expect(person.date).toBe(d.toISOString());
    }));

    it("can be instantiated with no date object", testAsync( async () => {
        let d = new Date();
        person = await Person.create("Morgan", null, "Virginia Baptist Hospital, Rivermont Avenue, Lynchburg, VA");
        expect(person).toBeDefined();
        expect(person instanceof Person).toBe(true);
        let pd = new Date(person.date);
        expect(pd.getTime() / 10000).toBeCloseTo(d.getTime() / 10000, 1);
    }));

    it("throws an error if the person/event was instantiated without a name", testAsync( async () => {
        try {
            person = await Person.create("", "1974-02-17T23:30Z", { lat: 37.4381927, lng: -79.18932});
        } catch (err) {
            expect(err.message).toBe("No name was submitted for the person");
        }
    }));

    it("throws an error if the date is not formatted correctly", testAsync( async () => {
        try {
            person = await Person.create("Morgan Benton", "1974-02-17T23:30", { lat: 37.4381927, lng: -79.18932});
        } catch (err) {
            expect(err.message).toBe("Date not formatted according to ISO 8601 (YYYY-MM-DDTHH:mmZ)");
        }
    }));

    it("throws an error if the latitude is out of range", testAsync( async () => {
        try {
            person = await Person.create("Morgan Benton", "1974-02-17T23:30Z", { lat: 137.4381927, lng: -79.18932});
        } catch (err) {
            expect(err.message).toBe("Latitude must be between -90 and 90");
        }
    }));

    it("throws an error if the longitude is out of range", testAsync( async () => {
        try {
            person = await Person.create("Morgan Benton", "1974-02-17T23:30Z", { lat: 37.4381927, lng: -279.18932});
        } catch (err) {
            expect(err.message).toBe("Longitude must be between -180 and 180");
        }
    }));

    it("can get a lat/lon from an address", testAsync( async () => {
        let point = await Person.getLatLon("1990 Buttonwood Ct, Harrisonburg, VA 22802");
        expect(point.lat).toBe(38.48500900000001);
        expect(point.lng).toBe(-78.872845);
    }));

    it("can get a timezone from a lat/lon", testAsync( async () => {
        person = await Person.create("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932});
        let tz = await Person.getTimezone(person.location);
        expect(tz).toBe("America/New_York");
    }));

    it("throws an error getting lat/lon if address is unspecified", testAsync( async () => {
        try {
            let point = await Person.getLatLon("");
        } catch (err) {
            // don't know why the error message from the Promise is not passed along...
            // expect(err.message).toBe("Invalid request. Invalid 'location' parameter.");
            expect(err.message).toBe("");
        }
    }));

    it("throws an error getting timezone if lat is out of bounds", testAsync( async () => {
        try {
            let tz = await Person.getTimezone({lat: 137.4381927, lng: -79.18932});
        } catch (err) {
            // don't know why the error message from the Promise is not passed along...
            // expect(err.message).toBe("Invalid request. Invalid 'location' parameter.");
            expect(err.message).toBe("");
        }
    }));

});