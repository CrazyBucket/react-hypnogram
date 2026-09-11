import type { HypnogramSegment, TimeFormatContext, TimeOptions, TimeValue, XAxisOptions } from './types';

export interface NormalizedInterval<S extends string, M> {
  segment: HypnogramSegment<S, M>;
  index: number;
  start: number;
  end: number;
  duration: number;
}

export interface Timeline<S extends string, M> extends TimeFormatContext {
  intervals: NormalizedInterval<S, M>[];
  toValue: (value: TimeValue) => number;
}

function parseTime(value: TimeValue, options: TimeOptions): number {
  const parsed = options.parse ? options.parse(value)
    : typeof value === 'number' ? value * (options.timestampUnit === 'seconds' ? 1000 : 1)
    : /^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) ? Date.parse(value) : NaN;
  if (!Number.isFinite(parsed) || Math.abs(parsed) > 8.64e15) {
    throw new Error('Invalid time. Use a Unix timestamp, ISO date/time with timezone, or time.parse.');
  }
  return parsed;
}

export function normalizeTimeline<S extends string, M>(
  data: readonly HypnogramSegment<S, M>[],
  options: TimeOptions = {},
  domain?: readonly [TimeValue, TimeValue],
): Timeline<S, M> {
  const locale = options.locale ?? 'en-GB';
  const timeZone = options.timeZone ?? 'Asia/Shanghai';
  new Intl.DateTimeFormat(locale, { timeZone });
  const toValue = (value: TimeValue) => parseTime(value, options);
  const ids = new Set<string>();
  const intervals = data.map((segment, index) => {
    if (!segment.id || ids.has(segment.id)) throw new Error(`Duplicate or empty segment id: ${segment.id}`);
    ids.add(segment.id);
    const start = toValue(segment.start), end = toValue(segment.end);
    if (!(end > start) || !Number.isFinite(end - start)) throw new Error(`Invalid interval: ${segment.id}; end must be greater than start.`);
    return { segment, index, start, end, duration: end - start };
  }).sort((a, b) => a.start - b.start);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i]!.start < intervals[i - 1]!.end) throw new Error(`Overlapping intervals: ${intervals[i - 1]!.segment.id}, ${intervals[i]!.segment.id}`);
  }
  const extent: readonly [number, number] = domain ? [toValue(domain[0]), toValue(domain[1])]
    : [intervals[0]?.start ?? 0, intervals.at(-1)?.end ?? 1000];
  if (!(extent[1] > extent[0]) || !Number.isFinite(extent[1] - extent[0])) throw new Error('domain must be a finite increasing range.');
  return { intervals, domain: extent, locale, timeZone, toValue };
}

