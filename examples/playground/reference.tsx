import { Fragment } from 'react';
import type { HypnogramProps } from '../../src';
import api from '../../docs/api.md?raw';
import { propDescriptionsEn, translations, useI18n } from './i18n';
import { CodeBlock } from './ui';

const rows = api.split('## Props\n')[1]!.split('\n###')[0]!.split('\n').filter(line => line.startsWith('|')).slice(2).map(line =>
  line.slice(1, -1).split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|')),
);

const usage = {
  data: 'data={data}', stages: 'stages={stages}', time: "time={{ timeZone: 'Asia/Shanghai' }}", width: 'width={640}',
  stageHeight: 'stageHeight={40}', barThickness: 'barThickness={24}',
  radius: 'radius={0}', barHeight: 'barHeight={32}', rowGap: 'rowGap={8}', gap: 'gap={3}',
  connectors: 'connectors={false}', connectorWidth: 'connectorWidth={4}', grid: 'grid={false}', axes: 'axes={false}', xLabels: 'xLabels={false}', yLabels: 'yLabels={false}', dark: 'dark',
  tooltip: 'tooltip={{ render: ctx => ctx.durationLabel }}', interaction: 'interaction={{ hover: false }}',
  xAxis: "xAxis={{ labelOffset: -20, labelStyle: { fill: '#999', fontSize: 12 } }}",
  yAxis: "yAxis={{ labelOffset: -6, labelStyle: { fontWeight: 500 } }}",
  onSelect: 'onSelect={segment => setSelected(segment)}', onSegmentClick: 'onSegmentClick={segment => console.log(segment.id)}',
  style: "style={{ background: '#f8fafc' }}", className: 'className="sleep-chart"', id: 'id="sleep-chart"', ariaLabel: 'ariaLabel="睡眠阶段"',
} satisfies Record<keyof HypnogramProps, string>;

function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>)}</>;
}

type Field = readonly [name: string, type: string, description: string];

const referencesZh: { name: string; description: string; fields: readonly Field[]; example: string }[] = [
  { name: 'HypnogramSegment<S, M>', description: '区间数据。业务对象可以保留在 metadata 中。', fields: [
    ['id', 'string', '必需，非空且唯一。'], ['stage', 'S', '必需，与 stages 中的 id 对应。'], ['start', 'number | string', '必需，开始时间。数字默认 Unix 毫秒。'], ['end', 'number | string', '必需，结束时间，必须大于 start。'], ['metadata?', 'M', '可选，原样传给回调，不参与绘制。'],
  ], example: `const data = [\n  { id: 'a', stage: 'light', start: '2026-09-09T23:30:00+08:00', end: '2026-09-10T01:00:00+08:00' },\n];` },
  { name: 'Stage<S> / Paint', description: '数组顺序决定纵轴顺序。fill 优先于 color。', fields: [
    ['id', 'S', '阶段 ID，非空且唯一。'], ['label', 'string', '阶段标签。'], ['color', 'string', '基础颜色，fill 未设置时用于绘制。'], ['fill?', 'string | LinearGradient', '纯色，或下述渐变对象。'], ['fill.type', "'linear'", '渐变类型。'], ['fill.direction?', "'vertical' | 'horizontal'", '默认 vertical，渐变覆盖该阶段整行。'], ['fill.stops', 'readonly GradientStop[]', '至少两个色标，offset 按升序排列。'], ['stop.offset', 'number', '0 到 1 之间的位置。'], ['stop.color', 'string', 'CSS 颜色。'], ['stop.opacity?', 'number', '0 到 1 之间的不透明度，默认 1。'],
  ], example: `const stages = [{\n  id: 'deep', label: 'Deep', color: '#005CC7',\n  fill: { type: 'linear', direction: 'vertical', stops: [\n    { offset: 0, color: '#005CC7' },\n    { offset: 1, color: '#94BDFF' },\n  ] },\n}];` },
  { name: 'TimeOptions', description: '显示默认使用 UTC；自定义解析函数返回 Unix 毫秒。', fields: [
    ['timestampUnit?', "'milliseconds' | 'seconds'", '只影响数字时间戳，默认 milliseconds。'], ['locale?', 'string', '日期格式地区，默认 en-GB。'], ['timeZone?', 'string', 'IANA 时区，默认 UTC。只影响显示与刻度取整。'], ['parse?', '(value: number | string) => number', '替代内置转换，所有时间输入都通过这个函数。'],
  ], example: `<Hypnogram data={data} time={{ timestampUnit: 'seconds', timeZone: 'Asia/Shanghai' }} />` },
  { name: 'TooltipOptions / TooltipContext', description: '内容和容器样式独立配置；返回 null 可以隐藏 tooltip。', fields: [
    ['render?', '(context: TooltipContext) => ReactNode', '默认显示阶段、时长和时间范围。'], ['style?', 'CSSProperties', '覆盖默认 tooltip 样式和定位。'], ['className?', 'string', 'tooltip 容器的类名。'], ['context.segment', 'HypnogramSegment<S, M>', '原始数据对象，保留 metadata。'], ['context.stage', 'Stage<S>', '对应的阶段配置。'], ['context.start / end', 'number', '归一化后的 Unix 毫秒时间戳。'], ['context.duration', 'number', '区间持续时间，单位毫秒。'], ['context.startLabel / endLabel', 'string', '默认格式化的时间文本。'], ['context.durationLabel', 'string', '默认格式化的时长文本。'],
  ], example: `<Hypnogram data={data} tooltip={{\n  render: ({ stage, durationLabel }) => <b>{stage.label} · {durationLabel}</b>,\n  style: { background: '#172b45', color: '#fff', borderRadius: 8 },\n}} />` },
  { name: 'InteractionOptions / HighlightStyle', description: '高亮开关只影响视觉效果，不关闭 tooltip 或选中回调。', fields: [
    ['hover?', 'boolean', '悬停高亮，默认 true。'], ['selection?', 'boolean', '选中高亮，默认 true。'], ['hoverColor?', 'string', '悬停区间背景色，默认跟随阶段颜色。'], ['selectionColor?', 'string', '选中区间背景色，默认跟随阶段颜色。'], ['hoverStyle?', 'HighlightStyle', '覆盖悬停区间背景样式。'], ['selectionStyle?', 'HighlightStyle', '覆盖选中区间背景样式。'], ['fill / fillOpacity', 'SVG fill properties', '背景填充和填充透明度。'], ['stroke / strokeWidth / strokeDasharray / strokeOpacity', 'SVG stroke properties', '边框颜色、宽度、虚线和透明度。'], ['opacity / rx / ry', 'SVG rect properties', '整体透明度、水平圆角、垂直圆角。'],
  ], example: `<Hypnogram data={data} interaction={{\n  hoverColor: '#1D81F512',     // 8 位 hex，颜色自带透明度\n  selectionColor: '#005CC726',\n  selectionStyle: { stroke: '#005CC7', strokeWidth: 1 },\n}} />` },
];

