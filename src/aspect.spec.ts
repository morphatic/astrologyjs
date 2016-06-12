/// <reference path="../typings/index.d.ts" />
import { Aspect } from "./aspect";
import { Planet } from "./planet";

describe("An Aspect", () => {

    let a: Aspect;

    /**
     * Planets at 2016-06-07 1:00AM EDT, Harrisonburg, VA
     */
    beforeEach(() => {
        let venus     = new Planet("Venus",       76.964243,  0.006298,  1.228344),
            pluto     = new Planet("Pluto",      286.924401,  1.416432, -0.020512);
        a = new Aspect(venus, pluto);
    });

    it("throws an error if there is no aspect between the planets", () => {
        let moon = new Planet("Moon",       105.106905, -4.432968, 14.105873),
            mars = new Planet("Mars",       236.530798, -1.912147, -0.289540),
            ua: Aspect;
        try {
            ua = new Aspect(moon, mars);
        } catch(err) {
            expect(err.message).toBe("There is no aspect between these two planets.");
        }
    });

    it("has two planets", () => {
        expect(a.p1).toBeDefined();
        expect(a.p1.name).toBe("Venus");
        expect(a.p2).toBeDefined();
        expect(a.p2.name).toBe("Pluto");
    });

    it("has a type", () => {
        expect(a.type).toBeDefined();
        expect(a.type).toBe("inconjunct");
    });

    it("has a symbol", () => {
        expect(a.symbol).toBeDefined();
        expect(a.symbol).toBe("n");
    });

    it("can be considered 'major' or 'minor'", () => {
        expect(a.isMajor).toBeDefined();
        expect(a.isMajor()).toBe(false);
    });

    it("has an orb", () => {
        expect(a.orb).toBeDefined();
        expect(a.orb).toBe(0.039842);
    });

    it("is applying or separating", () => {
        let moon      = new Planet("Moon",       105.106905, -4.432968, 14.105873),
            mercury   = new Planet("Mercury",     53.033163, -3.428666,  1.052675),
            mars      = new Planet("Mars",       236.530798, -1.912147, -0.289540),
            jupiter   = new Planet("Jupiter",    164.462849,  1.268437,  0.081820),
            saturn    = new Planet("Saturn",     252.825595,  1.798099, -0.073836),
            neptune   = new Planet("Neptune",    342.027801, -0.836814,  0.003678),
            northnode = new Planet("North Node", 167.118052,  0.000000, -0.154248),
            cupido    = new Planet("Cupido",     266.223864,  0.776123, -0.020065);

        // return type should be boolean
        expect(a.isApplying()).toEqual(jasmine.any(Boolean));

        // should be false since aspect is separating
        expect(a.isApplying()).toBe(false);

        // testing a variety of aspects that are separating or applying
        // under various conditions
        a = new Aspect(mars, cupido);
        expect(a.isApplying()).toBe(true);
        a = new Aspect(mars, jupiter);
        expect(a.isApplying()).toBe(true);
        a = new Aspect(mercury, neptune);
        expect(a.isApplying()).toBe(true);
        // a = new Aspect(mars, northnode); // this test is out of orb, but works
        // expect(a.isApplying()).toBe(false);
        a = new Aspect(moon, saturn);
        expect(a.isApplying()).toBe(false);
        a = new Aspect(moon, neptune);
        expect(a.isApplying()).toBe(false);
    });
});