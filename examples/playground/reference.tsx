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
  radius: 'radius={0}', gap: 'gap={3}',
  plotPadding: 'plotPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}',
  outlineStyle: 'outlineStyle={{ stroke: \'none\' }}',
  onActiveChange: 'onActiveChange={context => console.log(context?.anchor)}',
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
    ['id', 'S', '阶段 ID，非空且唯一。'], ['label', 'string', '阶段标签。'], ['color', 'string', '基础颜色，fill 未设置时用于绘制。'], ['fill?', 'string | LinearGradient', '纯色，或下述渐变对象。'], ['fill.type', "'linear'", '渐变类型。'], ['fill.direction?', "'vertical'", '默认 vertical，渐变覆盖该阶段色块厚度，行间自动衔接边缘颜色。'], ['fill.stops', 'readonly GradientStop[]', '至少两个色标，offset 按升序排列。'], ['stop.offset', 'number', '0 到 1 之间的位置。'], ['stop.color', 'string', 'CSS 颜色。'], ['stop.opacity?', 'number', '0 到 1 之间的不透明度，默认 1。'],
  ], example: `const stages = [{\n  id: 'deep', label: 'Deep', color: '#005CC7',\n  fill: { type: 'linear', direction: 'vertical', stops: [\n    { offset: 0, color: '#005CC7' },\n    { offset: 1, color: '#94BDFF' },\n  ] },\n}];` },
  { name: 'TimeOptions', description: '显示默认使用 Asia/Shanghai；自定义解析函数返回 Unix 毫秒。', fields: [
    ['timestampUnit?', "'milliseconds' | 'seconds'", '只影响数字时间戳，默认 milliseconds。'], ['locale?', 'string', '日期格式地区，默认 en-GB。'], ['timeZone?', 'string', 'IANA 时区，默认 Asia/Shanghai。只影响显示与刻度取整。'], ['parse?', '(value: number | string) => number', '替代内置转换，所有时间输入都通过这个函数。'],
  ], example: `<Hypnogram data={data} time={{ timestampUnit: 'seconds', timeZone: 'Asia/Shanghai' }} />` },
  { name: 'TooltipOptions / TooltipContext', description: '内容和容器样式独立配置；返回 null 可以隐藏 tooltip。', fields: [
    ['placement?', "'top' | 'bottom'", '优先方向，默认 top，空间不足自动翻转。'],
    ['offset? / boundaryPadding?', 'number', '距色块 / 边界的距离（px），默认 12 / 8。'],
    ['boundary?', '() => HTMLElement | null', '外层卡片边界，默认根容器。'],
    ['hideDelay?', 'number', '触摸结束后的隐藏延迟，默认 1500 ms。'],
    ['persistOnSelect?', 'boolean', '选中后持续显示，默认 true；false 时点击也按延迟隐藏。'],
    ['context.anchor', 'Rect', '色块相对根容器的 CSS 像素边界；onActiveChange 同样提供。'],
    ['context.placement / arrowOffset', "'top' | 'bottom' / number", '最终方向和箭头在气泡内的水平位置；对应 data-placement 和 --hypnogram-arrow-x。'],
    ['render?', '(context: TooltipContext) => ReactNode', '默认显示阶段、时长和时间范围。'], ['style?', 'CSSProperties', '覆盖默认 tooltip 样式；定位由组件管理。'], ['className?', 'string', 'tooltip 容器的类名。'], ['context.segment', 'HypnogramSegment<S, M>', '原始数据对象，保留 metadata。'], ['context.stage', 'Stage<S>', '对应的阶段配置。'], ['context.start / end', 'number', '归一化后的 Unix 毫秒时间戳。'], ['context.duration', 'number', '区间持续时间，单位毫秒。'], ['context.startLabel / endLabel', 'string', '默认格式化的时间文本。'], ['context.durationLabel', 'string', '默认格式化的时长文本。'],
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
    ['id', 'S', 'Stage identifier, non-empty and unique.'], ['label', 'string', 'Display label for the stage.'], ['color', 'string', 'Base color used when fill is absent.'], ['fill?', 'string | LinearGradient', 'Solid color or linear gradient object.'], ['fill.type', "'linear'", 'Gradient type.'], ['fill.direction?', "'vertical'", 'Defaults to vertical, spans the bar thickness; gaps blend adjoining edge colors.'], ['fill.stops', 'readonly GradientStop[]', 'At least two stops, ordered by offset.'], ['stop.offset', 'number', 'Position between 0 and 1.'], ['stop.color', 'string', 'CSS color string.'], ['stop.opacity?', 'number', 'Opacity between 0 and 1, defaults to 1.'],
  ], example: `const stages = [{\n  id: 'deep', label: 'Deep', color: '#005CC7',\n  fill: { type: 'linear', direction: 'vertical', stops: [\n    { offset: 0, color: '#005CC7' },\n    { offset: 1, color: '#94BDFF' },\n  ] },\n}];` },
  { name: 'TimeOptions', description: 'Display defaults to Asia/Shanghai; custom parser returns Unix milliseconds.', fields: [
    ['timestampUnit?', "'milliseconds' | 'seconds'", 'Affects numeric timestamps only, defaults to milliseconds.'], ['locale?', 'string', 'Locale identifier for formatting, defaults to en-GB.'], ['timeZone?', 'string', 'IANA time zone, defaults to Asia/Shanghai.'], ['parse?', '(value: number | string) => number', 'Custom parser returning Unix milliseconds.'],
  ], example: `<Hypnogram data={data} time={{ timestampUnit: 'seconds', timeZone: 'Asia/Shanghai' }} />` },
  { name: 'TooltipOptions / TooltipContext', description: 'Content and container style configured independently; return null to hide.', fields: [
    ['placement?', "'top' | 'bottom'", 'Preferred side, defaults to top; flips when needed.'],
    ['offset? / boundaryPadding?', 'number', 'Bar offset / boundary inset in px, defaults to 12 / 8.'],
    ['boundary?', '() => HTMLElement | null', 'Surrounding card boundary, defaults to root.'],
    ['hideDelay?', 'number', 'Touch release delay, defaults to 1500 ms.'],
    ['persistOnSelect?', 'boolean', 'Persist on selection, default true; false also delays hiding after clicks.'],
    ['context.anchor', 'Rect', 'Bar bounds in root-relative CSS px; also provided by onActiveChange.'],
    ['context.placement / arrowOffset', "'top' | 'bottom' / number", 'Resolved side and arrow x; exposed as data-placement and --hypnogram-arrow-x.'],
    ['render?', '(context: TooltipContext) => ReactNode', 'Renders stage, duration, and time range by default.'], ['style?', 'CSSProperties', 'Overrides default tooltip container style.'], ['className?', 'string', 'CSS class for the tooltip container.'], ['context.segment', 'HypnogramSegment<S, M>', 'Original segment object with metadata.'], ['context.stage', 'Stage<S>', 'Stage definition for this segment.'], ['context.start / end', 'number', 'Normalized Unix milliseconds timestamps.'], ['context.duration', 'number', 'Interval duration in milliseconds.'], ['context.startLabel / endLabel', 'string', 'Default formatted time strings.'], ['context.durationLabel', 'string', 'Default formatted duration string.'],
  ], example: `<Hypnogram data={data} tooltip={{\n  render: ({ stage, durationLabel }) => <b>{stage.label} · {durationLabel}</b>,\n  style: { background: '#172b45', color: '#fff', borderRadius: 8 },\n}} />` },
  { name: 'InteractionOptions / HighlightStyle', description: 'Highlight switches affect visuals only without disabling callbacks.', fields: [
    ['hover?', 'boolean', 'Hover highlight, defaults to true.'], ['selection?', 'boolean', 'Selection highlight, defaults to true.'], ['hoverColor?', 'string', 'Hover column color, defaults to stage color.'], ['selectionColor?', 'string', 'Selection column color, defaults to stage color.'], ['hoverStyle?', 'HighlightStyle', 'Custom style overrides for hover column.'], ['selectionStyle?', 'HighlightStyle', 'Custom style overrides for selection column.'], ['fill / fillOpacity', 'SVG fill properties', 'Background fill and opacity.'], ['stroke / strokeWidth / strokeDasharray / strokeOpacity', 'SVG stroke properties', 'Border color, width, dashes, and opacity.'], ['opacity / rx / ry', 'SVG rect properties', 'Overall opacity, horizontal radius, vertical radius.'],
  ], example: `<Hypnogram data={data} interaction={{\n  hoverColor: '#1D81F512',\n  selectionColor: '#005CC726',\n  selectionStyle: { stroke: '#005CC7', strokeWidth: 1 },\n}} />` },
];

