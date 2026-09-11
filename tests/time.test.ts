import { describe, expect, it } from 'vitest';
import { buildTimelineTicks, formatTimelineValue, normalizeTimeline } from '../src/time';
import type { HypnogramSegment, TimeValue } from '../src/types';

const segment = (start: TimeValue, end: TimeValue): HypnogramSegment => ({ id: 'a', stage: 'deep', start, end });

describe('standard intervals', () => {
  it('preserves original data and normalizes ISO / Unix timestamps to milliseconds', () => {
    const datum = segment('2026-09-09T23:30:00+08:00', '2026-09-10T01:00:00+08:00');
    const timeline = normalizeTimeline([datum]);
    expect(timeline.intervals[0]!.duration).toBe(90 * 60000);
    expect(timeline.intervals[0]!.segment).toBe(datum);
    const [start, end] = timeline.domain;
    expect(normalizeTimeline([segment(start, end)]).domain).toEqual(timeline.domain);
    expect(normalizeTimeline([segment(start / 1000, end / 1000)], { timestampUnit: 'seconds' }).domain).toEqual(timeline.domain);
  });
  it('does not guess numeric units or limit total duration', () => {
    expect(normalizeTimeline([segment(1440, 2000000000000)]).domain).toEqual([1440, 2000000000000]);
    expect(normalizeTimeline([segment('2020-01-01', '2030-01-01')]).domain[1]).toBe(Date.parse('2030-01-01'));
  });
  it('leaves nonstandard time parsing to an explicit application hook', () => {
    const parse = (value: TimeValue) => Date.parse(`2026-09-09T${value}:00+08:00`);
    expect(normalizeTimeline([segment('21:00', '22:00')], { parse }).intervals[0]!.duration).toBe(3600000);
    expect(() => normalizeTimeline([segment('21:00', '22:00')])).toThrow('Invalid time');
  });
  it('sorts without mutation, preserving gaps and same-stage interval identities', () => {
    const input = Object.freeze([{ ...segment(20, 30), id: 'b' }, Object.freeze(segment(0, 10)), { ...segment(30, 40), id: 'c' }]);
    expect(normalizeTimeline(input).intervals.map(i => [i.segment.id, i.index, i.start, i.end])).toEqual([['a', 1, 0, 10], ['b', 0, 20, 30], ['c', 2, 30, 40]]);
    expect(input[0]!.id).toBe('b');
  });
  it('rejects duplicate ids, overlapping intervals, nonfinite times and invalid domains', () => {
    expect(() => normalizeTimeline([segment(0, 2), segment(2, 3)])).toThrow('id');
    expect(() => normalizeTimeline([segment(0, 3), { ...segment(2, 4), id: 'b' }])).toThrow('Overlapping');
    for (const [a, b] of [[0, 0], [2, 1], [NaN, 3], [0, Infinity]]) expect(() => normalizeTimeline([segment(a!, b!)])).toThrow();
    expect(() => normalizeTimeline([segment(0, 2)], {}, [3, 1])).toThrow('domain');
    expect(normalizeTimeline([]).domain).toEqual([0, 1000]);
  });
});

describe('axis: divide the whole range, then snap', () => {
  it.each([
    ['2026-09-09T22:14:00+08:00', '2026-09-10T06:28:00+08:00', ['22:14', '01:00', '03:30', '06:28']],
    ['2026-09-10T01:07:00+08:00', '2026-09-10T09:21:00+08:00', ['01:07', '04:00', '06:30', '09:21']],
  ])('keeps endpoints and evenly spaced half-hour candidates', (start, end, expected) => {
    const timeline = normalizeTimeline([segment(start, end)], { timeZone: 'Asia/Shanghai' });
    const ticks = buildTimelineTicks(timeline, 800);
    expect(ticks.map(t => t.label)).toEqual(expected);
    const gaps = ticks.slice(1).map((tick, i) => tick.value - ticks[i]!.value);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(30 * 60000);
  });
  it('aligns snap candidates in the display timezone, including quarter-hour offsets', () => {
    const timeline = normalizeTimeline([segment('2026-09-09T22:14:00+05:45', '2026-09-10T06:28:00+05:45')], { timeZone: 'Asia/Kathmandu' });
    expect(buildTimelineTicks(timeline, 800).map(t => t.label)).toEqual(['22:14', '01:00', '03:30', '06:28']);
  });
  it('uses the entire extent rather than segment density for ticks', () => {
    const one = normalizeTimeline([segment(0, 86400000)]);
    const many = normalizeTimeline([{ ...segment(0, 100), id: 'a' }, { ...segment(100, 86400000), id: 'b' }]);
    expect(buildTimelineTicks(one, 800)).toEqual(buildTimelineTicks(many, 800));
  });
  it('uses Beijing time by default and adapts labels to multi-day spans', () => {
    const seconds = normalizeTimeline([segment('2026-09-09T00:00:00Z', '2026-09-09T00:00:15Z')]);
    expect(formatTimelineValue(seconds.domain[0], seconds)).toBe('08:00:00');
    const utc = normalizeTimeline([segment('2026-09-09T00:00:00Z', '2026-09-09T00:00:15Z')], { timeZone: 'UTC' });
    expect(formatTimelineValue(utc.domain[0], utc)).toBe('00:00:00');
    const days = normalizeTimeline([segment('2026-09-09', '2026-09-13')]);
    expect(formatTimelineValue(days.domain[0], days)).toContain('Sept');
  });
  it('distinguishes repeated clock labels across DST', () => {
    const timeline = normalizeTimeline([segment('2026-11-01T01:30:00-04:00', '2026-11-01T01:30:00-05:00')], { timeZone: 'America/New_York' });
    const ticks = buildTimelineTicks(timeline, 800, { maxMiddleTicks: 0 });
    expect(ticks[0]!.label).not.toBe(ticks[1]!.label);
  });
  it('supports exact ticks and formatting, suppressing collisions on narrow containers', () => {
    const timeline = normalizeTimeline([segment(0, 5000)]);
    expect(buildTimelineTicks(timeline, 500, { ticks: [] })).toEqual([]);
    expect(buildTimelineTicks(timeline, 500, { ticks: [0, 2500, 5000], formatLabel: n => `${n}ms` }).map(t => t.label)).toEqual(['0ms', '2500ms', '5000ms']);
    expect(buildTimelineTicks(timeline, 10)).toHaveLength(1);
    expect(() => buildTimelineTicks(timeline, 500, { ticks: [2, 1] })).toThrow();
    expect(() => buildTimelineTicks(timeline, 500, { snapTo: 0 })).toThrow();
  });
});
