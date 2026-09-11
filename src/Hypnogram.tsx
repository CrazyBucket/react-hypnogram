'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { DefaultStage, HypnogramProps } from './types';
import { buildLayout, dimension } from './internal/layout';
import { createPaintRegistry } from './internal/paint';

let fallbackInstanceId = 0;

function resolveTextStyle(options?: { style?: React.CSSProperties; labelStyle?: React.CSSProperties }): React.CSSProperties | undefined {
  if (!options) return undefined;
  const merged = { ...options.labelStyle, ...options.style };
  if (!Object.keys(merged).length) return undefined;
  const fill = merged.fill ?? merged.color;
  return fill ? { fill, ...merged } : merged;
}

/** Public version of the playground renderer. No stylesheet is required. */
export function Hypnogram<S extends string = DefaultStage, M = unknown>(props: HypnogramProps<S, M>): React.ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(720);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gesture = useRef<{ x: number; y: number; moved: boolean; pointerId: number } | null>(null);
  const suppressClick = useRef(false);
  const width = typeof props.width === 'number' && props.style?.width === undefined ? dimension(props.width, 'width', 1) : measuredWidth;
  const layout = useMemo(() => buildLayout(props, width), [props, width]);
  const { bars, rows, plot, timeline, totalHeight, x, outline, connectors } = layout;
  const selected = bars.find(bar => bar.segment.id === selectedId);
  const shown = bars.find(bar => bar.segment.id === (activeId ?? selectedId));
  const tip = props.tooltip === false ? null : props.tooltip ?? {};
  const maybeUseId = (React as unknown as { useId?: () => string }).useId;
  const autoId = useMemo(() => `h${++fallbackInstanceId}`, []);
  const rawId = typeof maybeUseId === 'function' ? maybeUseId() : autoId;
  const prefix = `hypnogram-${rawId.replace(/[^a-zA-Z0-9_-]/g, c => c.charCodeAt(0).toString(16))}`;
  const paint = createPaintRegistry(prefix);
  const foreground = props.dark ? '#dde5e9' : '#526473';
  const gridConfig = typeof props.grid === 'object' ? props.grid : undefined;
  const gridEnabled = typeof props.grid === 'boolean' ? props.grid : (gridConfig?.enabled ?? true);
  const gridLines = useMemo(() => {
    if (!gridEnabled || !rows.length) return [];
    if (gridConfig?.position === 'center') return rows.map(r => r.cy);
    const count = rows.length;
    const startIdx = gridConfig?.includeEdges ? 0 : 1;
    const endIdx = gridConfig?.includeEdges ? count : count - 1;
    const lines: number[] = [];
    for (let i = startIdx; i <= endIdx; i++) lines.push(plot.y + i * (plot.height / count));
    return lines;
  }, [gridEnabled, gridConfig?.position, gridConfig?.includeEdges, rows, plot.y, plot.height]);
  function clearTimer() { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } }
  function clearSelection() {
    if (selectedId !== null) { setSelectedId(null); props.onSelect?.(null); }
  }
  function dismiss() { clearTimer(); setActiveId(null); clearSelection(); }
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; });
  useEffect(() => {
    if (!host.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setMeasuredWidth(next);
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const outside = (event: globalThis.PointerEvent) => {
      if (!host.current?.contains(event.target as Node)) dismissRef.current();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismissRef.current(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); clearTimer(); };
  }, []);
  useEffect(() => {
    if (activeId && !bars.some(bar => bar.segment.id === activeId)) setActiveId(null);
    if (selectedId && !bars.some(bar => bar.segment.id === selectedId)) clearSelection();
  });
  function pick(clientX: number, clientY: number) {
    const bounds = svg.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return undefined;
    const px = (clientX - bounds.left) / bounds.width * width;
    const py = (clientY - bounds.top) / bounds.height * totalHeight;
    if (py < plot.y || py > plot.y + plot.height) return undefined;
    return bars.find((bar, i) => px >= x(bar.start) && (px < x(bar.end) || (i === bars.length - 1 && px <= x(bar.end))));
  }
  function choose(id: string) {
    const bar = bars.find(item => item.segment.id === id);
    if (!bar) return;
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    props.onSelect?.(next ? bar.segment : null);
    props.onSegmentClick?.(bar.segment);
  }
  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    clearTimer(); suppressClick.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    if (event.pointerType === 'touch') {
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveId(pick(event.clientX, event.clientY)?.segment.id ?? null);
    }
  }
  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current;
    if (current && Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) current.moved = true;
    if (event.pointerType !== 'touch' || current) setActiveId(pick(event.clientX, event.clientY)?.segment.id ?? null);
  }
  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const moved = gesture.current.moved;
    gesture.current = null; suppressClick.current = moved;
    if (event.pointerType === 'touch') {
      if (!moved) { const bar = pick(event.clientX, event.clientY); if (bar) choose(bar.segment.id); }
      suppressClick.current = true;
      clearTimer(); timer.current = setTimeout(() => setActiveId(null), 1500);
    }
  }
  const tipContent = shown && tip ? tip.render ? tip.render(shown) : <>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}><strong>{shown.stage.label}</strong><span>{shown.durationLabel}</span></div>
    <div style={{ marginTop: 6 }}>{shown.startLabel} → {shown.endLabel}</div>
  </> : null;
  return <div ref={host} id={props.id} className={props.className} style={{ position: 'relative', width: props.width ?? '100%', minWidth: 0, color: foreground, ...props.style }}>
    <svg ref={svg} width="100%" height={totalHeight} viewBox={`0 0 ${width} ${totalHeight}`} role="group" aria-label={props.ariaLabel ?? 'Sleep stages over time'}
      style={{ display: 'block', touchAction: 'pan-y' }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={() => { gesture.current = null; suppressClick.current = true; setActiveId(null); }}
      onPointerLeave={() => { if (!gesture.current) setActiveId(null); }}>
      <g pointerEvents="none">
        {gridEnabled && gridLines.map((y, i) => <line key={i} x1={plot.x} x2={plot.x + plot.width} y1={y} y2={y} stroke={gridConfig?.stroke ?? 'currentColor'} strokeWidth={gridConfig?.strokeWidth ?? 1} opacity={gridConfig?.opacity ?? 0.18} strokeDasharray={gridConfig?.lineStyle === 'solid' ? undefined : (gridConfig?.strokeDasharray ?? '3 5')} data-grid-line={gridConfig?.position ?? 'between'} />)}
        {props.interaction?.selection !== false && selected && <rect {...selected.interval} fill={props.interaction?.selectionColor ?? selected.stage.color} opacity={props.interaction?.selectionColor ? 1 : 0.13} rx="4" {...props.interaction?.selectionStyle} data-highlight="selection" />}
        {props.interaction?.hover !== false && shown && shown !== selected && <rect {...shown.interval} fill={props.interaction?.hoverColor ?? shown.stage.color} opacity={props.interaction?.hoverColor ? 1 : 0.07} rx="4" {...props.interaction?.hoverStyle} data-highlight="hover" />}
        <g clipPath={`url(#${prefix}-outline)`}>
          {rows.map(row => <rect key={row.stage.id} {...row.rect} fill={paint.resolve(row.stage.fill ?? row.stage.color, row.rect)} data-stage-paint={row.stage.id} />)}
          {connectors.map(c => <rect key={c.index} {...c.rect} fill={`url(#${prefix}-connector-${c.index})`}
            mask={c.feather > 0 ? `url(#${prefix}-blend-${c.index})` : undefined} data-connector-paint={c.index} />)}
        </g>
        <path d={outline} fill="none" stroke={props.dark ? '#ffffff35' : '#ffffff80'} strokeWidth="0.8" />
        {props.interaction?.selection !== false && selected && <rect {...selected.interval} fill="#fff" opacity="0.22" clipPath={`url(#${prefix}-outline)`} />}
        {props.axes !== false && <g>
          <line x1={plot.x} x2={plot.x} y1={plot.y} y2={plot.y + plot.height} stroke="currentColor" opacity="0.45" />
          <line x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height} y2={plot.y + plot.height} stroke="currentColor" opacity="0.45" />
        </g>}
        {props.yLabels !== false && rows.map(row => {
          const s = resolveTextStyle(props.yAxis);
          return <text key={row.stage.id} x={layout.yLabelX} y={row.labelY} dominantBaseline="central" textAnchor="end" fontSize={s?.fontSize ? undefined : 11} fill={s?.fill ? undefined : 'currentColor'} style={s} data-axis-label="y">{row.stage.label}</text>;
        })}
        {props.xLabels !== false && layout.ticks.map(tick => {
          const s = resolveTextStyle(props.xAxis);
          return <text key={tick.value} x={x(tick.value)} y={layout.xLabelY} textAnchor={tick.align} fontSize={s?.fontSize ? undefined : 11} fill={s?.fill ? undefined : 'currentColor'} style={s} data-axis-label="x">{tick.label}</text>;
        })}
      </g>
      {bars.map(bar => <rect key={bar.segment.id} {...bar.interval} fill="transparent" role="button"
        aria-label={`${bar.stage.label}, ${bar.startLabel} to ${bar.endLabel}, ${bar.durationLabel}`}
        aria-pressed={selectedId === bar.segment.id} data-segment={bar.segment.id} style={{ cursor: 'pointer' }}
        onClick={() => { if (!suppressClick.current) choose(bar.segment.id); suppressClick.current = false; }} />)}
      <defs>
        <clipPath id={`${prefix}-outline`}><path d={outline} /></clipPath>
        {paint.definitions}
        {connectors.map(c => <linearGradient key={c.index} id={`${prefix}-connector-${c.index}`} gradientUnits="userSpaceOnUse" x1={c.rect.x} x2={c.rect.x} y1={c.y1} y2={c.y2}>
          {c.stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
        </linearGradient>)}
        {connectors.filter(c => c.feather > 0).map(c => <React.Fragment key={c.index}>
          <linearGradient id={`${prefix}-fade-${c.index}`}>
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset={c.feather} stopColor="white" />
            <stop offset={1 - c.feather} stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`${prefix}-blend-${c.index}`} maskUnits="userSpaceOnUse" {...c.rect}>
            <rect {...c.rect} fill={`url(#${prefix}-fade-${c.index})`} />
          </mask>
        </React.Fragment>)}
      </defs>
    </svg>
    {shown && tip && tipContent !== null && tipContent !== undefined && <div role="tooltip" className={tip.className}
      style={{ position: 'absolute', left: Math.max(8, Math.min(width - 200, shown.rect.x + shown.rect.width / 2 - 96)), top: shown.rect.y < 72 ? shown.rect.y + shown.rect.height + 12 : shown.rect.y - 65,
        width: 192, boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#172f3a', color: '#fff', fontSize: 12, lineHeight: 1.4, boxShadow: '0 4px 16px #0002', ...tip.style, pointerEvents: 'none', zIndex: 1 }}>
      {tipContent}
    </div>}
  </div>;
}
