import { Planet } from "./planet";

describe("A Planet", () => {

    let p: Planet;

    beforeEach(() => p = new Planet("Sun", 75.853439, -0.000140, 0.957389));

    // check for existence of basic properties
    it("has a name",      () => { expect(p.name     ).toBeDefined(); });
    it("has a longitude", () => { expect(p.longitude).toBeDefined(); });
    it("has a latitude",  () => { expect(p.latitude ).toBeDefined(); });
    it("has a speed",     () => { expect(p.speed    ).toBeDefined(); });

    it("can be retrograde", () => {
        // check for return type
        expect(p.isRetrograde()).toEqual(jasmine.any(Boolean));
        // check for return value false if direct
        expect(p.isRetrograde()).toBe(false);
        // and true if retrograde
        p.speed = -p.speed;
        expect(p.isRetrograde()).toBe(true);
    });

    it("has a symbol", () => {
        expect(p.symbol).toBe("a");
    });

    it("can be considered 'major' or 'minor'", () => {
        expect(p.isMajor()).toBe(true);
    });

});