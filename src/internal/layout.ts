import { buildTimelineTicks, formatTimelineValue, normalizeTimeline } from '../time';
import type { DefaultStage, HypnogramBaseProps, Rect, Stage } from '../types';
import { connectBars, roundedBarsPath, roundedUnionPath } from './geometry';

export interface ConnectorLayout {
  index: number;
  rect: Rect;
  y1: number;
  y2: number;
  stops: { offset: number; color: string }[];
  feather: number;
}

export const DEFAULT_STAGES: readonly Stage<DefaultStage>[] = Object.freeze([
  { id: 'awake', label: 'Awake', color: '#D6E7FF' },
  { id: 'rem', label: 'REM', color: '#94BDFF' },
  { id: 'light', label: 'Light', color: '#1D81F5' },
  { id: 'deep', label: 'Deep', color: '#005CC7' },
].map(stage => Object.freeze(stage))) as readonly Stage<DefaultStage>[];

export function dimension(value: number, name: string, min = 0): number {
  if (!Number.isFinite(value) || value < min) throw new Error(`${name} must be finite and >= ${min}.`);
  return value;
}
function formatDuration(value: number): string {
  if (value < 60000) return `${Number((value / 1000).toFixed(2))} sec`;
  if (value < 3600000) return `${Number((value / 60000).toFixed(1))} min`;
  return `${Number((value / 3600000).toFixed(1))} hr`;
}

function labelFontSize(value: number | string | undefined): number {
  if (typeof value === 'number') return dimension(value, 'fontSize');
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 11;
}

