import { useState } from 'react';
import * as React from 'react';
import { transform } from 'sucrase';
import { DEFAULT_STAGES, Hypnogram, normalizeTimeline } from '../../src';
import type { DefaultStage, HypnogramProps, HypnogramSegment, Stage, TooltipOptions } from '../../src';
import { translations, useI18n } from './i18n';
import { CodeBlock, Demo, Range, Toggle } from './ui';

const phases: DefaultStage[] = ['awake', 'light', 'deep', 'light', 'rem', 'light', 'deep', 'light', 'rem', 'light', 'awake'];
const durations = [18, 38, 78, 28, 42, 56, 68, 38, 52, 62, 14];
let cursor = Date.parse('2026-09-09T22:14:00+08:00');
export const sample: HypnogramSegment[] = phases.map((stage, i) => {
  const start = cursor; cursor += durations[i]! * 60000;
  return { id: `s${i + 1}`, stage, start, end: cursor };
});
const time = { timeZone: 'Asia/Shanghai' };
const importLine = "import { Hypnogram } from 'react-hypnogram';";
type DemoThemeProps = { dark?: boolean };
const optionsCode = (options: Omit<HypnogramProps, 'data'>) => `${importLine}\n\n<Hypnogram\n  data={data}\n  {...${JSON.stringify(options, null, 2)}}\n/>`;
const sampleCode = `const data = ${JSON.stringify(sample, null, 2)};`;
function Legend({ stages = DEFAULT_STAGES }: { stages?: readonly Stage<string>[] }) {
  return <div className="chart-legend">{stages.map(stage => <span key={stage.id}><i style={{ background: stage.color }} />{stage.label}</span>)}</div>;
}
export function BasicDemo({ dark = false }: DemoThemeProps) {
  const { lang } = useI18n();
  const t = translations[lang].basicDemo;
  return <Demo id="basic" title={t.title} description={t.description}
    code={`${importLine}\n\n<Hypnogram data={data} time={{ timeZone: 'Asia/Shanghai' }} />\n\n${sampleCode}`}
    footer={<><span>22:14 — 06:28</span><span>{t.footer}</span></>}>
    <Hypnogram data={sample} time={time} dark={dark} /><Legend />
  </Demo>;
}
export function AppearanceDemo({ dark = false }: DemoThemeProps) {
  const { lang } = useI18n();
  const t = translations[lang].appearanceDemo;
  const [radius, setRadius] = useState(12), [stageHeight, setStageHeight] = useState(40), [barThickness, setBarThickness] = useState(24), [connectorWidth, setConnectorWidth] = useState(2);
  const [connectors, setConnectors] = useState(true), [grid, setGrid] = useState(true), [gridSolid, setGridSolid] = useState(false), [gridCenter, setGridCenter] = useState(false);
  const [axes, setAxes] = useState(true), [xLabels, setXLabels] = useState(true), [yLabels, setYLabels] = useState(true);
  const gridOption = !grid ? false : (gridSolid || gridCenter) ? {
    ...(gridSolid ? { lineStyle: 'solid' as const } : {}),
    ...(gridCenter ? { position: 'center' as const } : {}),
  } : true;
  const options = { time, radius, stageHeight, barThickness, connectorWidth, connectors, grid: gridOption, axes, xLabels, yLabels };
  const previewOptions = { ...options, dark };
  return <Demo id="appearance" title={t.title} description={t.description} code={optionsCode(options)} controls={<>
    <div className="range-grid">
      <Range label={t.stageHeight} value={stageHeight} min={16} max={80} onChange={setStageHeight} />
      <Range label={t.barThickness} value={barThickness} min={4} max={80} onChange={setBarThickness} />
      <Range label={t.radius} value={radius} min={0} max={40} onChange={setRadius} />
      <Range label={t.connectorWidth} value={connectorWidth} min={1} max={12} onChange={setConnectorWidth} disabled={!connectors} />
    </div>
    <div className="toggle-row">
      <Toggle label={t.connectors} checked={connectors} onChange={setConnectors} />
      <Toggle label={t.grid} checked={grid} onChange={setGrid} />
      <Toggle label={t.gridSolid} checked={gridSolid} onChange={setGridSolid} disabled={!grid} />
      <Toggle label={t.gridCenter} checked={gridCenter} onChange={setGridCenter} disabled={!grid} />
      <Toggle label={t.axes} checked={axes} onChange={setAxes} />
      <Toggle label={t.xLabels} checked={xLabels} onChange={setXLabels} />
      <Toggle label={t.yLabels} checked={yLabels} onChange={setYLabels} />
    </div>
  </>}><Hypnogram data={sample} {...previewOptions} /></Demo>;
}
export function GradientsDemo({ dark = false }: DemoThemeProps) {
  const { lang } = useI18n();
  const t = translations[lang].gradientsDemo;
  const [enabled, setEnabled] = useState(true);
  const [colors, setColors] = useState(DEFAULT_STAGES.map(stage => stage.color));
  const [ends, setEnds] = useState(['#94BDFF', '#1D81F5', '#005CC7', '#D6E7FF']);
  const [directions, setDirections] = useState<Array<'horizontal' | 'vertical'>>(['vertical', 'vertical', 'vertical', 'vertical']);
  const stages: Stage[] = DEFAULT_STAGES.map((stage, i) => ({ ...stage, color: colors[i]!, ...(enabled ? { fill: { type: 'linear', direction: directions[i]!, stops: [{ offset: 0, color: colors[i]! }, { offset: 1, color: ends[i]! }] } as const } : {}) }));
  const options = { time, stages };
  return <Demo id="gradients" title={t.title} description={t.description} code={optionsCode(options)} controls={<>
    <div className="toggle-row"><Toggle label={t.gradientFill} checked={enabled} onChange={setEnabled} /></div>
    <div className="color-grid">{stages.map((stage, i) => <div className="color-row" key={stage.id}><span>{stage.label}</span><input aria-label={`${stage.label} ${t.startColor}`} type="color" value={colors[i]} onChange={e => setColors(colors.map((c, j) => i === j ? e.target.value : c))} />{enabled && <><span className="color-arrow">→</span><input aria-label={`${stage.label} ${t.endColor}`} type="color" value={ends[i]} onChange={e => setEnds(ends.map((c, j) => i === j ? e.target.value : c))} /><select aria-label={`${stage.label} ${t.direction}`} value={directions[i]} onChange={e => setDirections(directions.map((d, j) => i === j ? e.target.value as typeof d : d))}><option value="vertical">{t.vertical}</option><option value="horizontal">{t.horizontal}</option></select></>}</div>)}</div>
  </>}><Hypnogram data={sample} {...options} dark={dark} /><Legend stages={stages} /></Demo>;
}
const customTooltipStyle: React.CSSProperties = {
  minWidth: 80,
  padding: '6px 8px',
  borderRadius: 6,
  background: '#ffffff',
  color: '#111111',
  boxShadow: '0 3px 9px rgba(0, 0, 0, 0.08)',
};

