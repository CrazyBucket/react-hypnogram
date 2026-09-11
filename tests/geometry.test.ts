import { expect, it } from 'vitest';
import { connectBars, roundedBarsPath, roundedUnionPath, unionContours } from '../src/internal/geometry';

it('rounds a union into one outline, retaining disconnected gaps', () => {
  const path = roundedUnionPath([{ x: 0, y: 0, width: 40, height: 20 }, { x: 39, y: 10, width: 2, height: 40 }, { x: 40, y: 40, width: 40, height: 20 }], 12);
  expect(path.match(/M /g)).toHaveLength(1);
  expect(path).toContain('A ');
  expect(path).not.toMatch(/NaN|Infinity/);
  expect(roundedUnionPath([{ x: 0, y: 0, width: 10, height: 10 }, { x: 30, y: 20, width: 10, height: 10 }], 4).match(/M /g)).toHaveLength(2);
});

it('supports zero radius and narrow bars without invalid coordinates', () => {
  expect(roundedUnionPath([{ x: 0, y: 0, width: 10, height: 10 }], 0)).not.toContain('A ');
  expect(roundedUnionPath([{ x: 0, y: 0, width: 0.01, height: 20 }], 99)).not.toMatch(/NaN|Infinity/);
  expect(roundedUnionPath([], 3)).toBe('');
});

it('keeps point-touching full-height bars closed without diagonal edges', () => {
  const bars = [0, 2, 3, 2, 1, 2, 3, 2, 1, 2, 0].map((row, i) => ({ x: i * 31.17, y: row * 44, width: 31.17, height: 44 }));
  const contours = unionContours(bars);
  for (const contour of contours) contour.forEach((point, i) => {
    const next = contour[(i + 1) % contour.length]!;
    expect(point.x === next.x || point.y === next.y).toBe(true);
  });
  const area = contours.reduce((total, contour) => total + Math.abs(contour.reduce((sum, p, i) => {
    const next = contour[(i + 1) % contour.length]!;
    return sum + p.x * next.y - p.y * next.x;
  }, 0) / 2), 0);
  expect(area).toBeCloseTo(11 * 31.17 * 44);
  expect(roundedBarsPath(bars, 5).match(/M /g)).toHaveLength(11);
});

it('overlaps connector ends inside both bars without changing input bounds', () => {
  const bars = [{ x: 0, y: 0, width: 40, height: 26 }, { x: 40, y: 100, width: 50, height: 26 }];
  const shapes = connectBars(bars, [[0, 1]], 8);
  expect(shapes[0]!.x + shapes[0]!.width).toBe(44);
  expect(shapes[1]!.x).toBe(36);
  expect(shapes[2]).toEqual({ x: 36, y: 13, width: 8, height: 100 });
  expect(bars[1]!.x).toBe(40);
  expect(roundedUnionPath(shapes, 12).match(/M /g)).toHaveLength(1);
});
