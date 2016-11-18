import { Planet } from "./planet";

interface AspectType {
    major: boolean;
    angle: number;
    orb: number;
    symbol: string;
}

interface AspectTypeArray {
    [name: string]: AspectType;
}

/**
 * Represents an aspect between two planets
 */
export class Aspect {

    /**
     * A label naming the aspect type, e.g. trine
     * @type {string}
     */
    private _type: string;

    /**
     * Number of degrees away from being perfectly in aspect
     * @type {number}
     */
    private _orb: number;

    /**
     * Is the aspect applying or separating
     * @type {boolean}
     */
    private _applying: boolean;

    /**
     * Catalog of all of the aspect types available in our system
     * @type {AspectTypeArray}
     */
    private _types: AspectTypeArray = {
       "conjunct":       { major: true,  angle:   0,     orb: 6  , symbol: "<" },
       "semisextile":    { major: false, angle:  30,     orb: 3  , symbol: "y" },
       "decile":         { major: false, angle:  36,     orb: 1.5, symbol: ">" },
       "novile":         { major: false, angle:  40,     orb: 1.9, symbol: "M" },
       "semisquare":     { major: false, angle:  45,     orb: 3  , symbol: "=" },
       "septile":        { major: false, angle:  51.417, orb: 2  , symbol: "V" },
       "sextile":        { major: true,  angle:  60,     orb: 6  , symbol: "x" },
       "quintile":       { major: false, angle:  72,     orb: 2  , symbol: "Y" },
       "bilin":          { major: false, angle:  75,     orb: 0.9, symbol: "-" },
       "binovile":       { major: false, angle:  80,     orb: 2  , symbol: ";" },
       "square":         { major: true,  angle:  90,     orb: 6  , symbol: "c" },
       "biseptile":      { major: false, angle: 102.851, orb: 2  , symbol: "N" },
       "tredecile":      { major: false, angle: 108,     orb: 2  , symbol: "X" },
       "trine":          { major: true,  angle: 120,     orb: 6  , symbol: "Q" },
       "sesquiquadrate": { major: false, angle: 135,     orb: 3  , symbol: "b" },
       "biquintile":     { major: false, angle: 144,     orb: 2  , symbol: "C" },
       "inconjunct":     { major: false, angle: 150,     orb: 3  , symbol: "n" },
       "treseptile":     { major: false, angle: 154.284, orb: 1.1, symbol: "B" },
       "tetranovile":    { major: false, angle: 160,     orb: 3  , symbol: ":" },
       "tao":            { major: false, angle: 165,     orb: 1.5, symbol: "—" },
       "opposition":     { major: true,  angle: 180,     orb: 6  , symbol: "m" }
    };

    /**
     * Creates a new Aspect or throws an error if no aspect exists
     * between the planets
     * @param {Planet} public p1 First planet in the relationship
     * @param {Planet} public p2 Second planet in the relationship
     */
    constructor(public p1: Planet, public p2: Planet) {
        // get key properties of the planets
        let l1 = p1.longitude,
            l2 = p2.longitude,
            ng = Math.abs( l1 - l2 ),
            r1 = p1.isRetrograde(),
            r2 = p2.isRetrograde(),
            s1 = Math.abs(p1.speed),
            s2 = Math.abs(p2.speed),
            ct = false; // corrected?

        // correct for cases where the angle > 180 + the orb of opposition
        if (ng > 180 + this._types["opposition"].orb) {
            ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
            ct = true;
        }

        // determine the aspect type
        for (let type in this._types) {
            let t = this._types[type];
            if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
                this._type = type;
            }
        }

        // bail out if there is no in-orb aspect between these two planets
        if (typeof this._type === "undefined") {
            throw new Error("There is no aspect between these two planets.");
        }

        // determine the orb
        this._orb = Number((ng % 1).toFixed(6));

        // determine if it is applying or not; use speed magnitude (i.e. absolute value)
        let orb = ng - this._types[this._type].angle;
        // planets are in aspect across 0° Aries
        if (( ( (orb < 0 && !ct && l2 > l1) || (orb > 0 && !ct && l1 > l2) ||
                (orb < 0 &&  ct && l1 > l2) || (orb > 0 &&  ct && l2 > l1) ) &&
                ( (!r1 && !r2 && s2 > s1) || (r1 && r2 && s1 > s2) || (r1 && !r2) ) ||
            ( ( (orb > 0 && !ct && l2 > l1) || (orb < 0 && !ct && l1 > l2) ||
                (orb > 0 &&  ct && l1 > l2) || (orb < 0 &&  ct && l2 > l1) ) &&
                ( (!r1 && !r2 && s1 > s2) || (r1 && r2 && s2 > s1) || (!r1 && r2) ) ) )
        ) {
            this._applying = true;
        } else {
            this._applying = false;
        }
    }

    /**
     * Get the type assigned to this aspect
     * @return {string} One of the aspect type names
     */
    get type(): string { return this._type; }

    /**
     * Get the number of degrees away from being in perfect aspect
     * @return {number} The number of degrees (absolute value)
     */
    get orb(): number { return this._orb; }

    /**
     * Get the character that will produce the correct symbol for
     * this aspect in the Kairon Semiserif font
     * @return {string} A character representing a symbol
     */
    get symbol(): string { return this._types[this._type].symbol; }

    /**
     * Is the aspect applying or separating?
     * @return {boolean} True if the aspect is applying
     */
    isApplying(): boolean { return this._applying; }

    /**
     * Is this a "major" aspect? i.e. one of those you usually
     * hear about in astrological forecasts
     * @return {boolean} True if this is a "major" aspect
     */
    isMajor(): boolean { return this._types[this._type].major; }
}
