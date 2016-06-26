var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
let rp = require("request-promise");
export class Planet {
    constructor(name, lon, lat, spd) {
        this.symbols = {
            "sun": "a",
            "moon": "s",
            "mercury": "d",
            "venus": "f",
            "earth": "g",
            "mars": "h",
            "jupiter": "j",
            "saturn": "k",
            "uranus": "ö",
            "neptune": "ä",
            "pluto": "#",
            "south node": "?",
            "north node": "ß",
            "ceres": "A",
            "pallas": "S",
            "juno": "D",
            "vesta": "F",
            "lilith": "ç",
            "cupido": "L",
            "chiron": "l",
            "nessus": "ò",
            "pholus": "ñ",
            "chariklo": "î",
            "eris": "È",
            "chaos": "Ê",
            "fortuna": "%"
        };
        this.name = name;
        this.longitude = lon;
        this.latitude = lat;
        this.speed = spd;
        this.symbol = this.symbols[name.toLowerCase()];
    }
    isRetrograde() {
        return this.speed < 0;
    }
    isMajor() {
        return ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
            "uranus", "neptune", "pluto", "north node", "south node"]
            .indexOf(this.name.toLowerCase()) > -1;
    }
}
export class Person {
    constructor(name, date, location) {
        this.name = name;
        this.date = date;
        this.location = location;
    }
    static create(name, date, location) {
        return __awaiter(this, void 0, Promise, function* () {
            let dt, loc;
            if (!name) {
                throw new Error("No name was submitted for the person/event");
            }
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
                dt = new Date().toISOString();
            }
            if (typeof location === "string") {
                loc = yield this.getLatLon(location);
            }
            else {
                if (location.lat < -90 || location.lat > 90) {
                    throw new RangeError("Latitude must be between -90 and 90");
                }
                if (location.lng < -180 || location.lng > 180) {
                    throw new RangeError("Longitude must be between -180 and 180");
                }
                loc = location;
            }
            return new Person(name, dt, loc);
        });
    }
    static getTimezone(p) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield rp({
                uri: "https://maps.googleapis.com/maps/api/timezone/json",
                qs: {
                    key: this._key,
                    location: `${p.lat},${p.lng}`,
                    timestamp: Math.floor(Date.now() / 1000)
                },
                json: true
            }).then((tzinfo) => tzinfo.timeZoneId, (error) => { throw Error(error.errorMessage); });
        });
    }
    static getLatLon(address) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield rp({
                uri: "https://maps.googleapis.com/maps/api/geocode/json",
                qs: {
                    key: this._key,
                    address: address
                },
                json: true
            }).then((latlng) => latlng.results[0].geometry.location, (error) => { throw Error(error.error_message); });
        });
    }
}
Person._key = "AIzaSyAXnIdQxap1WQuzG0XxHfYlCA5O9GQyvuY";
export class Aspect {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this._types = {
            "conjunct": { major: true, angle: 0, orb: 6, symbol: "<" },
            "semisextile": { major: false, angle: 30, orb: 3, symbol: "y" },
            "decile": { major: false, angle: 36, orb: 1.5, symbol: ">" },
            "novile": { major: false, angle: 40, orb: 1.9, symbol: "M" },
            "semisquare": { major: false, angle: 45, orb: 3, symbol: "=" },
            "septile": { major: false, angle: 51.417, orb: 2, symbol: "V" },
            "sextile": { major: true, angle: 60, orb: 6, symbol: "x" },
            "quintile": { major: false, angle: 72, orb: 2, symbol: "Y" },
            "bilin": { major: false, angle: 75, orb: 0.9, symbol: "-" },
            "binovile": { major: false, angle: 80, orb: 2, symbol: ";" },
            "square": { major: true, angle: 90, orb: 6, symbol: "c" },
            "biseptile": { major: false, angle: 102.851, orb: 2, symbol: "N" },
            "tredecile": { major: false, angle: 108, orb: 2, symbol: "X" },
            "trine": { major: true, angle: 120, orb: 6, symbol: "Q" },
            "sesquiquadrate": { major: false, angle: 135, orb: 3, symbol: "b" },
            "biquintile": { major: false, angle: 144, orb: 2, symbol: "C" },
            "inconjunct": { major: false, angle: 150, orb: 3, symbol: "n" },
            "treseptile": { major: false, angle: 154.284, orb: 1.1, symbol: "B" },
            "tetranovile": { major: false, angle: 160, orb: 3, symbol: ":" },
            "tao": { major: false, angle: 165, orb: 1.5, symbol: "—" },
            "opposition": { major: true, angle: 180, orb: 6, symbol: "m" }
        };
        let l1 = p1.longitude, l2 = p2.longitude, ng = Math.abs(l1 - l2), r1 = p1.isRetrograde(), r2 = p2.isRetrograde(), s1 = Math.abs(p1.speed), s2 = Math.abs(p2.speed), ct = false;
        if (ng > 180 + this._types["opposition"].orb) {
            ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
            ct = true;
        }
        for (let type in this._types) {
            let t = this._types[type];
            if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
                this._type = type;
            }
        }
        if (typeof this._type === "undefined") {
            throw new Error("There is no aspect between these two planets.");
        }
        this._orb = Number((ng % 1).toFixed(6));
        let orb = ng - this._types[this._type].angle;
        if ((((orb < 0 && !ct && l2 > l1) || (orb > 0 && !ct && l1 > l2) ||
            (orb < 0 && ct && l1 > l2) || (orb > 0 && ct && l2 > l1)) &&
            ((!r1 && !r2 && s2 > s1) || (r1 && r2 && s1 > s2) || (r1 && !r2)) ||
            (((orb > 0 && !ct && l2 > l1) || (orb < 0 && !ct && l1 > l2) ||
                (orb > 0 && ct && l1 > l2) || (orb < 0 && ct && l2 > l1)) &&
                ((!r1 && !r2 && s1 > s2) || (r1 && r2 && s2 > s1) || (!r1 && r2))))) {
            this._applying = true;
        }
        else {
            this._applying = false;
        }
    }
    get type() { return this._type; }
    get orb() { return this._orb; }
    get symbol() { return this._types[this._type].symbol; }
    isApplying() { return this._applying; }
    isMajor() { return this._types[this._type].major; }
}
export var ChartType;
(function (ChartType) {
    ChartType[ChartType["Basic"] = 0] = "Basic";
    ChartType[ChartType["Transits"] = 1] = "Transits";
    ChartType[ChartType["Synastry"] = 2] = "Synastry";
    ChartType[ChartType["Combined"] = 3] = "Combined";
    ChartType[ChartType["Davison"] = 4] = "Davison";
    ChartType[ChartType["CombinedTransits"] = 5] = "CombinedTransits";
    ChartType[ChartType["DavisonTransits"] = 6] = "DavisonTransits";
})(ChartType || (ChartType = {}));
;
export class Chart {
    constructor(name, p1, cdata, p2, type = ChartType.Basic) {
        this.name = name;
        this.p1 = p1;
        this.p2 = p2;
        this.type = type;
        this._signs = [
            { name: "aries", symbol: "q", v: 1 },
            { name: "taurus", symbol: "w", v: 1 },
            { name: "gemini", symbol: "e", v: 1 },
            { name: "cancer", symbol: "r", v: 1 },
            { name: "leo", symbol: "t", v: 1 },
            { name: "virgo", symbol: "z", v: 1 },
            { name: "libra", symbol: "u", v: 1 },
            { name: "scorpio", symbol: "i", v: 1 },
            { name: "sagittarius", symbol: "o", v: 1 },
            { name: "capricorn", symbol: "p", v: 1 },
            { name: "aquarius", symbol: "ü", v: 1 },
            { name: "pisces", symbol: "+", v: 1 }
        ];
        let pdata;
        switch (type) {
            case ChartType.Combined:
                pdata = this.calculateCombinedPlanets(cdata);
                this._planets1 = this.getPlanets(pdata);
                this._ascendant = pdata.ascendant;
                this._houses = pdata.houses;
                break;
            case ChartType.CombinedTransits:
                pdata = this.calculateCombinedPlanets(cdata);
                this._planets1 = this.getPlanets(pdata);
                this._planets2 = this.getPlanets(cdata[2]);
                this._ascendant = pdata.ascendant;
                this._houses = pdata.houses;
                break;
            default:
                this._planets1 = this.getPlanets(cdata[0]);
                if (cdata[1]) {
                    this._planets2 = this.getPlanets(cdata[1]);
                }
                this._ascendant = cdata[0].ascendant;
                this._houses = cdata[0].houses;
                break;
        }
        this.calculateAspects();
    }
    getPlanets(cdata) {
        let planets = [];
        for (let p in cdata.planets) {
            let pd = cdata.planets[p];
            planets.push(new Planet(pd.name, pd.lon, pd.lat, pd.spd));
        }
        return planets;
    }
    calculateAspects() {
        this._aspects = [];
        if (!this._planets2) {
            for (let i in this._planets1) {
                for (let j in this._planets1) {
                    if (i !== j && j > i) {
                        try {
                            this._aspects.push(new Aspect(this._planets1[i], this._planets1[j]));
                        }
                        catch (err) { }
                    }
                }
            }
        }
        else {
            for (let i in this._planets1) {
                for (let j in this._planets2) {
                    try {
                        this._aspects.push(new Aspect(this._planets1[i], this._planets2[j]));
                    }
                    catch (err) { }
                }
            }
        }
    }
    calculateCombinedPlanets(cdata) {
        let cd = { "planets": { "sun": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "moon": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "mercury": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "venus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "mars": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "jupiter": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "saturn": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "uranus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "neptune": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pluto": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "north node": { "name": "north node", "lon": null, "lat": null, "spd": null, "r": null }, "south node": { "name": "south node", "lon": null, "lat": null, "spd": null, "r": null }, "chiron": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pholus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "ceres": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pallas": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "juno": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "vesta": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "cupido": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "chariklo": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "chaos": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "eris": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "nessus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null } }, "houses": [null, null, null, null, null, null, null, null, null, null, null, null], "ascendant": null, "mc": null };
        for (let p in cdata[0].planets) {
            cd.planets[p].name = p;
            cd.planets[p].lon = this.getLonMidpoint(cdata[0].planets[p].lon, cdata[1].planets[p].lon);
            cd.planets[p].lat = (cdata[0].planets[p].lat + cdata[1].planets[p].lat) / 2;
            cd.planets[p].spd = (cdata[0].planets[p].spd + cdata[1].planets[p].spd) / 2;
        }
        for (let h in cdata[0].houses) {
            cd.houses[h] = this.getLonMidpoint(cdata[0].houses[h], cdata[1].houses[h]);
        }
        cd.ascendant = this.getLonMidpoint(cdata[0].ascendant, cdata[1].ascendant);
        cd.mc = this.getLonMidpoint(cdata[0].mc, cdata[1].mc);
        return cd;
    }
    getLonMidpoint(l1, l2) {
        let mp, high, low;
        if (l1 === l2) {
            return l1;
        }
        high = l1 > l2 ? l1 : l2;
        low = l1 < l2 ? l1 : l2;
        if (high - low <= 180) {
            mp = (high + low) / 2;
        }
        else {
            mp = ((((low + 360) - high) / 2) + high) % 360;
        }
        return mp;
    }
    refreshTransits(date = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ChartType.Synastry === this.type) {
                throw new Error("You cannot refresh transits on a synastry chart");
            }
            if (null === date) {
                date = new Date().toISOString();
            }
            let cdata = yield ChartFactory.getChartData(date, this.p1.location);
            this._planets2 = this.getPlanets(cdata);
            this.calculateAspects();
        });
    }
    get houses() { return this._houses; }
    get aspects() { return this._aspects; }
    get ascendant() { return this._ascendant; }
    get innerPlanets() { return this._planets2 ? this._planets1 : []; }
    get outerPlanets() { return this._planets2 ? this._planets2 : this._planets1; }
}
export class ChartFactory {
    static create(name, p1, p2 = null, type = ChartType.Basic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (null === name || "undefined" === typeof name || 0 === name.length) {
                throw Error("Chart must have a name (ChartFactory)");
            }
            if (null === p1 || typeof p1 === "undefined") {
                throw Error("Person or Event cannot be null or undefined (ChartFactory)");
            }
            switch (type) {
                case ChartType.Synastry:
                case ChartType.Combined:
                case ChartType.CombinedTransits:
                case ChartType.Davison:
                    if (null === p2) {
                        throw Error("2nd Person or Event cannot be null for this chart type (ChartFactory)");
                    }
            }
            let cdata = [], date, p;
            switch (type) {
                case ChartType.Transits:
                    cdata = yield Promise.all([
                        ChartFactory.getChartData(p1.date, p1.location),
                        ChartFactory.getChartData(new Date().toISOString(), p1.location)
                    ]);
                    return new Chart(name, p1, cdata, null, type);
                case ChartType.Synastry:
                case ChartType.Combined:
                    cdata = yield Promise.all([
                        ChartFactory.getChartData(p1.date, p1.location),
                        ChartFactory.getChartData(p2.date, p2.location)
                    ]);
                    return new Chart(name, p1, cdata, null, type);
                case ChartType.CombinedTransits:
                    cdata = yield Promise.all([
                        ChartFactory.getChartData(p1.date, p1.location),
                        ChartFactory.getChartData(p2.date, p2.location),
                        ChartFactory.getChartData(new Date().toISOString(), p1.location)
                    ]);
                    return new Chart(name, p1, cdata, null, type);
                case ChartType.Davison:
                    date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                    p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                    cdata.push(yield ChartFactory.getChartData(date, p));
                    return new Chart(name, p1, cdata);
                case ChartType.DavisonTransits:
                    date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                    p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                    cdata = yield Promise.all([
                        ChartFactory.getChartData(date, p),
                        ChartFactory.getChartData(new Date().toISOString(), p)
                    ]);
                    return new Chart(name, p1, cdata, null, type);
                default:
                    cdata.push(yield ChartFactory.getChartData(p1.date, p1.location));
                    return new Chart(name, p1, cdata);
            }
        });
    }
    static getGeoMidpoint(p1, p2) {
        let lat1 = ChartFactory.toRadians(p1.lat), lng1 = ChartFactory.toRadians(p1.lng), lat2 = ChartFactory.toRadians(p2.lat), lng2 = ChartFactory.toRadians(p2.lng), bx = Math.cos(lat2) * Math.cos(lng2 - lng1), by = Math.cos(lat2) * Math.sin(lng2 - lng1), lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx), lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt(Math.pow(Math.cos(lat1) + bx, 2) + Math.pow(by, 2)));
        return {
            lat: ChartFactory.toDegrees(lat3),
            lng: ChartFactory.toDegrees(lng3)
        };
    }
    static getDatetimeMidpoint(date1, date2) {
        let d1 = new Date(date1).getTime(), d2 = new Date(date2).getTime(), ts;
        if (d1 === d2) {
            return date1;
        }
        ts = d1 < d2 ? d1 + ((d2 - d1) / 2) : d2 + ((d1 - d2) / 2);
        return new Date(ts).toISOString();
    }
    static getChartData(date, p) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield rp({
                uri: "http://www.morphemeris.com/ephemeris.php",
                qs: {
                    date: date,
                    lat: p.lat,
                    lon: p.lng
                },
                json: true
            }).then((cdata) => cdata);
        });
    }
}
ChartFactory.toRadians = (degrees) => degrees * Math.PI / 180;
ChartFactory.toDegrees = (radians) => radians * 180 / Math.PI;

//# sourceMappingURL=astrologyjs.js.map