/** The existing preview geometry, isolated from React and DOM measurements. */
export function buildLayout<S extends string, M>(props: HypnogramBaseProps<S, M> & { stages?: readonly Stage<S>[] }, width: number) {
  const stages = props.stages ?? DEFAULT_STAGES as unknown as readonly Stage<S>[];
  const rowIndex = new Map<S, number>();
  stages.forEach((stage, i) => {
    if (!stage.id || rowIndex.has(stage.id)) throw new Error(`Duplicate or empty stage id: ${stage.id}`);
    rowIndex.set(stage.id, i);
  });
  const timeline = normalizeTimeline(props.data, props.time);
  const rawThickness = props.barThickness ?? props.barHeight;
  const thicknessName = props.barThickness !== undefined ? 'barThickness' : 'barHeight';
  const radius = dimension(props.radius ?? 12, 'radius');
  if (props.rowGap !== undefined && !Number.isFinite(props.rowGap)) throw new Error('rowGap must be finite.');
  const stageHeight = props.stageHeight !== undefined
    ? dimension(props.stageHeight, 'stageHeight', 1)
    : Math.max(
        rawThickness !== undefined ? dimension(rawThickness, thicknessName) : 26,
        Math.max(44, rawThickness !== undefined ? dimension(rawThickness, thicknessName) : 26) + (props.rowGap ?? 12),
      );
  const thickness = rawThickness !== undefined
    ? Math.min(stageHeight, dimension(rawThickness, thicknessName))
    : Math.min(stageHeight, 26);
  const xLabelOffset = props.xAxis?.labelOffset ?? 0;
  const yLabelOffset = props.yAxis?.labelOffset ?? 0;
  if (!Number.isFinite(xLabelOffset) || !Number.isFinite(yLabelOffset)) throw new Error('Axis labelOffset must be finite.');
  const xFontSize = labelFontSize(props.xAxis?.style?.fontSize ?? props.xAxis?.labelStyle?.fontSize);
  const yFontSize = labelFontSize(props.yAxis?.style?.fontSize ?? props.yAxis?.labelStyle?.fontSize);
  const padX = props.yLabels === false ? 0 : width < 500 ? 55 : 72;
  const padRight = width < 500 ? 16 : 24;
  const plot: Rect = { x: padX, y: 32, width: Math.max(1, width - padX - padRight), height: stages.length * stageHeight };
  const labelStep = Math.max(stageHeight, yFontSize + 4);
  const firstLabelY = plot.y + plot.height / 2 - Math.max(0, stages.length - 1) * labelStep / 2;
  const labelShift = Math.max(0, 12 - firstLabelY);
  const x = (value: number) => plot.x + (value - timeline.domain[0]) / (timeline.domain[1] - timeline.domain[0]) * plot.width;
  const rows = stages.map((stage, i) => {
    const y = plot.y + i * stageHeight;
    const cy = y + stageHeight / 2;
    const labelY = labelStep === stageHeight ? cy : firstLabelY + labelShift + i * labelStep;
    return { stage, cy, labelY, rect: { x: plot.x, y, width: plot.width, height: stageHeight } };
  });
  const barGap = props.gap !== undefined ? dimension(props.gap, 'gap') : 0;
  const bars = timeline.intervals.map(item => {
    const row = rowIndex.get(item.segment.stage);
    if (row === undefined) throw new Error(`Unknown stage: ${item.segment.stage}. Supply a stages mapping.`);
    const stage = stages[row]!;
    const fullWidth = x(item.end) - x(item.start);
    const gap = barGap > 0 ? Math.min(fullWidth, barGap) : 0;
    return { ...item, row, stage,
      rect: { x: x(item.start) + gap / 2, y: rows[row]!.cy - thickness / 2, width: Math.max(0, fullWidth - gap), height: thickness },
      interval: { x: x(item.start), y: plot.y, width: fullWidth, height: plot.height },
      startLabel: formatTimelineValue(item.start, timeline), endLabel: formatTimelineValue(item.end, timeline), durationLabel: formatDuration(item.duration) };
  });
  const connectorConfig = typeof props.connectors === 'object' ? props.connectors : undefined;
  const connectorsEnabled = typeof props.connectors === 'boolean' ? props.connectors : (connectorConfig?.enabled ?? true);
  const maxGap = connectorConfig?.maxGap !== undefined ? dimension(connectorConfig.maxGap, 'connectors.maxGap') : 2000;
  const connectorWidth = dimension(connectorConfig?.width ?? props.connectorWidth ?? 2, 'connectorWidth');
  const pairs: [number, number][] = [];
  if (connectorsEnabled && barGap === 0) bars.forEach((bar, i) => {
    const next = bars[i + 1];
    if (next && bar.row !== next.row) {
      const g = next.start - bar.end;
      const isContiguous = maxGap > 0 ? (g >= 0 && g <= maxGap) : (g === 0);
      if (isContiguous) pairs.push([i, i + 1]);
    }
  });
  const rects = bars.map(bar => bar.rect);
  const outline = pairs.length ? roundedUnionPath(connectBars(rects, pairs, connectorWidth), radius)
    : roundedBarsPath(rects, radius);
  const connectors: ConnectorLayout[] = pairs.flatMap(([from, to], index) => {
    const a = bars[from]!, b = bars[to]!;
    if (typeof a.stage.fill === 'object' || typeof b.stage.fill === 'object') return [];
    const half = Math.min(connectorWidth / 2, a.rect.width / 2, b.rect.width / 2);
    if (half <= 0) return [];
    const ext = Math.max(0, Math.min(radius, a.rect.width / 2 - half, b.rect.width / 2 - half));
    const joinX = (a.rect.x + a.rect.width + b.rect.x) / 2;
    const isADown = a.rect.y > b.rect.y;
    const topBar = isADown ? b : a;
    const bottomBar = isADown ? a : b;
    const topColor = typeof topBar.stage.fill === 'string' ? topBar.stage.fill : topBar.stage.color;
    const bottomColor = typeof bottomBar.stage.fill === 'string' ? bottomBar.stage.fill : bottomBar.stage.color;
    const y1 = topBar.rect.y;
    const y2 = bottomBar.rect.y + bottomBar.rect.height;
    const total = y2 - y1;
    const topBottom = topBar.rect.y + topBar.rect.height;
    const bottomTop = bottomBar.rect.y;
    const rect: Rect = {
      x: joinX - half - ext,
      y: y1,
      width: (half + ext) * 2,
      height: total,
    };
    const stops = total > 0 && bottomTop > topBottom ? [
      { offset: 0, color: topColor },
      { offset: Math.max(0, Math.min(1, (topBottom - y1) / total)), color: topColor },
      { offset: Math.max(0, Math.min(1, (bottomTop - y1) / total)), color: bottomColor },
      { offset: 1, color: bottomColor },
    ] : [
      { offset: 0, color: topColor },
      { offset: 1, color: bottomColor },
    ];
    return [{ index, rect, y1, y2, stops, feather: ext / rect.width }];
  });
  const labelBottom = props.yLabels !== false && rows.length ? rows.at(-1)!.labelY + yFontSize / 2 + 2.5 : 0;
  const xLabelY = plot.y + plot.height + 29 + xLabelOffset;
  const yLabelX = plot.x - 14 - yLabelOffset;
  const bottom = props.xLabels === false ? 16 : Math.max(16, 54 + xLabelOffset + Math.max(0, xFontSize - 11));
  return { bars, rows, plot, timeline, x, outline, connectors, xLabelY, yLabelX,
    ticks: buildTimelineTicks(timeline, plot.width, { labelStyle: { fontSize: props.xAxis?.labelStyle?.fontSize === undefined ? 12 : xFontSize } }),
    totalHeight: Math.max(plot.y + plot.height, labelBottom) + bottom };
}
