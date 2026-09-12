import type { GradientStop, Stage } from '../types';

/** One Y-axis palette shared by every bar and connector. No alpha overlays. */
export function buildStageStops(
  rows: readonly { stage: Stage<string>; cy: number }[],
  thickness: number,
  plot: { y: number; height: number },
): GradientStop[] {
  if (plot.height <= 0) return [];
  const stops: GradientStop[] = [];
  for (const { stage, cy } of rows) {
    const paint = stage.fill ?? stage.color;
    const local = typeof paint === 'string'
      ? [{ offset: 0, color: paint }, { offset: 1, color: paint }]
      : paint.stops;
    if (typeof paint !== 'string' && paint.direction && paint.direction !== 'vertical') {
      throw new Error('Stage fills use vertical gradients.');
    }
    if (local.length < 2 || local.some((stop, i) => !Number.isFinite(stop.offset)
      || stop.offset < 0 || stop.offset > 1 || (i > 0 && stop.offset < local[i - 1]!.offset)
      || (stop.opacity !== undefined && (!Number.isFinite(stop.opacity) || stop.opacity < 0 || stop.opacity > 1)))) {
      throw new Error('Gradients require at least two ordered stops with offsets and opacity in [0, 1].');
    }
    // Repeat edge colors when a caller's first/last stop is inside the bar.
    const bounded = [
      ...(local[0]!.offset > 0 ? [{ ...local[0]!, offset: 0 }] : []),
      ...local,
      ...(local[local.length - 1]!.offset < 1 ? [{ ...local[local.length - 1]!, offset: 1 }] : []),
    ];
    for (const stop of bounded) {
      stops.push({ ...stop, offset: (cy - thickness / 2 + stop.offset * thickness - plot.y) / plot.height });
    }
  }
  // Between bars SVG interpolates automatically. At touching edges, duplicate
  // offsets deliberately create a hard color change instead of bleeding inward.
  return stops;
}
