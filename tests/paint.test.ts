import { expect, it } from 'vitest';
import { buildStageStops } from '../src/internal/paint';
import { buildLayout } from '../src/internal/layout';
import type { Stage } from '../src';

const stages: Stage[] = [
  { id: 'light', label: 'Light', color: '#111111' },
  { id: 'deep', label: 'Deep', color: '#eeeeee' },
];
function palette(stageHeight: number, thickness: number, definitions = stages) {
  const layout = buildLayout({ data: [], stages: definitions, stageHeight, barThickness: thickness }, 400);
  return buildStageStops(layout.rows, layout.thickness, layout.plot)
    .map(stop => ({ ...stop, y: stop.offset * layout.plot.height + layout.plot.y }));
}
it('keeps solid bars flat and blends only between their physical edges', () => {
  for (const gap of [20, 1, 0.01]) {
    const stops = palette(24 + gap, 24);
    const lastLight = stops.filter(s => s.color === '#111111').at(-1)!;
    const firstDeep = stops.find(s => s.color === '#eeeeee')!;
    expect(firstDeep.y - lastLight.y).toBeCloseTo(gap, 8);
    expect(lastLight.y).toBeCloseTo(32 + gap / 2 + 24);
  }
});
it('creates a hard color boundary at zero row spacing', () => {
  const stops = palette(24, 24);
  expect(stops.filter(s => s.y === 56).map(s => s.color)).toEqual(['#111111', '#eeeeee']);
});
it('places each custom stop within bar thickness and preserves opacity', () => {
  const stops = palette(40, 20, [{ ...stages[0]!, fill: { type: 'linear', stops: [
    { offset: 0.25, color: 'red', opacity: 0.2 }, { offset: 0.75, color: 'blue', opacity: 0.8 },
  ] } }]);
  expect(stops.map(s => [s.y, s.color, s.opacity])).toEqual([
    [42, 'red', 0.2], [47, 'red', 0.2], [57, 'blue', 0.8], [62, 'blue', 0.8],
  ]);
});
it('rejects invalid stops instead of generating unpredictable SVG gradients', () => {
  expect(() => palette(40, 20, [{ ...stages[0]!, fill: { type: 'linear', stops: [
    { offset: 1, color: 'red' }, { offset: 0, color: 'blue' },
  ] } }])).toThrow('ordered stops');
});
