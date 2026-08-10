/**
 * One of the planets, asteroids, the sun or moon
 */
export class Planet {

    /**
     * The planet name, e.g. Mercury
     * @type {string}
     */
    name: string;

    /**
     * A planet's longitude identifies what sign
     * it is in
     * @type {number}
     */
    longitude: number;

    /**
     * A planet's latitude describes it's distance
     * from the ecliptic, and can be used to
     * determine if it is out of bounds
     * @type {number}
     */
    latitude: number;

    /**
     * A planet's speed allows us to know if it is
     * retrograde, and to calculate whether an
     * aspect is applying or separating
     * @type {number}
     */
    speed: number;

    /**
     * The symbol for this planet as represented in
     * the Kairon Semiserif font
     * @type {string}
     */
    symbol: string;

    /**
     * Dictionary of symbols for the planets for
     * use with the Kairon Semiserif font
     * @type {Object}
     */
    private symbols: {[planet: string]: string} = {
        "sun":        "a",
        "moon":       "s",
        "mercury":    "d",
        "venus":      "f",
        "earth":      "g",
        "mars":       "h",
        "jupiter":    "j",
        "saturn":     "k",
        "uranus":     "ö",
        "neptune":    "ä",
        "pluto":      "#",
        "south node": "?",
        "north node": "ß",
        "ceres":      "A",
        "pallas":     "S",
        "juno":       "D",
        "vesta":      "F",
        "lilith":     "ç",
        "cupido":     "L",
        "chiron":     "l",
        "nessus":     "ò",
        "pholus":     "ñ",
        "chariklo":   "î",
        "eris":       "È",
        "chaos":      "Ê",
        "fortuna":    "%"
    };

    /**
     * Instantiate a new planet object.
     * @param {string} name The planet's name
     * @param {number} lon  The planet's longitude
     * @param {number} lat  The planet's latitude
     * @param {number} spd  The planet's speed relative to earth
     */
    constructor(name: string, lon: number, lat: number, spd: number) {
        this.name = name;
        this.longitude = lon;
        this.latitude = lat;
        this.speed = spd;
        this.symbol = this.symbols[name.toLowerCase()];
    }

    /**
     * A planet is retrograde when it's speed relative
     * to earth is less than zero
     * @return {boolean} Whether or not the planet is retrograde
     */
    isRetrograde(): boolean {
        return this.speed < 0;
    }

    /**
     * Is this one of the major planets typically included in a chart?
     * @return {boolean} Returns true if it is a major planet
     */
    isMajor(): boolean {
        return ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
                "uranus", "neptune", "pluto", "north node", "south node"]
                .indexOf(this.name.toLowerCase()) > -1;
    }
}
