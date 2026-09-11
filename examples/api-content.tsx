import { Hypnogram } from '../src';
import type { HypnogramSegment, TooltipOptions } from '../src';

const tooltip: TooltipOptions = {
  render: ({ stage, durationLabel, startLabel, endLabel }) => (
    <div>
      <strong style={{ color: stage.color }}>{stage.label}</strong>
      <p>{durationLabel}</p>
      <small>{startLabel} — {endLabel}</small>
    </div>
  ),
  style: { background: '#0f172a', color: '#fff', padding: 12 },
};
export function CustomTooltipExample({ data }: { data: readonly HypnogramSegment[] }) {
  return <Hypnogram data={data} tooltip={tooltip} onSegmentClick={segment => console.log(segment.id)} />;
}
