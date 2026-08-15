import { describe, expect, it } from 'vitest';

import { ValidationError } from '../errors.js';
import { defaultZoneResolver, resolveZone } from './zone.js';

describe('defaultZoneResolver', () => {
  it('resolves ordinary coordinates', () => {
    expect(defaultZoneResolver(37.4381927, -79.18932)).toBe('America/New_York');
    expect(defaultZoneResolver(-33.8688, 151.2093)).toBe('Australia/Sydney');
  });

  it('resolves the awkward zones the fixtures depend on', () => {
    expect(defaultZoneResolver(22.5726, 88.3639)).toBe('Asia/Kolkata');
    expect(defaultZoneResolver(27.7172, 85.324)).toBe('Asia/Kathmandu');
    expect(defaultZoneResolver(-31.5553, 159.0821)).toBe('Australia/Lord_Howe');
  });

  it('resolves a high-latitude location', () => {
    expect(defaultZoneResolver(69.6492, 18.9553)).toBe('Europe/Oslo');
  });
});

describe('resolveZone precedence (§5.2)', () => {
  it('prefers an explicit zone over any lookup', () => {
    const resolver = (): string => 'Antarctica/Troll';
    expect(
      resolveZone({ lat: 37.44, lng: -79.19 }, { zone: 'Asia/Tokyo', zoneResolver: resolver }),
    ).toEqual({ zone: 'Asia/Tokyo', fromDefaultResolver: false });
  });

  it('prefers a caller-supplied resolver over the built-in one', () => {
    expect(resolveZone({ lat: 37.44, lng: -79.19 }, { zoneResolver: () => 'Asia/Tokyo' })).toEqual({
      zone: 'Asia/Tokyo',
      fromDefaultResolver: false,
    });
  });

  it('falls back to the built-in resolver and says so', () => {
    // The flag drives the zone_resolved_by_default warning (§10.4), which is
    // the only breadcrumb a caller near a zone border gets.
    expect(resolveZone({ lat: 37.4381927, lng: -79.18932 }, {})).toEqual({
      zone: 'America/New_York',
      fromDefaultResolver: true,
    });
  });

  it('rejects an unusable zone rather than falling back to UTC', () => {
    // Falling back to UTC would silently shift every chart by the true offset.
    expect(() => resolveZone({ lat: 0, lng: 0 }, { zoneResolver: () => '' })).toThrow(
      ValidationError,
    );
    expect(() => resolveZone({ lat: 0, lng: 0 }, { zoneResolver: () => 'Not/AZone' })).toThrow(
      ValidationError,
    );
  });

  it('validates coordinates before attempting a lookup', () => {
    expect(() => resolveZone({ lat: 91, lng: 0 }, {})).toThrow(ValidationError);
    expect(() => resolveZone({ lat: 0, lng: 181 }, {})).toThrow(ValidationError);
  });
});
