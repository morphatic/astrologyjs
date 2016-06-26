/// <reference path="../typings/index.d.ts" />
import { Chart, Person, ChartFactory, ChartType } from "./astrologyjs";

describe("A Chart Factory", () => {

    let c: Chart,
        morgan: Person,
        nicole: Person,
        testAsync = (runAsync) => { return (done) => { runAsync().then(done, e => { fail(e); done(); }); }; };

    beforeAll(testAsync(async () => {
        morgan = await Person.create("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932});
        nicole = await Person.create("Nicole", "1976-04-25T13:02Z", {lat: 35.2033533, lng: -80.9796095});
    }));

    it("can convert degrees to radians", () => {
        expect(ChartFactory.toRadians(180)).toBeCloseTo(3.14159, 5);
    });

    it("can convert radians to degrees", () => {
        expect(ChartFactory.toDegrees(3.14159)).toBeCloseTo(180, 2);
    });

    it("can find the geographic midpoint of two lat/lng pairs", () => {
        let mp = ChartFactory.getGeoMidpoint(morgan.location, nicole.location);
        expect(mp.lat).toBeCloseTo( 36.32411, 5);
        expect(mp.lng).toBeCloseTo(-80.09730, 5);
    });

    it("can find the datetime midpoint between two datetimes", () => {
        let d1 = "1974-02-17T23:30:00.000Z",
            d2 = "1976-04-25T13:02:00.000Z";
        expect(ChartFactory.getDatetimeMidpoint(d1, d2)).toBe("1975-03-23T18:16:00.000Z");
        expect(ChartFactory.getDatetimeMidpoint(d2, d1)).toBe("1975-03-23T18:16:00.000Z");
        expect(ChartFactory.getDatetimeMidpoint(d1, d1)).toBe(d1);
    });

    it("can get correct chart data", testAsync(async () => {
        let date = "1974-02-17T23:30:00.000Z", // this is LOCAL time, NOT corrected for time zone
            p = {
                lat: 37.4381927,
                lng: -79.18932
            },
            expected = {"planets":{"sun":{"name":"sun","lon":328.928849,"lat":-0.000030,"spd":1.009225,"r":0},"moon":{"name":"moon","lon":282.376739,"lat":1.370274,"spd":11.765058,"r":0},"mercury":{"name":"mercury","lon":341.436442,"lat":2.930657,"spd":-0.369939,"r":1},"venus":{"name":"venus","lon":296.234418,"lat":6.898336,"spd":0.180950,"r":0},"mars":{"name":"mars","lon":54.859512,"lat":1.560358,"spd":0.535861,"r":0},"jupiter":{"name":"jupiter","lon":325.604490,"lat":-0.768867,"spd":0.239856,"r":0},"saturn":{"name":"saturn","lon":87.876187,"lat":-0.907421,"spd":-0.018641,"r":1},"uranus":{"name":"uranus","lon":207.650784,"lat":0.599481,"spd":-0.015184,"r":1},"neptune":{"name":"neptune","lon":249.481255,"lat":1.582277,"spd":0.012389,"r":0},"pluto":{"name":"pluto","lon":186.394398,"lat":17.038291,"spd":-0.020345,"r":1},"north node":{"name":"north node","lon":266.806626,"lat":0.000000,"spd":-0.041911,"r":1},"south node":{"name":"south node","lon":86.806626,"lat":0.000000,"spd":-0.041911,"r":1},"chiron":{"name":"chiron","lon":17.572261,"lat":1.075862,"spd":0.042981,"r":0},"pholus":{"name":"pholus","lon":336.731188,"lat":-15.156539,"spd":0.050265,"r":0},"ceres":{"name":"ceres","lon":308.550770,"lat":-5.365279,"spd":0.386702,"r":0},"pallas":{"name":"pallas","lon":289.569620,"lat":28.398472,"spd":0.358521,"r":0},"juno":{"name":"juno","lon":304.984621,"lat":8.062667,"spd":0.396055,"r":0},"vesta":{"name":"vesta","lon":197.431809,"lat":10.398225,"spd":-0.007200,"r":1},"cupido":{"name":"cupido","lon":208.369943,"lat":1.060455,"spd":-0.008330,"r":1},"chariklo":{"name":"chariklo","lon":4.202544,"lat":20.675991,"spd":0.056467,"r":0},"chaos":{"name":"chaos","lon":24.103632,"lat":-4.986552,"spd":0.015641,"r":0},"eris":{"name":"eris","lon":12.620390,"lat":-20.186308,"spd":0.008337,"r":0},"nessus":{"name":"nessus","lon":83.280862,"lat":13.098433,"spd":-0.011314,"r":1}},"houses":[156.240991,180.773240,209.977632,242.916806,276.680605,308.179752,336.240991,0.773240,29.977632,62.916806,96.680605,128.179752],"ascendant":156.240991,"mc":62.916806},
            data = await ChartFactory.getChartData(date, p);
        expect(data).toEqual(expected);
    }));

    it("instantiates a basic chart", testAsync( async () => {
        c = await ChartFactory.create("Morgan natal", morgan);
        expect(c instanceof Chart).toBe(true);
        expect(c._planets1.length).toBe(23);
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a chart with transits", testAsync( async () => {
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2.length).toBe(23);
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a synastry chart", testAsync( async () => {
        c = await ChartFactory.create("Morgan/Nicole synastry", morgan, nicole, ChartType.Synastry);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2.length).toBe(23);
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a combined chart", testAsync( async () => {
        c = await ChartFactory.create("Morgan/Nicole Combined", morgan, nicole, ChartType.Combined);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2).not.toBeDefined();
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a Davison chart", testAsync( async () => {
        c = await ChartFactory.create("Morgan/Nicole Davison", morgan, nicole, ChartType.Davison);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2).not.toBeDefined();
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a combined chart with transits", testAsync( async () => {
        c = await ChartFactory.create("Morgan/Nicole Combined", morgan, nicole, ChartType.CombinedTransits);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2.length).toBe(23);
        expect(c._aspects).toBeDefined();
    }));

    it("instantiates a Davison chart with transits", testAsync( async () => {
        c = await ChartFactory.create("Morgan/Nicole Davison", morgan, nicole, ChartType.DavisonTransits);
        expect(c._planets1.length).toBe(23);
        expect(c._planets2.length).toBe(23);
        expect(c._aspects).toBeDefined();
    }));

    it("throws an error if no name was specified", testAsync( async () => {
        try {
            c = await ChartFactory.create("", morgan);
        } catch (err) {
            expect(err.message).toBe("Chart must have a name (ChartFactory)");
        }
    }));

    it("throws an error if null name was specified", testAsync( async () => {
        try {
            c = await ChartFactory.create(null, morgan);
        } catch (err) {
            expect(err.message).toBe("Chart must have a name (ChartFactory)");
        }
    }));

    it("throws an error if undefined name was specified", testAsync( async () => {
        let name: string;
        try {
            c = await ChartFactory.create(name, morgan);
        } catch (err) {
            expect(err.message).toBe("Chart must have a name (ChartFactory)");
        }
    }));

    it("throws an error if first person is null", testAsync( async () => {
        try {
            c = await ChartFactory.create("Morgan natal", null);
        } catch (err) {
            expect(err.message).toBe("Person cannot be null or undefined (ChartFactory)");
        }
    }));

    it("throws an error if first person is undefined", testAsync( async () => {
        let person: Person;
        try {
            c = await ChartFactory.create("Morgan natal", person);
        } catch (err) {
            expect(err.message).toBe("Person cannot be null or undefined (ChartFactory)");
        }
    }));

    it("throws an error if second person is undefined for Synastry", testAsync( async () => {
        let person: Person;
        try {
            c = await ChartFactory.create("Morgan natal", morgan, person, ChartType.Synastry);
        } catch (err) {
            expect(err.message).toBe("2nd Person cannot be null for this chart type (ChartFactory)");
        }
    }));

});