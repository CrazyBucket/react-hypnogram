import type { CSSProperties, ReactNode, SVGProps } from 'react';

export type DefaultStage = 'awake' | 'rem' | 'light' | 'deep';
/** Unix timestamps (milliseconds by default) or ISO date/time strings. */
export type TimeValue = number | string;
export interface TimeOptions {
  timestampUnit?: 'seconds' | 'milliseconds';
  locale?: string;
  timeZone?: string;
  /** Application-owned parser; return epoch milliseconds. */
  parse?: (value: TimeValue) => number;
}
export interface TimeFormatContext {
  domain: readonly [number, number];
  locale: string;
  timeZone: string;
}
/** Map external schemas to this interval contract in application code. */
export interface HypnogramSegment<S extends string = DefaultStage, M = unknown> {
  readonly id: string;
  readonly stage: S;
  readonly start: TimeValue;
  readonly end: TimeValue;
  readonly metadata?: M;
}
export interface GradientStop {
  /** A fraction in [0, 1], in ascending order. */
  offset: number;
  color: string;
  opacity?: number;
}
export type Paint = string | {
  type: 'linear';
  direction?: 'vertical';
  /** At least two stops. Coordinates span the stage's bar thickness. */
  stops: readonly GradientStop[];
};
export interface Stage<S extends string = DefaultStage> {
  id: S;
  label: string;
  color: string;
  /** Defaults to color; each stage owns its gradient. */
  fill?: Paint;
}
export interface Rect { x: number; y: number; width: number; height: number }
export interface ActiveContext<S extends string = DefaultStage, M = unknown> {
  segment: HypnogramSegment<S, M>;
  stage: Stage<S>;
  /** Normalized Unix milliseconds; original data remains in segment. */
  start: number;
  end: number;
  duration: number;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  /** Bar bounds in CSS px relative to the component's root. */
  anchor: Rect;
}
export interface TooltipContext<S extends string = DefaultStage, M = unknown> extends ActiveContext<S, M> {
  placement: 'top' | 'bottom';
  /** Horizontal arrow position inside the tooltip, in CSS px. */
  arrowOffset: number;
}
export interface TooltipOptions<S extends string = DefaultStage, M = unknown> {
  /** HTML content. Return null to hide the tooltip. */
  render?: (context: TooltipContext<S, M>) => ReactNode;
  style?: CSSProperties;
  className?: string;
  placement?: 'top' | 'bottom';
  offset?: number;
  /** Edge clearance in px. */
  boundaryPadding?: number;
  /** Optional surrounding card; defaults to the component root. */
  boundary?: () => HTMLElement | null;
  /** Touch release delay in ms. */
  hideDelay?: number;
  /** Keep the tooltip on the selected interval. Default true. */
  persistOnSelect?: boolean;
}
/** Visual properties only; the component owns region geometry and events. */
export type HighlightStyle = Pick<SVGProps<SVGRectElement>,
  'fill' | 'fillOpacity' | 'stroke' | 'strokeWidth' | 'strokeDasharray' | 'strokeOpacity' | 'opacity' | 'rx' | 'ry'>;
export interface InteractionOptions {
  /** Controls the hover highlight, independently of tooltip activation. */
  hover?: boolean;
  /** Controls the selection highlight, independently of selection state. */
  selection?: boolean;
  /** Hover band color, rendered as-is; defaults to the hovered segment's stage color at 7% opacity. */
  hoverColor?: string;
  /** Selection band color, rendered as-is; defaults to the selected segment's stage color at 13% opacity. */
  selectionColor?: string;
  hoverStyle?: HighlightStyle;
  selectionStyle?: HighlightStyle;
}
/** Options for the exported buildTimelineTicks helper. */
export interface XAxisOptions {
  ticks?: readonly TimeValue[];
  referenceInterval?: number;
  snapTo?: number;
  maxMiddleTicks?: number;
  minLabelGap?: number;
  formatLabel?: (value: number, context: TimeFormatContext) => string;
  labelStyle?: { fontSize?: number };
}

export interface AxisLabelOptions {
  labelOffset?: number;
  labelStyle?: CSSProperties;
  style?: CSSProperties;
}

export interface ConnectorOptions {
  enabled?: boolean;
  width?: number;
  maxGap?: number;
  /** Minimum distance between stage row indices. Default 1. */
  minStageDistance?: number;
}

export interface GridOptions {
  enabled?: boolean;
  position?: 'between' | 'center';
  lineStyle?: 'dashed' | 'solid';
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeDasharray?: string;
  includeEdges?: boolean;
}

export interface HypnogramBaseProps<S extends string = DefaultStage, M = unknown> {
  data: readonly HypnogramSegment<S, M>[];
  time?: TimeOptions;
  width?: number | string;
  radius?: number;
  stageHeight?: number;
  barThickness?: number;
  gap?: number;
  connectors?: boolean | ConnectorOptions;
  connectorWidth?: number;
  grid?: boolean | GridOptions;
  /** Override automatic plot margins, in px. */
  plotPadding?: { top?: number; right?: number; bottom?: number; left?: number };
  outlineStyle?: CSSProperties;
  axes?: boolean;
  /** Bottom strip for time labels; hiding them reclaims the space. */
  xLabels?: boolean;
  /** Left gutter for stage labels; hiding them reclaims the space. */
  yLabels?: boolean;
  xAxis?: AxisLabelOptions;
  yAxis?: AxisLabelOptions;
  /** Light foreground and outline; does not set a background. */
  dark?: boolean;
  tooltip?: false | TooltipOptions<S, M>;
  interaction?: InteractionOptions;
  onSelect?: (segment: HypnogramSegment<S, M> | null) => void;
  onSegmentClick?: (segment: HypnogramSegment<S, M>) => void;
  /** Active interval and anchor, including when the built-in tooltip is disabled. */
  onActiveChange?: (context: ActiveContext<S, M> | null) => void;
  /** Root HTML div; transparent background, no required stylesheet. */
  style?: CSSProperties;
  className?: string;
  id?: string;
  ariaLabel?: string;
}
/** A custom stage vocabulary requires its ordered row definitions. */
export type HypnogramProps<S extends string = DefaultStage, M = unknown> =
  HypnogramBaseProps<S, M> & ([S] extends [DefaultStage]
    ? { stages?: readonly Stage<S>[] }
    : { stages: readonly Stage<S>[] });
