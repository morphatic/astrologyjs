/**
 * astrologyjs — public API surface.
 *
 * This is the package's only barrel file. Internal modules import from each
 * other directly; barrels are banned elsewhere (coding standards, §Modules).
 */

export { configure, getConfig, resetConfig, DEFAULT_BASE_URL } from './config.js';
export type {
  AstrologyConfig,
  ChartOptions,
  ResolvedChartOptions,
  FetchLike,
  Geocoder,
  ZoneResolver,
} from './config.js';

export {
  AdapterError,
  AmbiguousTimeError,
  AstrologyError,
  AuthError,
  ConfigurationError,
  InsufficientCreditsError,
  NonexistentTimeError,
  OriginError,
  RateLimitError,
  ServiceUnavailableError,
  TransportError,
  UnsupportedBodyError,
  UpstreamError,
  ValidationError,
} from './errors.js';
export type { AstrologyErrorOptions, InstantCandidate, UpstreamErrorDetail } from './errors.js';

export { createPerson } from './person.js';
export type { Person, PersonOptions, TimeInput } from './person.js';

export { ChartType, createChart } from './chart.js';
export type { Chart, ChartTypeName, CreateChartOptions } from './chart.js';

export { ASPECTS, findAspect, separation } from './aspects.js';
export type { Aspect, AspectType } from './aspects.js';

export {
  BODY_REGISTRY,
  allBodyNames,
  bodyDefinition,
  derivedBodies,
  isMajor,
  isRetrograde,
  isSupportedBody,
  majorBodies,
} from './bodies.js';
export type { BodyDefinition, BodySource, NodeChoice } from './bodies.js';

export { SIGNS, normalizeLongitude, signDegree, signOf } from './signs.js';
export type { SignName } from './signs.js';

export {
  declination,
  isOutOfBounds,
  julianDay,
  meanObliquity,
  nutationInObliquity,
  trueObliquity,
} from './equatorial.js';

export { geoMidpoint, instantMidpoint, longitudeMidpoint } from './midpoints.js';
export type { LongitudeMidpoint } from './midpoints.js';

export { defaultZoneResolver } from './time/zone.js';
export type { GeoPoint } from './time/zone.js';

export type { AdaptedPlanet as Planet, ChartWarning } from './ephemeris/adapter.js';