const referencesEn: { name: string; description: string; fields: readonly Field[]; example: string }[] = [
  { name: 'HypnogramSegment<S, M>', description: 'Interval data item. Custom objects can be stored in metadata.', fields: [
    ['id', 'string', 'Required, non-empty and unique identifier.'], ['stage', 'S', 'Required, matches an id in stages.'], ['start', 'number | string', 'Required start time. Numbers default to Unix ms.'], ['end', 'number | string', 'Required end time, must be greater than start.'], ['metadata?', 'M', 'Optional, passed to callbacks as-is.'],
  ], example: `const data = [\n  { id: 'a', stage: 'light', start: '2026-09-09T23:30:00+08:00', end: '2026-09-10T01:00:00+08:00' },\n];` },
  { name: 'Stage<S> / Paint', description: 'Array order dictates vertical order. fill takes priority over color.', fields: [
    ['id', 'S', 'Stage identifier, non-empty and unique.'], ['label', 'string', 'Display label for the stage.'], ['color', 'string', 'Base color used when fill is absent.'], ['fill?', 'string | LinearGradient', 'Solid color or linear gradient object.'], ['fill.type', "'linear'", 'Gradient type.'], ['fill.direction?', "'vertical' | 'horizontal'", 'Defaults to vertical, spans the stage row.'], ['fill.stops', 'readonly GradientStop[]', 'At least two stops, ordered by offset.'], ['stop.offset', 'number', 'Position between 0 and 1.'], ['stop.color', 'string', 'CSS color string.'], ['stop.opacity?', 'number', 'Opacity between 0 and 1, defaults to 1.'],
  ], example: `const stages = [{\n  id: 'deep', label: 'Deep', color: '#005CC7',\n  fill: { type: 'linear', direction: 'vertical', stops: [\n    { offset: 0, color: '#005CC7' },\n    { offset: 1, color: '#94BDFF' },\n  ] },\n}];` },
  { name: 'TimeOptions', description: 'Display defaults to UTC; custom parser returns Unix milliseconds.', fields: [
    ['timestampUnit?', "'milliseconds' | 'seconds'", 'Affects numeric timestamps only, defaults to milliseconds.'], ['locale?', 'string', 'Locale identifier for formatting, defaults to en-GB.'], ['timeZone?', 'string', 'IANA time zone, defaults to UTC.'], ['parse?', '(value: number | string) => number', 'Custom parser returning Unix milliseconds.'],
  ], example: `<Hypnogram data={data} time={{ timestampUnit: 'seconds', timeZone: 'Asia/Shanghai' }} />` },
  { name: 'TooltipOptions / TooltipContext', description: 'Content and container style configured independently; return null to hide.', fields: [
    ['render?', '(context: TooltipContext) => ReactNode', 'Renders stage, duration, and time range by default.'], ['style?', 'CSSProperties', 'Overrides default tooltip container style.'], ['className?', 'string', 'CSS class for the tooltip container.'], ['context.segment', 'HypnogramSegment<S, M>', 'Original segment object with metadata.'], ['context.stage', 'Stage<S>', 'Stage definition for this segment.'], ['context.start / end', 'number', 'Normalized Unix milliseconds timestamps.'], ['context.duration', 'number', 'Interval duration in milliseconds.'], ['context.startLabel / endLabel', 'string', 'Default formatted time strings.'], ['context.durationLabel', 'string', 'Default formatted duration string.'],
  ], example: `<Hypnogram data={data} tooltip={{\n  render: ({ stage, durationLabel }) => <b>{stage.label} · {durationLabel}</b>,\n  style: { background: '#172b45', color: '#fff', borderRadius: 8 },\n}} />` },
  { name: 'InteractionOptions / HighlightStyle', description: 'Highlight switches affect visuals only without disabling callbacks.', fields: [
    ['hover?', 'boolean', 'Hover highlight, defaults to true.'], ['selection?', 'boolean', 'Selection highlight, defaults to true.'], ['hoverColor?', 'string', 'Hover column color, defaults to stage color.'], ['selectionColor?', 'string', 'Selection column color, defaults to stage color.'], ['hoverStyle?', 'HighlightStyle', 'Custom style overrides for hover column.'], ['selectionStyle?', 'HighlightStyle', 'Custom style overrides for selection column.'], ['fill / fillOpacity', 'SVG fill properties', 'Background fill and opacity.'], ['stroke / strokeWidth / strokeDasharray / strokeOpacity', 'SVG stroke properties', 'Border color, width, dashes, and opacity.'], ['opacity / rx / ry', 'SVG rect properties', 'Overall opacity, horizontal radius, vertical radius.'],
  ], example: `<Hypnogram data={data} interaction={{\n  hoverColor: '#1D81F512',\n  selectionColor: '#005CC726',\n  selectionStyle: { stroke: '#005CC7', strokeWidth: 1 },\n}} />` },
];

