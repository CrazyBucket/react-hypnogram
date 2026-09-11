import * as React from 'react';
import type { ReactNode } from 'react';
import type { Paint, Rect } from '../types';

/** Definitions live in the same SVG, with instance-unique IDs for SSR and grids. */
export function createPaintRegistry(prefix: string) {
  const definitions: ReactNode[] = [];
  const cache = new Map<string, string>();
  function resolve(paint: Paint, rect: Rect): string {
    if (typeof paint === 'string') return paint;
    const key = JSON.stringify([paint, rect]);
    const found = cache.get(key);
    if (found) return found;
    if (paint.stops.length < 2 || paint.stops.some((stop, i) => !Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1
      || (i > 0 && stop.offset < paint.stops[i - 1]!.offset)
      || (stop.opacity !== undefined && (!Number.isFinite(stop.opacity) || stop.opacity < 0 || stop.opacity > 1)))) {
      throw new Error('Gradients require at least two ordered stops with offsets and opacity in [0, 1].');
    }
    const id = `${prefix}-paint-${definitions.length}`;
    const value = `url(#${id})`;
    cache.set(key, value);
    definitions.push(<linearGradient key={id} id={id} gradientUnits="userSpaceOnUse"
      x1={rect.x} x2={paint.direction === 'horizontal' ? rect.x + rect.width : rect.x}
      y1={rect.y} y2={paint.direction === 'horizontal' ? rect.y : rect.y + rect.height}>
      {paint.stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />)}
    </linearGradient>);
    return value;
  }
  return { definitions, resolve };
}
