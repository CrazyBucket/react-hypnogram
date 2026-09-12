import { expect, it } from 'vitest';
import { placeTooltip } from '../src/internal/tooltip-position';
const boundary = { x: 0, y: -100, width: 360, height: 300 };
it('positions actual custom dimensions and shifts the arrow when clamped at an edge', () => {
  const p = placeTooltip({ x: 320, y: 60, width: 20, height: 24 }, { width: 230, height: 90 }, boundary, 'top', 10, 8);
  expect(p).toEqual({ left: 122, top: -40, placement: 'top', arrowOffset: 208 });
});
it('flips below when the preferred side has insufficient room', () => {
  expect(placeTooltip({ x: 30, y: -90, width: 20, height: 24 }, { width: 120, height: 70 }, boundary, 'top', 10, 8))
    .toEqual({ left: 8, top: -56, placement: 'bottom', arrowOffset: 32 });
});
it('keeps oversized content at the available boundary when neither side fits', () => {
  const p = placeTooltip({ x: 10, y: 5, width: 20, height: 24 }, { width: 400, height: 500 }, boundary, 'top', 10, 8);
  expect(p.left).toBe(8);
  expect(p.top).toBe(-92);
});
