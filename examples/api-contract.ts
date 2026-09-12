import type { HypnogramProps, HypnogramSegment, Stage } from '../src';

const data = [
  { id: 'a', stage: 'light', start: '2026-09-09T23:30:00+08:00', end: '2026-09-10T01:00:00+08:00' },
  { id: 'b', stage: 'deep', start: '2026-09-10T01:00:00+08:00', end: '2026-09-10T02:10:00+08:00' },
] as const satisfies readonly HypnogramSegment[];

export const minimal = { data } satisfies HypnogramProps;
export const customized = {
  data, time: { timeZone: 'Asia/Shanghai' },
  radius: 8, stageHeight: 48, barThickness: 32, connectorWidth: 3,
  interaction: { hoverStyle: { fill: '#1D81F5', opacity: 0.22 }, selectionStyle: { stroke: '#1D81F5', strokeWidth: 1 } },
  tooltip: { render: ({ stage, durationLabel }) => `${stage.label} · ${durationLabel}`, style: { borderRadius: 4 } },
  onSelect: segment => console.log(segment?.id),
  onSegmentClick: segment => console.log(segment.id),
  style: { background: '#fafafa', fontFamily: 'system-ui' },
} satisfies HypnogramProps;

type ResearchStage = 'wake' | 'n1' | 'n2' | 'n3' | 'rem';
const stages: readonly Stage<ResearchStage>[] = [
  { id: 'wake', label: 'Wake', color: '#f43f5e' },
  { id: 'rem', label: 'REM', color: '#2dd4bf' },
  { id: 'n1', label: 'N1', color: '#38bdf8' },
  { id: 'n2', label: 'N2', color: '#3b82f6' },
  { id: 'n3', label: 'N3', color: '#8b5cf6', fill: { type: 'linear', stops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#c4b5fd' }] } },
];
export const customStages = {
  stages,
  data: [{ id: 'epoch-1', start: '2026-09-09T23:00:00Z', end: '2026-09-09T23:00:30Z', stage: 'n1', metadata: { confidence: 0.95 } }],
  tooltip: { render: ({ segment }) => `Confidence: ${segment.metadata?.confidence}` },
} satisfies HypnogramProps<ResearchStage, { confidence: number }>;

export const unixSeconds = {
  data: [{ id: 'unix', stage: 'deep', start: 1788984000, end: 1788987600 }],
  time: { timestampUnit: 'seconds' },
} satisfies HypnogramProps;

// @ts-expect-error data is required.
export const missingData: HypnogramProps = {};
// @ts-expect-error custom stage identifiers require row definitions.
export const missingStages: HypnogramProps<ResearchStage> = { data: [] };
// @ts-expect-error unsupported default stage identifiers are rejected.
export const unknownStage: HypnogramSegment = { id: 'x', stage: 'n2', start: 0, end: 1 };
// @ts-expect-error keyboard navigation is not a component option.
export const keyboardOption: HypnogramProps = { data, interaction: { keyboard: true } };
// @ts-expect-error the unimplemented selection API from the old draft is not public.
export const controlledSelection: HypnogramProps = { data, selection: { value: 'a' } };

// @ts-expect-error removed aliases must not re-enter the public API.
export const removedBarHeight: HypnogramProps = { data, barHeight: 24 };
// @ts-expect-error use stageHeight and barThickness to control vertical spacing.
export const removedRowGap: HypnogramProps = { data, rowGap: 0 };