export function formatTimelineValue(value: number, context: TimeFormatContext): string {
  const span = context.domain[1] - context.domain[0];
  const options: Intl.DateTimeFormatOptions = { timeZone: context.timeZone, hourCycle: 'h23' };
  if (span < 60_000) Object.assign(options, { hour: '2-digit', minute: '2-digit', second: '2-digit', ...(span < 1000 ? { fractionalSecondDigits: 3 } : {}) });
  else if (span < 86_400_000) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  else if (span < 7 * 86_400_000) Object.assign(options, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  else if (span < 366 * 86_400_000) Object.assign(options, { month: 'short', day: 'numeric' });
  else Object.assign(options, { year: 'numeric', month: 'short' });
  return new Intl.DateTimeFormat(context.locale, options).format(value);
}

export interface TimelineTick { value: number; label: string; align: 'start' | 'middle' | 'end' }
const TIME_STEPS = [1, 5, 10, 50, 100, 250, 500, 1000, 5000, 15000, 30000, 60000, 300000, 900000, 1800000, 3600000, 7200000, 10800000, 21600000, 43200000, 86400000, 172800000, 604800000, 2592000000, 7776000000, 31536000000];

function niceStep(target: number): number {
  const exponent = 10 ** Math.floor(Math.log10(target));
  return ([1, 2, 5, 10].find(n => n * exponent >= target) ?? 10) * exponent;
}

/** Offset at the candidate instant aligns round hours to the displayed timezone. */
function localOffset(value: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
  const zone = formatter.formatToParts(value).find(part => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/.exec(zone);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 3600000 + Number(match[3]) * 60000 + Number(match[4] ?? 0) * 1000);
}

export function buildTimelineTicks<S extends string, M>(timeline: Timeline<S, M>, width: number, options: XAxisOptions = {}): TimelineTick[] {
  const [start, end] = timeline.domain;
  const max = options.maxMiddleTicks ?? 3;
  if (!Number.isInteger(max) || max < 0 || max > 1000) throw new Error('maxMiddleTicks must be an integer between 0 and 1000.');
  for (const value of [options.referenceInterval, options.snapTo]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error('Tick intervals must be finite and positive.');
  }
  const format = options.formatLabel ?? formatTimelineValue;
  let candidates: number[];
  if (options.ticks) {
    candidates = options.ticks.map(timeline.toValue);
    if (candidates.some((value, i) => i > 0 && value <= candidates[i - 1]!)) throw new Error('ticks must be strictly increasing.');
    candidates = candidates.filter(value => value >= start && value <= end);
  } else {
    const span = end - start;
    // Count and snap granularity are different decisions: first divide the whole
    // range evenly, then move each candidate at most half a small snap interval.
    const reference = options.referenceInterval ?? (span >= 3 * 3600000 ? 3 * 3600000 : span / 3);
    const snap = options.snapTo ?? (span >= 3 * 3600000 && span <= 2 * 86400000
      ? 30 * 60000 : TIME_STEPS.find(value => value >= span / 24) ?? niceStep(span / 24));
    const count = Math.min(max, Math.max(1, Math.ceil(span / reference) - 1));
    const middle = Array.from({ length: count }, (_, i) => {
      const ideal = start + span * (i + 1) / (count + 1);
      const offset = localOffset(ideal, timeline.timeZone);
      return Math.round((ideal + offset) / snap) * snap - offset;
    });
    candidates = [start, ...new Set(middle.filter(value => value > start && value < end)), end].sort((a, b) => a - b);
  }
  let ticks: TimelineTick[] = candidates.map((value, index) => ({ value, label: format(value, timeline), align: index === 0 ? 'start' : index === candidates.length - 1 ? 'end' : 'middle' }));
  // In a repeated DST hour, include an offset to disambiguate equal wall-clock labels.
  if (!options.formatLabel) {
    ticks = ticks.map(tick => ticks.filter(other => other.label === tick.label).length > 1
      ? { ...tick, label: `${tick.label} ${new Intl.DateTimeFormat(timeline.locale, { timeZone: timeline.timeZone, timeZoneName: 'shortOffset' }).formatToParts(tick.value).find(part => part.type === 'timeZoneName')?.value ?? ''}` }
      : tick);
  }
  const fontSize = options.labelStyle?.fontSize ?? 12;
  const gap = options.minLabelGap ?? 8;
  const bounds = (tick: TimelineTick) => {
    const w = tick.label.length * fontSize * 0.62;
    const x = (tick.value - start) / (end - start) * width;
    return { left: x - (tick.align === 'end' ? w : tick.align === 'middle' ? w / 2 : 0), right: x + (tick.align === 'start' ? w : tick.align === 'middle' ? w / 2 : 0) };
  };
  if (ticks.length <= 1) return ticks;
  const first = ticks[0]!, last = ticks.at(-1)!;
  if (bounds(first).right + gap > bounds(last).left) return [first];
  const kept = [first];
  for (const tick of ticks.slice(1, -1)) {
    if (bounds(tick).left >= bounds(kept.at(-1)!).right + gap && bounds(tick).right + gap <= bounds(last).left) kept.push(tick);
  }
  return [...kept, last];
}