const defaultRenderCode = `({ stage, startLabel, endLabel }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span
        style={{
          width: 6,
          height: 6,
          marginRight: 4,
          borderRadius: 1,
          backgroundColor: stage.color,
        }}
      />
      <span style={{ color: '#111111', fontSize: 13, lineHeight: '18px' }}>
        {stage.label}
      </span>
    </div>
    <div style={{ marginTop: 1, color: '#888888', fontSize: 12, lineHeight: '16px' }}>
      {startLabel} - {endLabel}
    </div>
  </div>
)`;

const defaultFallbackRender: NonNullable<TooltipOptions['render']> = ({ stage, startLabel, endLabel }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ width: 6, height: 6, marginRight: 4, borderRadius: 1, backgroundColor: stage.color }} />
      <span style={{ color: '#111111', fontSize: 13, lineHeight: '18px' }}>{stage.label}</span>
    </div>
    <div style={{ marginTop: 1, color: '#888888', fontSize: 12, lineHeight: '16px' }}>
      {startLabel} - {endLabel}
    </div>
  </div>
);

function compileRenderCode(codeStr: string, fallback: NonNullable<TooltipOptions['render']>): {
  render: NonNullable<TooltipOptions['render']>;
  error: string | null;
} {
  try {
    const trimmed = codeStr.trim();
    if (!trimmed) return { render: fallback, error: null };
    const fnCode = trimmed.startsWith('(') || trimmed.startsWith('function')
      ? trimmed
      : trimmed.startsWith('<')
      ? `({ stage, startLabel, endLabel }) => (${trimmed})`
      : `(${trimmed})`;
    const js = transform(`return (${fnCode});`, { transforms: ['jsx'], production: true }).code;
    const fn = new Function('React', js)(React);
    if (typeof fn !== 'function') {
      return { render: fallback, error: 'render 必须是一个返回 React 元素的函数' };
    }
    const safeRender: NonNullable<TooltipOptions['render']> = (ctx) => {
      try {
        const result = fn(ctx);
        return result ?? fallback(ctx);
      } catch {
        return fallback(ctx);
      }
    };
    return { render: safeRender, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.split('\n')[0] : '语法错误';
    return { render: fallback, error: msg ?? '语法错误' };
  }
}

export function InteractionDemo({ dark = false }: DemoThemeProps) {
  const { lang } = useI18n();
  const t = translations[lang].interactionDemo;
  const [tooltip, setTooltip] = useState(true), [custom, setCustom] = useState(true), [hover, setHover] = useState(true), [selection, setSelection] = useState(true);
  const [hoverColor, setHoverColor] = useState('#1D81F512'), [selectionColor, setSelectionColor] = useState('#005CC721');
  const [selected, setSelected] = useState<string | null>(null), [clicked, setClicked] = useState<string | null>(null);
  const [renderCode, setRenderCode] = useState(defaultRenderCode);
  const [activeRender, setActiveRender] = useState<NonNullable<TooltipOptions['render']>>(() => defaultFallbackRender);
  const [compileError, setCompileError] = useState<string | null>(null);

  const handleRenderCodeChange = (newCode: string) => {
    setRenderCode(newCode);
    const compiled = compileRenderCode(newCode, defaultFallbackRender);
    setCompileError(compiled.error);
    if (!compiled.error) {
      setActiveRender(() => compiled.render);
    }
  };

  const interaction = { hover, selection, hoverColor, selectionColor };
  const tooltipProps: TooltipOptions | false = !tooltip ? false : custom ? {
    style: customTooltipStyle,
    render: activeRender,
  } : {};
  const customTooltipSnippet = `tooltip={{
    style: ${JSON.stringify(customTooltipStyle, null, 2).replace(/\n/g, '\n    ')},
    render: ${renderCode.trim()},
  }}`;
  const code = `${importLine}\n\n<Hypnogram\n  data={data}\n  time={{ timeZone: 'Asia/Shanghai' }}\n  interaction={${JSON.stringify(interaction, null, 2)}}\n  ${!tooltip ? 'tooltip={false}' : custom ? customTooltipSnippet : 'tooltip={{}}'}\n  onSelect={segment => console.log('selected:', segment?.id ?? null)}\n  onSegmentClick={segment => console.log('clicked:', segment.id)}\n/>`;
  return <Demo id="interaction" title={t.title} description={t.description} code={code}
    footer={<><span><code>onSelect</code> {selected ?? '—'}</span><span><code>onSegmentClick</code> {clicked ?? '—'}</span></>}
    controls={<>
      <div className="toggle-row">
        <Toggle label={t.tooltip} checked={tooltip} onChange={setTooltip} />
        <Toggle label={t.customContent} checked={custom} onChange={setCustom} disabled={!tooltip} />
        <Toggle label={t.hoverHighlight} checked={hover} onChange={setHover} />
        <Toggle label={t.selectionHighlight} checked={selection} onChange={setSelection} />
        <label className="color-row"><span>{t.hoverColor}</span><input className="color-value" aria-label={t.hoverColor} type="text" value={hoverColor} disabled={!hover} onChange={e => setHoverColor(e.target.value)} spellCheck={false} /></label>
        <label className="color-row"><span>{t.selectionColor}</span><input className="color-value" aria-label={t.selectionColor} type="text" value={selectionColor} disabled={!selection} onChange={e => setSelectionColor(e.target.value)} spellCheck={false} /></label>
      </div>
      {tooltip && custom && (
        <div className="tooltip-code-editor">
          <textarea
            aria-label="Tooltip Render Code"
            value={renderCode}
            onChange={e => handleRenderCodeChange(e.target.value)}
            spellCheck={false}
            rows={16}
          />
          {compileError && <p role="alert" className="input-error" style={{ marginTop: 8 }}>{compileError}</p>}
        </div>
      )}
    </>}>
    <Hypnogram data={sample} time={time} dark={dark} interaction={interaction} tooltip={tooltipProps} onSelect={s => setSelected(s?.id ?? null)} onSegmentClick={s => setClicked(s.id)} />
  </Demo>;
}
export function DataDemo({ dark = false }: DemoThemeProps) {
  const { lang } = useI18n();
  const t = translations[lang].dataDemo;
  const [data, setData] = useState<readonly HypnogramSegment<string>[]>(sample);
  const [input, setInput] = useState(JSON.stringify(sample, null, 2)), [error, setError] = useState(''), [format, setFormat] = useState('timestamp');
  const extra = [...new Set(data.map(s => s.stage))].filter(id => !DEFAULT_STAGES.some(s => s.id === id));
  const stages: Stage<string>[] = [...DEFAULT_STAGES, ...extra.map((id, i) => ({ id, label: id, color: ['#8b5cf6', '#f59e0b', '#10b981', '#e879f9'][i % 4]! }))];
  function changeFormat(value: string) {
    const next = sample.map(item => ({ ...item, start: value === 'iso' ? new Date(item.start).toISOString() : item.start, end: value === 'iso' ? new Date(item.end).toISOString() : item.end }));
    setFormat(value); setData(next); setInput(JSON.stringify(next, null, 2)); setError('');
  }
  const code = `${importLine}\n\nconst data = ${JSON.stringify(data, null, 2)};\nconst stages = ${JSON.stringify(stages, null, 2)};\n\n<Hypnogram data={data} stages={stages} time={{ timeZone: 'Asia/Shanghai' }} />`;
  return <Demo id="data-lab" title={t.title} description={t.description} code={code} controls={<>
    <details className="data-editor"><summary>{t.editData} <span>{t.intervals(data.length)}</span></summary><div className="editor-top"><label>{t.formatLabel} <select aria-label={t.formatLabel} value={format} onChange={e => changeFormat(e.target.value)}><option value="timestamp">{t.timestamp}</option><option value="iso">{t.iso}</option></select></label></div><textarea aria-label="JSON" value={input} onChange={e => setInput(e.target.value)} spellCheck={false} /><div className="editor-bottom"><span>{t.limitHint}</span><button className="primary-button" onClick={() => {
      try {
        const value: unknown = JSON.parse(input);
        if (!Array.isArray(value) || value.length > 200) throw new Error(t.errorMax);
        if (value.some(s => !s || typeof s.id !== 'string' || typeof s.stage !== 'string' || !s.stage.trim())) throw new Error(t.errorEmpty);
        normalizeTimeline(value, time); setData(value); setError('');
      } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    }}>{t.apply}</button></div>{error && <p role="alert" className="input-error">{error}</p>}</details>
  </>}><Hypnogram data={data} stages={stages} time={time} dark={dark} /></Demo>;
}
export function Usage() {
  return <div className="quickstart"><CodeBlock code={`${importLine}\n\n<Hypnogram data={data} time={{ timeZone: 'Asia/Shanghai' }} />`} /></div>;
}
