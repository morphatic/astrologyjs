/**
 * astrologyjs 1.3.2 — a tombstone release.
 *
 * 1.x depended on a free ephemeris service that no longer exists. Every call
 * has failed for years with `Unexpected token < in JSON at position 0`, which
 * is what `JSON.parse` says when it is handed an HTML error page. That message
 * names neither the cause nor the fix, and four issues on the repository going
 * back to 2017 all report the same wall.
 *
 * This release does not repair anything. It replaces that stack trace with one
 * that explains itself, because 45 forks and an unknown number of installs will
 * never read a README, and all of them will read a stack trace.
 *
 * The working library is astrologyjs 2.x, a ground-up reimplementation on the
 * Morphemeris API. Nothing here is shared with it.
 */

/**
 * The message every entry point in this package produces.
 *
 * Exported so it can be read without triggering it — a caller that wants to
 * detect the retirement and route around it should not have to catch to do so.
 */
export const RETIREMENT_NOTICE: string = [
  'astrologyjs 1.x no longer works.',
  '',
  'Its ephemeris backend, http://www.morphemeris.com/ephemeris.php, went',
  'offline years ago. Every chart request since has received an HTML error page',
  'instead of JSON, which is where "Unexpected token < in JSON at position 0"',
  'came from.',
  '',
  'The charts 1.x produced before then should not be trusted either. Aspect.orb',
  'reported the fractional part of the separation rather than the distance from',
  'exactness, so a trine at 118.5 degrees reported an orb of 0.5 instead of 1.5.',
  '',
  'astrologyjs 2.x is a ground-up reimplementation on the Morphemeris API. It is',
  'maintained, its geometry is cross-checked against an independent',
  'implementation, and it requires an API key of your own.',
  '',
  '    npm install astrologyjs@^2',
  '    https://github.com/morphatic/astrologyjs#readme',
  '',
  'Version 1.3.2 computes nothing at all. It exists only to say the above.',
].join('\n');

/** A stable identifier, so the retirement can be matched without parsing prose. */
export const RETIREMENT_CODE = 'ASTROLOGYJS_1X_RETIRED';

/**
 * Builds the error rather than subclassing `Error`.
 *
 * This bundle targets ES5, where extending a built-in leaves `instanceof`
 * broken for the subclass. A plain `Error` carrying a `code` is recognisable by
 * every consumer and cannot be got wrong by a downlevel transform.
 */
function retirementError(): Error {
  const error = new Error(RETIREMENT_NOTICE) as Error & { code: string };
  error.code = RETIREMENT_CODE;
  return error;
}

/** For the synchronous surface: constructors, getters, and the pure helpers. */
function retired(): never {
  throw retirementError();
}

/**
 * For the asynchronous surface.
 *
 * A rejected promise, not a synchronous throw. Everything async in 1.x was
 * awaited, and throwing synchronously out of a function whose signature
 * promises a `Promise` would escape a caller's `.catch()` and land somewhere
 * unrelated — a second confusing failure on top of the one being explained.
 */
function retiredAsync(): Promise<never> {
  return Promise.reject(retirementError());
}

/* --------------------------------------------------------------------------
 * The 1.3.1 public surface, preserved exactly.
 *
 * Every name, signature, and enum value is the one 1.3.1 published. A
 * TypeScript consumer who upgrades still compiles, and then gets the notice at
 * runtime. Dropping a member instead would give them "Property 'x' does not
 * exist", which explains no more than `Unexpected token <` did.
 * ----------------------------------------------------------------------- */

export interface GoogleLocation {
  lat: number;
  lng: number;
}

export type Point = GoogleLocation;

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

export enum ChartType {
  Basic,
  Transits,
  Synastry,
  Combined,
  Davison,
  CombinedTransits,
  DavisonTransits,
}

/** One of the planets, asteroids, the sun or moon. */
export class Planet {
  name!: string;
  longitude!: number;
  latitude!: number;
  speed!: number;
  symbol!: string;