export function ApiReference() {
  const { lang } = useI18n();
  const t = translations[lang].apiRef;
  const references = lang === 'en' ? referencesEn : referencesZh;

  return <section className="doc-section" id="api">
    <div className="section-heading"><h2>{t.title}</h2><p>{t.desc}</p></div>
    <div className="table-scroll"><table className="props-table"><thead><tr><th>{t.thProp}</th><th>{t.thDefault}</th><th>{t.thDesc}</th></tr></thead><tbody>{rows.map(row => {
      const name = row[0]!.replace(/`/g, '') as keyof HypnogramProps;
      const descText = lang === 'en' && propDescriptionsEn[name] ? propDescriptionsEn[name].desc : row[3]!;
      return <tr key={name} id={`prop-${name}`}>
        <td><a href={`#prop-${name}`}><code className="prop-name">{name}</code></a><div className="prop-type"><Inline text={row[1]!} /></div></td>
        <td><Inline text={row[2]!} /></td>
        <td><Inline text={descText} /><div className="prop-usage"><code>{usage[name]}</code></div></td>
      </tr>;
    })}</tbody></table></div>
    <div className="reference-notes"><p>{t.note1}</p><p>{t.note2}</p></div>
    <h3 id="types">{t.typesTitle}</h3>
    {references.map(reference => <details className="type-reference" key={reference.name}><summary><code>{reference.name}</code></summary><div className="type-content"><p>{reference.description}</p><div className="table-scroll"><table><thead><tr><th>{t.thField}</th><th>{t.thType}</th><th>{t.thNote}</th></tr></thead><tbody>{reference.fields.map(([name, type, description]) => <tr key={name}><td><code>{name}</code></td><td><code>{type}</code></td><td>{description}</td></tr>)}</tbody></table></div><CodeBlock code={reference.example} /></div></details>)}
    <details className="type-reference"><summary>{t.layoutTitle}</summary><div className="type-content"><p>{t.layoutP1}</p><p>{t.layoutP2}</p><p>{t.layoutP3}</p></div></details>
  </section>;
}
