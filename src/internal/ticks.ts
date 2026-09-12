import type { Timeline, TimelineTick } from '../time';
import type { XAxisOptions } from '../types';
import { createTimeFormatter } from './time-format';

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

export function tickCandidates(timeline: Timeline<string, unknown>, referenceInterval?: number, snapTo?: number, max = 3): number[] {
  const [start, end] = timeline.domain;
  const span = end - start;
  // Count and snap granularity are different decisions: first divide the whole
  // range evenly, then move each candidate at most half a small snap interval.
  const reference = referenceInterval ?? (span >= 3 * 3600000 ? 3 * 3600000 : span / 3);
  const snap = snapTo ?? (span >= 3 * 3600000 && span <= 2 * 86400000
    ? 30 * 60000 : TIME_STEPS.find(value => value >= span / 24) ?? niceStep(span / 24));
  const count = Math.min(max, Math.max(1, Math.ceil(span / reference) - 1));
  const middle = Array.from({ length: count }, (_, i) => {
    const ideal = start + span * (i + 1) / (count + 1);
    const offset = localOffset(ideal, timeline.timeZone);
    return Math.round((ideal + offset) / snap) * snap - offset;
  });
  return [start, ...new Set(middle.filter(value => value > start && value < end)), end].sort((a, b) => a - b);

}

export function formatTicks(timeline: Timeline<string, unknown>, candidates: number[], formatLabel?: XAxisOptions['formatLabel']): TimelineTick[] {
  const format = formatLabel ?? createTimeFormatter(timeline);
  let ticks: TimelineTick[] = candidates.map((value, index) => ({ value, label: format(value, timeline), align: index === 0 ? 'start' : index === candidates.length - 1 ? 'end' : 'middle' }));
  // In a repeated DST hour, include an offset to disambiguate equal wall-clock labels.
  if (!formatLabel) {
    const counts = new Map<string, number>();
    for (const tick of ticks) counts.set(tick.label, (counts.get(tick.label) ?? 0) + 1);
    ticks = ticks.map(tick => counts.get(tick.label)! > 1
      ? { ...tick, label: `${tick.label} ${new Intl.DateTimeFormat(timeline.locale, { timeZone: timeline.timeZone, timeZoneName: 'shortOffset' }).formatToParts(tick.value).find(part => part.type === 'timeZoneName')?.value ?? ''}` }
      : tick);
  }
  return ticks;
}

export function fitTicks(ticks: TimelineTick[], [start, end]: readonly [number, number], width: number, fontSize = 12, gap = 8): TimelineTick[] {
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

/** Default chart axis excludes the exported helper's custom-input validation. */
export function buildDefaultTicks(timeline: Timeline<string, unknown>, width: number, fontSize: number): TimelineTick[] {
  return fitTicks(formatTicks(timeline, tickCandidates(timeline)), timeline.domain, width, fontSize);
}
