/// <reference path="../typings/index.d.ts" />
import * as rp from "request-promise";
import { Person } from "./person";
import { Planet } from "./planet";
import { Aspect } from "./aspect";
import { Point } from "./point";
import { ChartFactory } from "./chart-factory";

export enum ChartType {Basic, Transits, Synastry, Combined, Davison, CombinedTransits, DavisonTransits};

export interface PlanetData {
    name: string;
    lon: number;
    lat: number;
    spd: number;
    r: number;
}
export interface PlanetDataArray {
    [name: string]: PlanetData;
}
export interface ChartData {
    planets: PlanetDataArray;
    houses: Array<number>;
    ascendant: number;
    mc: number;
}
export interface ChartDataArray {
    [index: number]: ChartData;
}

export class Chart {

    _planets1: Array<Planet>;
    _planets2: Array<Planet>;
    _aspects: Array<Aspect>;
    _ascendant: number;
    _houses: Array<number>;

    _signs = [
        {name: "aries",       symbol: "q", v: 1},
        {name: "taurus",      symbol: "w", v: 1},
        {name: "gemini",      symbol: "e", v: 1},
        {name: "cancer",      symbol: "r", v: 1},
        {name: "leo",         symbol: "t", v: 1},
        {name: "virgo",       symbol: "z", v: 1},
        {name: "libra",       symbol: "u", v: 1},
        {name: "scorpio",     symbol: "i", v: 1},
        {name: "sagittarius", symbol: "o", v: 1},
        {name: "capricorn",   symbol: "p", v: 1},
        {name: "aquarius",    symbol: "ü", v: 1},
        {name: "pisces",      symbol: "+", v: 1}
    ];

