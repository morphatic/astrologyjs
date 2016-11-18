import { default as rp } from "./rp";

describe("A simple request-promise implementation", () => {

    let https_request = {
            uri: "https://maps.googleapis.com/maps/api/timezone/json",
            qs: {
                key: "AIzaSyAXnIdQxap1WQuzG0XxHfYlCA5O9GQyvuY",
                location: `38.4496,-78.8689`,
                timestamp: Math.floor(Date.now() / 1000).toString()
            }
        },
        http_request = {
            uri: "http://www.morphemeris.com/ephemeris.php",
            qs: {
                date: "1974-02-17T23:30Z",
                lat: 37.4381927,
                lng: -79.18932
            }
        },
        testAsync = (runAsync: any) => { return (done: any) => { runAsync().then(done, (e: any) => { fail(e); done(); }); }; };

    it("can make a basic http request", testAsync(async () => {
        let json = await rp(http_request),
            expected = {"planets":{"sun":{"name":"sun","lon":328.928849,"lat":-0.000030,"spd":1.009225,"r":0},"moon":{"name":"moon","lon":282.376739,"lat":1.370274,"spd":11.765058,"r":0},"mercury":{"name":"mercury","lon":341.436442,"lat":2.930657,"spd":-0.369939,"r":1},"venus":{"name":"venus","lon":296.234418,"lat":6.898336,"spd":0.180950,"r":0},"mars":{"name":"mars","lon":54.859512,"lat":1.560358,"spd":0.535861,"r":0},"jupiter":{"name":"jupiter","lon":325.604490,"lat":-0.768867,"spd":0.239856,"r":0},"saturn":{"name":"saturn","lon":87.876187,"lat":-0.907421,"spd":-0.018641,"r":1},"uranus":{"name":"uranus","lon":207.650784,"lat":0.599481,"spd":-0.015184,"r":1},"neptune":{"name":"neptune","lon":249.481255,"lat":1.582277,"spd":0.012389,"r":0},"pluto":{"name":"pluto","lon":186.394398,"lat":17.038291,"spd":-0.020345,"r":1},"north node":{"name":"north node","lon":266.806626,"lat":0.000000,"spd":-0.041911,"r":1},"south node":{"name":"south node","lon":86.806626,"lat":0.000000,"spd":-0.041911,"r":1},"chiron":{"name":"chiron","lon":17.572261,"lat":1.075862,"spd":0.042981,"r":0},"pholus":{"name":"pholus","lon":336.731188,"lat":-15.156539,"spd":0.050265,"r":0},"ceres":{"name":"ceres","lon":308.550770,"lat":-5.365279,"spd":0.386702,"r":0},"pallas":{"name":"pallas","lon":289.569620,"lat":28.398472,"spd":0.358521,"r":0},"juno":{"name":"juno","lon":304.984621,"lat":8.062667,"spd":0.396055,"r":0},"vesta":{"name":"vesta","lon":197.431809,"lat":10.398225,"spd":-0.007200,"r":1},"cupido":{"name":"cupido","lon":208.369943,"lat":1.060455,"spd":-0.008330,"r":1},"chariklo":{"name":"chariklo","lon":4.202544,"lat":20.675991,"spd":0.056467,"r":0},"chaos":{"name":"chaos","lon":24.103632,"lat":-4.986552,"spd":0.015641,"r":0},"eris":{"name":"eris","lon":12.620390,"lat":-20.186308,"spd":0.008337,"r":0},"nessus":{"name":"nessus","lon":83.280862,"lat":13.098433,"spd":-0.011314,"r":1}},"houses":[156.242746,180.775172,209.979694,242.918870,276.682568,308.181605,336.242746,0.775172,29.979694,62.918870,96.682568,128.181605],"ascendant":156.242746,"mc":62.918870};
        expect(json).toEqual(expected);
    }));

    it("can make a basic https request", testAsync(async () => {
        let json = await rp(https_request),
            expected = { dstOffset : 0, rawOffset : -18000, status : "OK", timeZoneId : "America/New_York", timeZoneName : "Eastern Standard Time" };
        expect(json).toEqual(expected);
    }));

    // TODO: write tests for failing cases

});