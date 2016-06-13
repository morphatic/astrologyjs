/// <reference path="../typings/index.d.ts" />
import * as rp from "request-promise";
import { ChartFactory } from "./chart-factory";
import { Chart, ChartType } from "./chart";
import { Person } from "./person";

describe("A Chart", () => {

    let c: Chart,
        morgan: Person,
        nicole: Person;

    beforeAll(() => {
        morgan = new Person("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lon: -79.18932});
        nicole = new Person("Nicole", "1976-04-25T13:02Z", {lat: 35.2033533, lon: -80.9796095});
    });

    it("can find the midpoint of two longitudes", async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        expect(c.getLonMidpoint( 10,  20)).toBe( 15);
        expect(c.getLonMidpoint(  0, 180)).toBe( 90);
        expect(c.getLonMidpoint(350,  10)).toBe(  0);
        expect(c.getLonMidpoint(350,  20)).toBe(  5);
        expect(c.getLonMidpoint(340,  10)).toBe(355);
        expect(c.getLonMidpoint( 10,  10)).toBe( 10);
    });

    it("has a name", async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        expect(c.name).toBe("Morgan transits");
    });

    it("has a type", async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        expect(c.type).toBe(ChartType.Transits);
    });

    it("should allow transits to be refreshed/reset", async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        let old_aspects = c._aspects,
            nextweek = new Date();
        nextweek.setDate(nextweek.getDate() + 7);
        await c.refreshTransits(nextweek.toISOString());
        expect(c._aspects).not.toEqual(old_aspects);
    });

    it("should throw an error if you try to refresh 'transits' on synastry", async () => {
        c = await ChartFactory.create("Morgan/Nicole synastry", morgan, nicole, ChartType.Synastry);
        try {
            c.refreshTransits();
        } catch(err) {
            expect(err.message).toBe("You cannot refresh transits on a synastry chart");
        }
    });

    it("outputs data in a d3-friendly way", async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        let d3data = c.getD3Data(500, 520);
        expect(d3data.innerPlanets).toBeDefined();
        expect(d3data.outerPlanets).toBeDefined();
        expect(d3data.houses).toBeDefined();
        expect(d3data.ascendant).toBeDefined();
        expect(d3data.aspects).toBeDefined();
        expect(d3data.name).toBeDefined();
    });

});