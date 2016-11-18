import { Person } from "./person";
import { Planet } from "./planet";
import { Chart, ChartType, ChartDataArray } from "./chart";
import { ChartFactory } from "./chart-factory";

describe("A Chart", () => {

    let c: Chart,
        morgan: Person,
        nicole: Person,
        cdata: ChartDataArray,
        testAsync = (runAsync: any) => { return (done: any) => { runAsync().then(done, (e: any) => { fail(e); done(); }); }; };

    beforeAll(testAsync( async () => {
        cdata = [
            {"planets":{"sun":{"name":"sun","lon":328.928849,"lat":-0.000030,"spd":1.009225,"r":0},"moon":{"name":"moon","lon":282.376739,"lat":1.370274,"spd":11.765058,"r":0},"mercury":{"name":"mercury","lon":341.436442,"lat":2.930657,"spd":-0.369939,"r":1},"venus":{"name":"venus","lon":296.234418,"lat":6.898336,"spd":0.180950,"r":0},"mars":{"name":"mars","lon":54.859512,"lat":1.560358,"spd":0.535861,"r":0},"jupiter":{"name":"jupiter","lon":325.604490,"lat":-0.768867,"spd":0.239856,"r":0},"saturn":{"name":"saturn","lon":87.876187,"lat":-0.907421,"spd":-0.018641,"r":1},"uranus":{"name":"uranus","lon":207.650784,"lat":0.599481,"spd":-0.015184,"r":1},"neptune":{"name":"neptune","lon":249.481255,"lat":1.582277,"spd":0.012389,"r":0},"pluto":{"name":"pluto","lon":186.394398,"lat":17.038291,"spd":-0.020345,"r":1},"north node":{"name":"north node","lon":266.806626,"lat":0.000000,"spd":-0.041911,"r":1},"south node":{"name":"south node","lon":86.806626,"lat":0.000000,"spd":-0.041911,"r":1},"chiron":{"name":"chiron","lon":17.572261,"lat":1.075862,"spd":0.042981,"r":0},"pholus":{"name":"pholus","lon":336.731188,"lat":-15.156539,"spd":0.050265,"r":0},"ceres":{"name":"ceres","lon":308.550770,"lat":-5.365279,"spd":0.386702,"r":0},"pallas":{"name":"pallas","lon":289.569620,"lat":28.398472,"spd":0.358521,"r":0},"juno":{"name":"juno","lon":304.984621,"lat":8.062667,"spd":0.396055,"r":0},"vesta":{"name":"vesta","lon":197.431809,"lat":10.398225,"spd":-0.007200,"r":1},"cupido":{"name":"cupido","lon":208.369943,"lat":1.060455,"spd":-0.008330,"r":1},"chariklo":{"name":"chariklo","lon":4.202544,"lat":20.675991,"spd":0.056467,"r":0},"chaos":{"name":"chaos","lon":24.103632,"lat":-4.986552,"spd":0.015641,"r":0},"eris":{"name":"eris","lon":12.620390,"lat":-20.186308,"spd":0.008337,"r":0},"nessus":{"name":"nessus","lon":83.280862,"lat":13.098433,"spd":-0.011314,"r":1}},"houses":[156.240991,180.773240,209.977632,242.916806,276.680605,308.179752,336.240991,0.773240,29.977632,62.916806,96.680605,128.179752],"ascendant":156.240991,"mc":62.916806},
            {"planets":{"sun":{"name":"sun","lon":35.442089,"lat":0.000029,"spd":0.973526,"r":0},"moon":{"name":"moon","lon":353.294510,"lat":4.012451,"spd":11.877258,"r":0},"mercury":{"name":"mercury","lon":55.586041,"lat":2.615789,"spd":1.181069,"r":0},"venus":{"name":"venus","lon":21.142542,"lat":-1.439301,"spd":1.230699,"r":0},"mars":{"name":"mars","lon":108.603737,"lat":1.862012,"spd":0.529565,"r":0},"jupiter":{"name":"jupiter","lon":37.109579,"lat":-0.965454,"spd":0.239407,"r":0},"saturn":{"name":"saturn","lon":116.771040,"lat":0.409800,"spd":0.050679,"r":0},"uranus":{"name":"uranus","lon":215.105574,"lat":0.512017,"spd":-0.042658,"r":1},"neptune":{"name":"neptune","lon":253.544914,"lat":1.562902,"spd":-0.019719,"r":1},"pluto":{"name":"pluto","lon":189.660445,"lat":17.432513,"spd":-0.024474,"r":1},"north node":{"name":"north node","lon":222.554240,"lat":0.000000,"spd":-0.016781,"r":1},"south node":{"name":"south node","lon":42.554240,"lat":0.000000,"spd":-0.016781,"r":1},"chiron":{"name":"chiron","lon":28.137774,"lat":0.155979,"spd":0.060207,"r":0},"pholus":{"name":"pholus","lon":345.437169,"lat":-17.230007,"spd":0.039561,"r":0},"ceres":{"name":"ceres","lon":84.405993,"lat":3.140844,"spd":0.380391,"r":0},"pallas":{"name":"pallas","lon":37.364146,"lat":-18.797203,"spd":0.477827,"r":0},"juno":{"name":"juno","lon":153.874507,"lat":0.578755,"spd":0.036195,"r":0},"vesta":{"name":"vesta","lon":45.474994,"lat":-4.195343,"spd":0.441170,"r":0},"cupido":{"name":"cupido","lon":210.073457,"lat":1.085218,"spd":-0.020578,"r":1},"chariklo":{"name":"chariklo","lon":16.979395,"lat":21.636602,"spd":0.064126,"r":0},"chaos":{"name":"chaos","lon":27.979222,"lat":-4.436924,"spd":0.024757,"r":0},"eris":{"name":"eris","lon":13.809362,"lat":-19.749967,"spd":0.010550,"r":0},"nessus":{"name":"nessus","lon":90.255766,"lat":13.471750,"spd":0.034701,"r":0}},"houses":[76.568871,99.082115,120.919979,145.939862,177.804532,217.261090,256.568871,279.082115,300.919979,325.939862,357.804532,37.261090],"ascendant":76.568871,"mc":325.939862}
        ];
        morgan = await Person.create("Morgan", "1974-02-17T23:30Z", {lat: 37.4381927, lng: -79.18932});
        nicole = await Person.create("Nicole", "1976-04-25T13:02Z", {lat: 35.2033533, lng: -80.9796095});
        c = await ChartFactory.create("Morgan transits", morgan, null, ChartType.Transits);
    }));

    it("can find the midpoint of two longitudes", () => {
        expect(c.getLonMidpoint( 10,  20)).toBe( 15);
        expect(c.getLonMidpoint(  0, 180)).toBe( 90);
        expect(c.getLonMidpoint(350,  10)).toBe(  0);
        expect(c.getLonMidpoint(350,  20)).toBe(  5);
        expect(c.getLonMidpoint(340,  10)).toBe(355);
        expect(c.getLonMidpoint( 10,  10)).toBe( 10);
    });

    it("has a name", () => {
        expect(c.name).toBe("Morgan transits");
    });

    it("has a type", () => {
        expect(c.type).toBe(ChartType.Transits);
    });

    it("can take chart data and return an array of Planet objects", () => {
        let planets = c.getPlanets(cdata[0]);
        expect(planets.length).toBe(23);
        expect(planets[0] instanceof Planet).toBe(true);
    });

    it("should allow transits to be refreshed/reset", testAsync(async () => {
        let old_aspects = c._aspects,
            nextweek = new Date();
        nextweek.setDate(nextweek.getDate() + 7);
        await c.refreshTransits(nextweek.toISOString());
        expect(c._aspects).not.toEqual(old_aspects);
    }));

    it("should allow transits to be refreshed/reset defaulting to Date.now() if date unspecified", testAsync(async () => {
        try {
            let old_aspects = c._aspects;
            await c.refreshTransits();
            expect(c._aspects).not.toEqual(old_aspects);
        } catch (err) {
            console.log();
        }
    }));

    it("should throw an error if you try to refresh 'transits' on synastry", testAsync( async () => {
        c = await ChartFactory.create("Morgan transits", morgan, nicole, ChartType.Synastry);
        try {
            c.refreshTransits();
        } catch (err) {
            expect(err.message).toBe("You cannot refresh transits on a synastry chart");
        }
    }));

    it("should allow access to the array of houses", () => {
        expect(c.houses.length).toBe(12);
    });

    it("should allow access to the aspects array", () => {
        expect(c.aspects.length).toBeGreaterThan(0);
    });

    it("should allow access to the ascendant", () => {
        expect(c.ascendant).toBeTruthy();
    });

    it("should allow access to the array of inner planets", () => {
        expect(c.innerPlanets.length).toBe(23);
    });

    it("should allow access to the array of outer planets", () => {
        expect(c.outerPlanets.length).toBe(23);
    });

    it("returns an empty array if there are no inner planets", testAsync( async () => {
        c = await ChartFactory.create("Morgan transits", morgan);
        expect(c.innerPlanets.length).toBe(0);
    }));

    it("returns outer planets even if there are no inner planets", testAsync( async () => {
        c = await ChartFactory.create("Morgan transits", morgan);
        expect(c.outerPlanets.length).toBe(23);
    }));

});