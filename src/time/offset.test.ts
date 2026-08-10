import { describe, expect, it } from 'vitest';

import { findTransition, localPartsAt, offsetMinutesAt } from './offset.js';

describe('offsetMinutesAt', () => {
  it('reads a plain winter offset', () => {
    expect(offsetMinutesAt(Date.parse('1975-02-17T23:30:00Z'), 'America/New_York')).toBe(-300);
  });

  it('reads a summer daylight offset', () => {
    expect(offsetMinutesAt(Date.parse('2024-07-04T12:00:00Z'), 'America/New_York')).toBe(-240);
  });

  it('knows the United States was on year-round DST in 1974', () => {
    // The Emergency Daylight Saving Time Energy Conservation Act put the US on
    // DST through the winter of 1973-74 after the oil crisis. A February 1974
    // birth in New York is EDT, not EST. Anyone assuming "February means EST"
    // is an hour out — exactly the failure this module exists to prevent.
    expect(offsetMinutesAt(Date.parse('1974-02-17T22:30:00Z'), 'America/New_York')).toBe(-240);
  });

  it('handles half-hour and quarter-hour zones', () => {
    expect(offsetMinutesAt(Date.parse('1980-05-15T12:00:00Z'), 'Asia/Kolkata')).toBe(330);
    expect(offsetMinutesAt(Date.parse('1990-05-15T12:00:00Z'), 'Asia/Kathmandu')).toBe(345);
  });

  it('handles Lord Howe, whose DST shift is thirty minutes', () => {
    expect(offsetMinutesAt(Date.parse('2024-01-15T12:00:00Z'), 'Australia/Lord_Howe')).toBe(660);
    expect(offsetMinutesAt(Date.parse('2024-06-15T12:00:00Z'), 'Australia/Lord_Howe')).toBe(630);
  });

  it('returns local mean time before a region adopted standard time', () => {
    // New York ran on LMT (-4:56:02) until 1883. The fractional minutes are
    // real, not a rounding artifact.
    const offset = offsetMinutesAt(Date.parse('1880-06-15T12:00:00Z'), 'America/New_York');
    expect(offset).toBeCloseTo(-296.0333, 3);
  });
});

describe('localPartsAt', () => {
  it('reports the wall clock a zone shows at an instant', () => {
    expect(localPartsAt(Date.parse('1974-02-17T22:30:00Z'), 'America/New_York')).toEqual({
      year: 1974,
      month: 2,
      day: 17,
      hour: 18,
      minute: 30,
      second: 0,
    });
  });

  it('uses a 24-hour clock, never rendering midnight as hour 24', () => {
    const parts = localPartsAt(Date.parse('2024-06-15T04:00:00Z'), 'America/New_York');
    expect(parts.hour).toBe(0);
  });
});

describe('findTransition', () => {
  it('locates the instant a zone changes offset, to the second', () => {
    // US spring-forward 2024: 07:00Z exactly.
    const t = findTransition(
      'America/New_York',
      Date.parse('2024-03-09T00:00:00Z'),
      Date.parse('2024-03-11T00:00:00Z'),
    );
    expect(new Date(t).toISOString()).toBe('2024-03-10T07:00:00.000Z');
  });

  it('locates a thirty-minute transition as readily as an hour one', () => {
    const t = findTransition(
      'Australia/Lord_Howe',
      Date.parse('2024-04-05T00:00:00Z'),
      Date.parse('2024-04-08T00:00:00Z'),
    );
    expect(new Date(t).toISOString()).toBe('2024-04-06T15:00:00.000Z');
  });
});
