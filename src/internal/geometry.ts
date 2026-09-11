import type { Rect } from '../types';

type Point = { x: number; y: number };
type Edge = { from: Point; to: Point; direction: number };
const EPSILON = 1e-7;
const key = (p: Point) => `${p.x},${p.y}`;

/** Extend touching bar ends by half the connector width, so the stem sits inside
 * both silhouettes. The caller retains the original data/interaction bounds. */
export function connectBars(bars: Rect[], pairs: readonly [number, number][], width: number): Rect[] {
  const shapes = bars.map(bar => ({ ...bar }));
  const connectors: Rect[] = [];
  for (const [from, to] of pairs) {
    const a = bars[from]!, b = bars[to]!;
    const half = Math.min(width / 2, a.width / 2, b.width / 2);
    if (half <= 0) continue;
    const joinX = (a.x + a.width + b.x) / 2;
    shapes[from]!.width = joinX + half - shapes[from]!.x;
    const rightB = shapes[to]!.x + shapes[to]!.width;
    shapes[to]!.x = joinX - half;
    shapes[to]!.width = Math.max(0, rightB - shapes[to]!.x);
    const centerA = a.y + a.height / 2, centerB = b.y + b.height / 2;
    connectors.push({ x: joinX - half, y: Math.min(centerA, centerB), width: half * 2, height: Math.abs(centerA - centerB) });
  }
  return [...shapes, ...connectors];
}

function axisCoordinates(values: number[]): number[] {
  const result: number[] = [];
  for (const value of values.sort((a, b) => a - b)) {
    if (!result.length || value - result[result.length - 1]! > EPSILON) result.push(value);
  }
  return result;
}

/** Integer-grid edge identities avoid floating point seams. At a touching vertex
 * retain every outgoing edge and turn right to follow the current face, rather
 * than overwriting an edge and accidentally closing an open chain diagonally. */
export function unionContours(rectangles: readonly Rect[]): Point[][] {
  const rects = rectangles.filter(r => r.width > EPSILON && r.height > EPSILON);
  if (!rects.length) return [];
  const xs = axisCoordinates(rects.flatMap(r => [r.x, r.x + r.width]));
  const ys = axisCoordinates(rects.flatMap(r => [r.y, r.y + r.height]));
  const indexOf = (axis: number[], value: number) => axis.findIndex(v => Math.abs(v - value) <= EPSILON);
  const cells = new Set<string>();
  for (const rect of rects) {
    const left = indexOf(xs, rect.x), right = indexOf(xs, rect.x + rect.width);
    const top = indexOf(ys, rect.y), bottom = indexOf(ys, rect.y + rect.height);
    for (let i = left; i < right; i++) for (let j = top; j < bottom; j++) cells.add(`${i},${j}`);
  }
  const edges: Edge[] = [];
  const outgoing = new Map<string, number[]>();
  const add = (x: number, y: number, x2: number, y2: number, direction: number) => {
    const edge = { from: { x, y }, to: { x: x2, y: y2 }, direction };
    const list = outgoing.get(key(edge.from)) ?? [];
    list.push(edges.length); outgoing.set(key(edge.from), list); edges.push(edge);
  };
  for (const cell of cells) {
    const [i, j] = cell.split(',').map(Number) as [number, number];
    if (!cells.has(`${i},${j - 1}`)) add(i, j, i + 1, j, 0);
    if (!cells.has(`${i + 1},${j}`)) add(i + 1, j, i + 1, j + 1, 1);
    if (!cells.has(`${i},${j + 1}`)) add(i + 1, j + 1, i, j + 1, 2);
    if (!cells.has(`${i - 1},${j}`)) add(i, j + 1, i, j, 3);
  }
  const visited = new Set<number>();
  const contours: Point[][] = [];
  const turnRank = (incoming: number, next: number) => [1, 0, 3, 2].indexOf((next - incoming + 4) % 4);
  for (let first = 0; first < edges.length; first++) {
    if (visited.has(first)) continue;
    const origin = key(edges[first]!.from);
    const points: Point[] = [];
    let current = first;
    while (true) {
      const edge = edges[current]!;
      visited.add(current);
      points.push({ x: xs[edge.from.x]!, y: ys[edge.from.y]! });
      if (key(edge.to) === origin) break;
      const candidates = (outgoing.get(key(edge.to)) ?? []).filter(id => !visited.has(id));
      candidates.sort((a, b) => turnRank(edge.direction, edges[a]!.direction) - turnRank(edge.direction, edges[b]!.direction));
      if (candidates[0] === undefined) throw new Error('Open outline: refusing to close an invalid polygon.');
      current = candidates[0];
    }
    contours.push(points.filter((point, i) => {
      const before = points[(i + points.length - 1) % points.length]!, after = points[(i + 1) % points.length]!;
      return (point.x - before.x) * (after.y - point.y) !== (point.y - before.y) * (after.x - point.x);
    }));
  }
  return contours;
}

function roundedContour(points: Point[], radius: number): string {
  if (!points.length) return '';
  return points.map((point, i) => {
    const a = points[(i + points.length - 1) % points.length]!, b = points[(i + 1) % points.length]!;
    const la = Math.hypot(point.x - a.x, point.y - a.y), lb = Math.hypot(b.x - point.x, b.y - point.y);
    const r = Math.max(0, Math.min(radius, la / 2, lb / 2));
    const before = { x: point.x + (a.x - point.x) * r / la, y: point.y + (a.y - point.y) * r / la };
    const after = { x: point.x + (b.x - point.x) * r / lb, y: point.y + (b.y - point.y) * r / lb };
    const sweep = (point.x - a.x) * (b.y - point.y) - (point.y - a.y) * (b.x - point.x) > 0 ? 1 : 0;
    return `${i === 0 ? 'M' : 'L'} ${before.x} ${before.y} ${r ? `A ${r} ${r} 0 0 ${sweep}` : 'L'} ${after.x} ${after.y}`;
  }).join(' ') + ' Z';
}

export function roundedUnionPath(rectangles: readonly Rect[], radius: number): string {
  return unionContours(rectangles).map(points => roundedContour(points, radius)).join(' ');
}

/** Independent shapes stay independent when connectors are disabled, including
 * corner-touching full-height bars. */
export function roundedBarsPath(bars: readonly Rect[], radius: number): string {
  return bars.filter(r => r.width > EPSILON && r.height > EPSILON).map(r => roundedContour([
    { x: r.x, y: r.y }, { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height },
  ], radius)).join(' ');
}