  constructor(_name: string, _lon: number, _lat: number, _spd: number) {
    retired();
  }

  isRetrograde(): boolean {
    return retired();
  }

  isMajor(): boolean {
    return retired();
  }
}

/** Represents a person or event for whom a chart will be created. */
export class Person {
  constructor(
    public name: string,
    public date: string,
    public location: Point,
  ) {
    retired();
  }

  static create(_name: string, _date: Date | string, _location: Point | string): Promise<Person> {
    return retiredAsync();
  }

  static getTimezone(_p: Point): Promise<string> {
    return retiredAsync();
  }

  static getLatLon(_address: string): Promise<Point> {
    return retiredAsync();
  }
}

/** Represents an aspect between two planets. */
export class Aspect {
  constructor(
    public p1: Planet,
    public p2: Planet,
  ) {
    retired();
  }

  get type(): string {
    return retired();
  }

  get orb(): number {
    return retired();
  }

  get symbol(): string {
    return retired();
  }

  isApplying(): boolean {
    return retired();
  }

  isMajor(): boolean {
    return retired();
  }
}

export class Chart {
  _planets1!: Array<Planet>;
  _planets2!: Array<Planet>;
  _aspects!: Array<Aspect>;
  _ascendant!: number;
  _houses!: Array<number>;
  _debug = false;

  constructor(
    public name: string,
    public p1: Person,
    _cdata: ChartDataArray,
    public p2?: Person,
    public type: ChartType = ChartType.Basic,
  ) {
    retired();
  }

  /**
   * Gets chart data from the online ephemeris.
   *
   * This is the function. Every failed install, every issue on the repository,
   * every `Unexpected token <` came from the request this used to make.
   */
  static getChartData(_date: string, _p: Point): Promise<ChartData> {
    return retiredAsync();
  }

  getPlanets(_cdata: ChartData): Array<Planet> {
    return retired();
  }

  calculateAspects(): void {
    retired();
  }

  calculateCombinedPlanets(_cdata: ChartDataArray): ChartData {
    return retired();
  }

  getLonMidpoint(_l1: number, _l2: number): number {
    return retired();
  }

  refreshTransits(_date?: string): Promise<void> {
    return retiredAsync();
  }

  get houses(): Array<number> {
    return retired();
  }

  get aspects(): Array<Aspect> {
    return retired();
  }

  get ascendant(): number {
    return retired();
  }

  get innerPlanets(): Array<Planet> {
    return retired();
  }

  get outerPlanets(): Array<Planet> {
    return retired();
  }
}

export class ChartFactory {
  static create(
    _name: string,
    _p1: Person,
    _p2?: Person,
    _type?: ChartType,
  ): Promise<Chart> {
    return retiredAsync();
  }

  /**
   * The midpoint helpers never touched the network and would still compute.
   *
   * They are retired anyway. A tombstone with working parts invites the reading
   * that some of 1.x can still be relied on, and the notice says the opposite.
   */
  static getGeoMidpoint(_p1: Point, _p2: Point): Point {
    return retired();
  }

  static getDatetimeMidpoint(_date1: string, _date2: string): string {
    return retired();
  }

  static toRadians = (_degrees: number): number => retired();

  static toDegrees = (_radians: number): number => retired();
}

/**
 * 1.3.1 shipped a default export alongside the named ones. Keeping it means
 * `import astrologyjs from 'astrologyjs'` still resolves and still reaches the
 * notice, rather than failing at module resolution with something unrelated.
 */
export default {
  Planet: Planet,
  Person: Person,
  Aspect: Aspect,
  Chart: Chart,
  ChartType: ChartType,
  ChartFactory: ChartFactory,
  RETIREMENT_NOTICE: RETIREMENT_NOTICE,
  RETIREMENT_CODE: RETIREMENT_CODE,
};
