import { expect, it, vi } from 'vitest';
import { buildLayout } from '../src/internal/layout';
import type { HypnogramProps } from '../src/types';
const data: HypnogramProps['data'] = [
  { id: 'a', stage: 'light', start: 0, end: 1000 },
  { id: 'b', stage: 'deep', start: 1000, end: 2000 },
];
it('retains original intervals and input indices while sorting', () => {
  const chart = buildLayout({ data: [...data].reverse() }, 500);
  expect(chart.bars[0]!.segment).toBe(data[0]);
  expect(chart.bars[0]!.duration).toBe(1000);
  expect(chart.bars[0]!.index).toBe(1);
});
it('clamps bar thickness to the explicit stage height to prevent overlap', () => {
  const chart = buildLayout({ data, stageHeight: 80, barThickness: 100 }, 500);
  expect(chart.bars[0]!.rect.height).toBe(80);
  expect(chart.bars[0]!.rect.y + chart.bars[0]!.rect.height).toBeLessThanOrEqual(chart.bars[1]!.rect.y);
});
it('requires stage mappings and rejects invalid geometry', () => {
  expect(() => buildLayout({ data: [{ id: 'x', stage: 'N1', start: 0, end: 1 }] }, 500)).toThrow('Unknown stage');
  expect(() => buildLayout({ data, stages: [{ id: 'light', label: '', color: '#fff' }, { id: 'light', label: '', color: '#fff' }] }, 500)).toThrow('Duplicate');
  expect(() => buildLayout({ data, barThickness: NaN }, 500)).toThrow('barThickness');
});
it('drops label gutters when labels are hidden', () => {
  const full = buildLayout({ data }, 720);
  expect(full.plot.x).toBe(72);
  expect(buildLayout({ data, yLabels: false }, 720).plot.x).toBe(0);
  const bare = buildLayout({ data, xLabels: false, yLabels: false }, 720);
  expect(bare.plot.x).toBe(0);
  expect(bare.totalHeight).toBe(bare.plot.y + bare.plot.height + 16);
  expect(bare.plot.width).toBeGreaterThan(full.plot.width);
});
it('only connects contiguous stages and preserves gaps', () => {
  expect(buildLayout({ data: [data[0]!, { ...data[1]!, start: 4000, end: 5000 }] }, 500).outline.match(/M /g)).toHaveLength(2);
  expect(buildLayout({ data: [data[0]!, { ...data[1]!, start: 1200 }], connectors: { maxGap: 0 } }, 500).outline.match(/M /g)).toHaveLength(2);
  expect(buildLayout({ data: [data[0]!, { ...data[1]!, start: 1200 }], connectors: { maxGap: 500 } }, 500).outline.match(/M /g)).toHaveLength(1);
  expect(buildLayout({ data, connectors: false }, 500).outline.match(/M /g)).toHaveLength(2);
});
it('connects 1s discrete timestamps by default and allows disabling via maxGap', () => {
  const discrete = [
    { id: '1', stage: 'light', start: 1788632885000, end: 1788634166000 },
    { id: '2', stage: 'deep', start: 1788634167000, end: 1788634567000 },
  ];
  expect(buildLayout({ data: discrete }, 500).outline.match(/M /g)).toHaveLength(1);
  expect(buildLayout({ data: discrete, connectors: { maxGap: 0 } }, 500).outline.match(/M /g)).toHaveLength(2);
});
it('keeps connectors with compact H5 geometry and hidden axes', () => {
  const chart = buildLayout({ data, radius: 0, stageHeight: 24, barThickness: 24,
    connectorWidth: 2, grid: false, axes: false, yLabels: false, connectors: true }, 360);
  expect(chart.outline.match(/M /g)).toHaveLength(1);
});
it('supports stageHeight and barThickness for custom spacing and seamless fit', () => {
  const spaced = buildLayout({ data, stageHeight: 40, barThickness: 24 }, 500);
  expect(spaced.bars[0]!.rect.height).toBe(24);
  expect(spaced.bars[1]!.rect.y - (spaced.bars[0]!.rect.y + spaced.bars[0]!.rect.height)).toBe(16);

  const seamless = buildLayout({ data, stageHeight: 24, barThickness: 24 }, 500);
  expect(seamless.bars[0]!.rect.height).toBe(24);
  expect(seamless.bars[0]!.rect.y + seamless.bars[0]!.rect.height).toBe(seamless.bars[1]!.rect.y);

  const autoSeamless = buildLayout({ data, stageHeight: 24 }, 500);
  expect(autoSeamless.bars[0]!.rect.height).toBe(24);
  expect(autoSeamless.bars[0]!.rect.y + autoSeamless.bars[0]!.rect.height).toBe(autoSeamless.bars[1]!.rect.y);

  expect(() => buildLayout({ data, stageHeight: NaN }, 500)).toThrow('stageHeight');
  expect(() => buildLayout({ data, barThickness: NaN }, 500)).toThrow('barThickness');
});
it('moves labels inward and outward without changing data geometry', () => {
  const initial = buildLayout({ data }, 500);
  const inward = buildLayout({ data, xAxis: { labelOffset: -20 }, yAxis: { labelOffset: -10 } }, 500);
  expect(inward.xLabelY).toBe(initial.xLabelY - 20);
  expect(inward.yLabelX).toBe(initial.yLabelX + 10);
  expect(inward.bars).toEqual(initial.bars);
  expect(inward.totalHeight).toBe(initial.totalHeight - 20);
  const outward = buildLayout({ data, xAxis: { labelOffset: 50 } }, 500);
  expect(outward.totalHeight).toBe(initial.totalHeight + 50);
  expect(() => buildLayout({ data, yAxis: { labelOffset: Infinity } }, 500)).toThrow('labelOffset');
});
it('supports plot margins and skips only the requested adjacent-stage connections', () => {
  const chart = buildLayout({ data, stageHeight: 24, barThickness: 24,
    xLabels: false, yLabels: false, plotPadding: { top: 0, right: 0, bottom: 0, left: 0 },
    connectors: { minStageDistance: 2 } }, 360);
  expect(chart.plot).toEqual({ x: 0, y: 0, width: 360, height: 96 });
  expect(chart.totalHeight).toBe(96);
  expect(chart.outline.match(/M /g)).toHaveLength(2);
  const jump = buildLayout({ data: [data[0]!, { ...data[1]!, stage: 'awake' }],
    connectors: { minStageDistance: 2 } }, 360);
  expect(jump.outline.match(/M /g)).toHaveLength(1);
});
it('uses the effective x-axis font size for tick collision avoidance', () => {
  const data = [{ id: 'a', stage: 'light', start: 1738598400000, end: 1738628040000 }];
  const original = buildLayout({ data }, 400);
  const styled = buildLayout({ data, xAxis: { style: { fontSize: 40 } } }, 400);
  const alias = buildLayout({ data, xAxis: { labelStyle: { fontSize: 40 } } }, 400);
  expect(styled.ticks).toEqual(alias.ticks);
  expect(styled.ticks.length).toBeLessThan(original.ticks.length);
  expect(buildLayout({ data, xAxis: { labelStyle: { fontSize: 40 }, style: { fontSize: 12 } } }, 400).ticks)
    .toEqual(original.ticks);
});
it('reuses date formatters across segment labels within one layout', () => {
  const spy = vi.spyOn(Intl, 'DateTimeFormat');
  try {
    const data = Array.from({ length: 200 }, (_, i) => ({ id: String(i), stage: 'light',
      start: 1738598400000 + i * 60000, end: 1738598400000 + (i + 1) * 60000 }));
    const chart = buildLayout({ data, connectors: false }, 500);
    expect(chart.bars[0]!.startLabel).toBe('00:00');
    expect(chart.bars.at(-1)!.endLabel).toBe('03:20');
    expect(spy.mock.calls.length).toBeLessThan(10);
  } finally { spy.mockRestore(); }
});
