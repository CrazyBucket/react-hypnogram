import { createTimeFormatter } from './internal/time-format';
import { fitTicks, formatTicks, tickCandidates } from './internal/ticks';
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
  return createTimeFormatter(context)(value);
}

export interface TimelineTick { value: number; label: string; align: 'start' | 'middle' | 'end' }

/** Full helper API; unused custom-input branches are omitted from component-only imports. */
export function buildTimelineTicks<S extends string, M>(timeline: Timeline<S, M>, width: number, options: XAxisOptions = {}): TimelineTick[] {
  const max = options.maxMiddleTicks ?? 3;
  if (!Number.isInteger(max) || max < 0 || max > 1000) throw new Error('maxMiddleTicks must be an integer between 0 and 1000.');
  for (const value of [options.referenceInterval, options.snapTo]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error('Tick intervals must be finite and positive.');
  }
  let candidates: number[];
  if (options.ticks) {
    candidates = options.ticks.map(timeline.toValue);
    if (candidates.some((value, i) => i > 0 && value <= candidates[i - 1]!)) throw new Error('ticks must be strictly increasing.');
    candidates = candidates.filter(value => value >= timeline.domain[0] && value <= timeline.domain[1]);
  } else {
    candidates = tickCandidates(timeline, options.referenceInterval, options.snapTo, max);
  }
  return fitTicks(formatTicks(timeline, candidates, options.formatLabel), timeline.domain, width, options.labelStyle?.fontSize, options.minLabelGap);
}
