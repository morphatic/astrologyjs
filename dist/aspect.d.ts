import { Planet } from "./planet";
/**
 * Represents an aspect between two planets
 */
export declare class Aspect {
    p1: Planet;
    p2: Planet;
    /**
     * A label naming the aspect type, e.g. trine
     * @type {string}
     */
    private _type;
    /**
     * Number of degrees away from being perfectly in aspect
     * @type {number}
     */
    private _orb;
    /**
     * Is the aspect applying or separating
     * @type {boolean}
     */
    private _applying;
    /**
     * Catalog of all of the aspect types available in our system
     * @type {AspectTypeArray}
     */
    private _types;
    /**
     * Creates a new Aspect or throws an error if no aspect exists
     * between the planets
     * @param {Planet} public p1 First planet in the relationship
     * @param {Planet} public p2 Second planet in the relationship
     */
    constructor(p1: Planet, p2: Planet);
    /**
     * Get the type assigned to this aspect
     * @return {string} One of the aspect type names
     */
    readonly type: string;
    /**
     * Get the number of degrees away from being in perfect aspect
     * @return {number} The number of degrees (absolute value)
     */
    readonly orb: number;
    /**
     * Get the character that will produce the correct symbol for
     * this aspect in the Kairon Semiserif font
     * @return {string} A character representing a symbol
     */
    readonly symbol: string;
    /**
     * Is the aspect applying or separating?
     * @return {boolean} True if the aspect is applying
     */
    isApplying(): boolean;
    /**
     * Is this a "major" aspect? i.e. one of those you usually
     * hear about in astrological forecasts
     * @return {boolean} True if this is a "major" aspect
     */
    isMajor(): boolean;
}