const layoutReferences = [
  { name: 'AxisLabelOptions', description: ['标签的位置与文字样式。', 'Label position and text styles.'], fields: [
    ['labelOffset?', 'number', '默认 0；负数移向图表，正数远离图表。', 'Default 0; negative moves inward, positive outward.'],
    ['style? / labelStyle?', 'CSSProperties', '合并文字样式，style 优先；支持 color、fill、fontSize、fontFamily 等。', 'Merged text styles, with style taking precedence; supports color, fill, fontSize, fontFamily, etc.'],
  ], example: `<Hypnogram data={data} xAxis={{ labelOffset: -10, style: { fontSize: 14 } }} />` },
  { name: 'ConnectorOptions', description: ['相邻时间区间之间的连接。', 'Connections between consecutive intervals.'], fields: [
    ['enabled?', 'boolean', '默认 true。', 'Default true.'],
    ['width?', 'number', '默认 2 px，优先于 connectorWidth。', 'Default 2 px; takes precedence over connectorWidth.'],
    ['maxGap?', 'number', '默认 2000 ms；0 只连接完全相接的区间。', 'Default 2000 ms; 0 connects only touching intervals.'],
    ['minStageDistance?', 'number', '默认 1；设为 2 时跳过相邻行的连接。', 'Default 1; 2 skips connections between neighboring rows.'],
  ], example: `<Hypnogram data={data} connectors={{ width: 2, maxGap: 0 }} />` },
  { name: 'GridOptions', description: ['阶段参考线。', 'Stage reference lines.'], fields: [
    ['enabled?', 'boolean', '默认 true。', 'Default true.'],
    ['position?', "'between' | 'center'", '默认 between，在行间绘制；center 穿过行中心。', 'Default between, at row boundaries; center crosses row centers.'],
    ['lineStyle?', "'dashed' | 'solid'", '默认 dashed。', 'Default dashed.'],
    ['stroke?', 'string', '默认 currentColor。', 'Default currentColor.'],
    ['strokeWidth?', 'number', '默认 1 px。', 'Default 1 px.'],
    ['opacity?', 'number', '默认 0.18。', 'Default 0.18.'],
    ['strokeDasharray?', 'string', "默认 '3 5'，仅虚线使用。", "Default '3 5', used for dashed lines."],
    ['includeEdges?', 'boolean', '默认 false；是否包含上下边缘。', 'Default false; include top and bottom edges.'],
  ], example: `<Hypnogram data={data} grid={{ position: 'center', lineStyle: 'solid' }} />` },
] as const;

export function ApiReference() {
  const { lang } = useI18n();
  const t = translations[lang].apiRef;
  const references = [...(lang === 'en' ? referencesEn : referencesZh), ...layoutReferences.map(item => ({
    ...item, description: item.description[lang === 'zh' ? 0 : 1],
    fields: item.fields.map(([name, type, zh, en]): Field => [name, type, lang === 'zh' ? zh : en]),
  }))];

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
    <h3 id="types">{t.typesTitle}</h3>
    {references.map(reference => <details className="type-reference" key={reference.name}><summary><code>{reference.name}</code></summary><div className="type-content"><p>{reference.description}</p><div className="table-scroll"><table><thead><tr><th>{t.thField}</th><th>{t.thType}</th><th>{t.thNote}</th></tr></thead><tbody>{reference.fields.map(([name, type, description]) => <tr key={name}><td><code>{name}</code></td><td><code>{type}</code></td><td>{description}</td></tr>)}</tbody></table></div><CodeBlock code={reference.example} /></div></details>)}
  </section>;
}