    constructor(public name: string, public p1: Person, cdata: ChartDataArray, public p2?: Person, public type: ChartType = ChartType.Basic) {
        let pdata: ChartData;
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

    getPlanets(cdata: ChartData): Array<Planet> {
        let planets: Array<Planet> = [];
        // cdata.planets.forEach(p => planets.push(new Planet(p.name, p.lon, p.lat, p.spd)));
        for (let p in cdata.planets) {
            let pd = cdata.planets[p];
            planets.push(new Planet(pd.name, pd.lon, pd.lat, pd.spd))
        }
        return planets;  
    }

    /**
     * Calculates the aspects between planets in the chart
     */
    calculateAspects(): void {
        this._aspects = [];
        if (!this._planets2) {
            // calculate aspects within the _planets1 array
            for(let i in this._planets1) {
                for(let j in this._planets1) {
                    if (i !== j && j > i) {
                        try {
                            this._aspects.push(new Aspect(this._planets1[i], this._planets1[j]));
                        } catch (err) {}
                    }
                }
            }
        }
        else {
            // calculate aspects between the _planets1 and _planets2 arrays
            for(let i in this._planets1) {
                for(let j in this._planets2) {
                    try {
                        this._aspects.push(new Aspect(this._planets1[i], this._planets2[j]));
                    } catch (err) {}
                }
            }
        }
    }

    /**
     * Calculates longitudes for a combined chart
     * @param {ChartData} p1 Planet data from person one
     * @param {ChartData} p2 Planet data from person two
     */
    calculateCombinedPlanets(cdata: ChartDataArray): ChartData {
        let cd: ChartData = {"planets":{"sun":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"moon":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"mercury":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"venus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"mars":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"jupiter":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"saturn":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"uranus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"neptune":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pluto":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"north node":{"name":"north node","lon":null,"lat":null,"spd":null,"r":null},"south node":{"name":"south node","lon":null,"lat":null,"spd":null,"r":null},"chiron":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pholus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"ceres":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"pallas":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"juno":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"vesta":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"cupido":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"chariklo":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"chaos":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"eris":{"name":null,"lon":null,"lat":null,"spd":null,"r":null},"nessus":{"name":null,"lon":null,"lat":null,"spd":null,"r":null}},"houses":[null,null,null,null,null,null,null,null,null,null,null,null],"ascendant":null,"mc":null};
        for(let p in cdata[0].planets) {
            cd.planets[p].name = p;
            cd.planets[p].lon = this.getLonMidpoint(cdata[0].planets[p].lon, cdata[1].planets[p].lon);
            cd.planets[p].lat = (cdata[0].planets[p].lat + cdata[1].planets[p].lat) / 2;
            cd.planets[p].spd = (cdata[0].planets[p].spd + cdata[1].planets[p].spd) / 2;
        }
        for(let h in cdata[0].houses) {
            cd.houses[h] = this.getLonMidpoint(cdata[0].houses[h], cdata[1].houses[h]);
        }
        cd.ascendant = this.getLonMidpoint(cdata[0].ascendant, cdata[1].ascendant);
        cd.mc = this.getLonMidpoint(cdata[0].mc, cdata[1].mc);
        return cd;
    }

    /**
     * Finds the midpoint between two planets on the "short" side
     * @param  {number} l1 Longitude of planet one
     * @param  {number} l2 Longitude of planet two
     * @return {number}    Longitude of the midpoint
     */
    getLonMidpoint(l1: number, l2: number): number {
        let mp: number, high: number, low: number;

        // if they are exactly the same, return either one
        if (l1 === l2) {
            return l1;
        }

        // figure out which has a higher/lower longitude
        high = l1 > l2 ? l1 : l2;
        low  = l1 < l2 ? l1 : l2;

        if (high - low <= 180) {
            mp = (high + low) / 2;
        }
        else {
            mp = ((((low + 360) - high) / 2) + high) % 360;
        }

        return mp;
    }

    /**
     * Refresh or set the transits to a new time
     * @param {string} date (Optional) Target datetime for transits in ISO 8601 format; defaults to now()
     */
    async refreshTransits(date?: string) {
        if (ChartType.Synastry === this.type) {
            throw new Error("You cannot refresh transits on a synastry chart");
        }
        if (!date) {
            date = new Date().toISOString();
        }
        let cdata = await ChartFactory.getChartData(this.p1.date, this.p1.location);
        this._planets2 = this.getPlanets(cdata);
        this.calculateAspects();
    }

    /**
     * Returns the x-coordinate for a planet
     * @param  {number} radius Distance from the center of chart to the arc upon which planet is to be drawn
     * @param  {number} lon Longitude of the planet
     * @return {number}    X-coordinate of the planet (in pixels)
     */
    x = (radius: number, lon: number): number => {
        return radius * Math.cos(ChartFactory.toRadians(180 + this._ascendant - lon));
    };

    /**
     * Returns the y-coordinate for a planet
     * @param  {number} radius Distance from the center of chart to the arc upon which planet is to be drawn
     * @param  {number} lon Longitude of the planet
     * @return {number}    Y-coordinate of the planet (in pixels)
     */
    y = (radius: number, lon: number): number => {
        return radius * Math.sin(ChartFactory.toRadians(180 + this._ascendant - lon));
    };

    sign = (lon: number): any => this._signs[Math.floor(lon/30)];

    degMinSec = (lon: number) => {
        let deg: number, min: number, sec: number, sign: any;
        sign = this.sign(lon);
        lon = lon % 30;
        deg = Math.floor(lon);
        min = Math.floor((lon - deg) * 60);
        sec = Math.round((((lon - deg ) * 60) - min) * 60);
        return `${deg}°${min}'${sec}" ${sign}`;
    };

    getD3Data(innerRadius: number, outerRadius: number) {
        let radius  = this._planets2 ? innerRadius : outerRadius,
            inOrOut = this._planets2 ? "innerPlanets" : "outerPlanets",
            data: {
                name: string, 
                innerPlanets: Array<any>, 
                outerPlanets: Array<any>, 
                aspects: Array<any>, 
                ascendant: number, 
                houses: Array<number>
            } = {
                "name": this.name,
                "innerPlanets": [],
                "outerPlanets": [],
                "aspects": [],
                "ascendant": this._ascendant,
                "houses": this._houses 
            };

        for(let p of this._planets1) {
            data[inOrOut].push({
                name: p.name,
                symbol: p.symbol,
                sign: this.degMinSec(p.longitude),
                x: this.x(radius, p.longitude),
                y: this.y(radius, p.latitude),
                r: p.speed < 0,
                fixed: false,
                weight: 1,
                radius: 15
            });
        }

        if (this._planets2) {
            for(let p of this._planets2) {
                data.outerPlanets.push({
                    name: p.name,
                    symbol: p.symbol,
                    sign: this.degMinSec(p.longitude),
                    x: this.x(outerRadius, p.longitude),
                    y: this.y(outerRadius, p.latitude),
                    r: p.speed < 0,
                    isMajor: p.isMajor(),
                    fixed: false,
                    weight: 1,
                    radius: 15
                });
            }
        }

        for (let a of this._aspects) {
            data.aspects.push({
                type: a.type,
                symbol: a.symbol,
                orb: a.orb,
                isApplying: a.isApplying(),
                isMajor: a.isMajor,
                x1: this.x(innerRadius, a.p1.longitude),
                x2: this.x(innerRadius, a.p2.longitude),
                y1: this.y(innerRadius, a.p1.longitude),
                y2: this.y(innerRadius, a.p2.longitude),
            });
        }
        return data;
    }
}