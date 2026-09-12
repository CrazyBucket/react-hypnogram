'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { ActiveContext, DefaultStage, HypnogramProps, Rect } from './types';
import { buildLayout, dimension } from './internal/layout';
import { buildStageStops } from './internal/paint';
import { Tooltip } from './internal/Tooltip';
import { listen } from './internal/events';

let fallbackInstanceId = 0;
const sameRect = (a?: Rect, b?: Rect) => a?.x === b?.x && a?.y === b?.y && a?.width === b?.width && a?.height === b?.height;

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
  const { bars, rows, plot, totalHeight, x, outline, thickness } = layout;
  const selected = bars.find(bar => bar.segment.id === selectedId);
  const tip = props.tooltip === false ? null : props.tooltip ?? {};
  const shown = bars.find(bar => bar.segment.id === (activeId ?? (tip?.persistOnSelect === false ? null : selectedId)));
  const [coordinates, setCoordinates] = useState({ scaleX: 1, scaleY: 1, x: 0, y: 0,
    boundary: { x: 0, y: 0, width, height: totalHeight } });
  useEffect(() => {
    const root = host.current, chart = svg.current;
    if (!root || !chart) return;
    const boundary = tip?.boundary?.() ?? root;
    const measure = () => {
      const r = root.getBoundingClientRect(), s = chart.getBoundingClientRect(), b = boundary.getBoundingClientRect();
      // Convert viewport measurements back to the root's CSS coordinate system.
      const rootScaleX = root.offsetWidth > 0 && r.width > 0 ? r.width / root.offsetWidth : 1;
      const rootScaleY = root.offsetHeight > 0 && r.height > 0 ? r.height / root.offsetHeight : 1;
      const next = { scaleX: s.width ? s.width / rootScaleX / width : 1,
        scaleY: s.height ? s.height / rootScaleY / totalHeight : 1,
        x: (s.left - r.left) / rootScaleX - root.clientLeft,
        y: (s.top - r.top) / rootScaleY - root.clientTop,
        boundary: { x: (b.left - r.left) / rootScaleX - root.clientLeft,
          y: (b.top - r.top) / rootScaleY - root.clientTop,
          width: b.width / rootScaleX || width, height: b.height / rootScaleY || totalHeight } };
      setCoordinates(old => old.scaleX === next.scaleX && old.scaleY === next.scaleY
        && old.x === next.x && old.y === next.y && sameRect(old.boundary, next.boundary) ? old : next);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
      const nextWidth = entries.find(entry => entry.target === root)?.contentRect.width;
      if (nextWidth && nextWidth > 0) setMeasuredWidth(nextWidth);
      measure();
    });
    observer?.observe(root); observer?.observe(boundary);
    const cleanup = [listen(window, 'resize', measure), listen(window, 'scroll', measure, true)];
    return () => { observer?.disconnect(); cleanup.forEach(stop => stop()); };
  }, [width, totalHeight, tip?.boundary, !!shown]);
  const activeContext = useMemo<ActiveContext<S, M> | null>(() => {
    if (!shown) return null;
    const { segment, stage, start, end, duration, startLabel, endLabel, durationLabel, rect } = shown;
    const anchor: Rect = { x: coordinates.x + rect.x * coordinates.scaleX, y: coordinates.y + rect.y * coordinates.scaleY,
      width: rect.width * coordinates.scaleX, height: rect.height * coordinates.scaleY };
    return { segment, stage, start, end, duration, startLabel, endLabel, durationLabel, anchor };
  }, [shown, coordinates]);
  const previousActive = useRef<ActiveContext<S, M> | null>(null);
  useEffect(() => {
    const old = previousActive.current, next = activeContext;
    if (old?.segment.id === next?.segment.id && old?.segment.metadata === next?.segment.metadata
      && old?.stage.id === next?.stage.id && old?.stage.label === next?.stage.label && old?.stage.color === next?.stage.color
      && old?.start === next?.start && old?.end === next?.end
      && old?.startLabel === next?.startLabel && old?.endLabel === next?.endLabel
      && sameRect(old?.anchor, next?.anchor)) return;
    previousActive.current = next;
    props.onActiveChange?.(next);
  }, [activeContext, props.onActiveChange]);
  const maybeUseId = (React as unknown as { useId?: () => string }).useId;
  const autoId = useMemo(() => `h${++fallbackInstanceId}`, []);
  const rawId = typeof maybeUseId === 'function' ? maybeUseId() : autoId;
  const prefix = `hypnogram-${rawId.replace(/[^a-zA-Z0-9_-]/g, c => c.charCodeAt(0).toString(16))}`;
  const stops = useMemo(() => buildStageStops(rows, thickness, plot), [rows, thickness, plot]);
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
  function cancelGesture() { gesture.current = null; suppressClick.current = true; setActiveId(null); }
  function clearTimer() { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } }
  function clearSelection() {
    if (selectedId !== null) { setSelectedId(null); props.onSelect?.(null); }
  }
  function dismiss() { clearTimer(); setActiveId(null); clearSelection(); }
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; });
  useEffect(() => {
    const outside = (event: globalThis.PointerEvent) => {
      if (!host.current?.contains(event.target as Node)) dismissRef.current();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismissRef.current(); };
    const finishOutside = (event: globalThis.PointerEvent) => {
      if (gesture.current?.pointerId === event.pointerId && !svg.current?.contains(event.target as Node)) {
        cancelGesture();
      }
    };
    const cleanup = [
      listen(document, 'pointerup', finishOutside), listen(document, 'pointercancel', cancelGesture),
      listen(window, 'blur', cancelGesture), listen(document, 'pointerdown', outside), listen(document, 'keydown', escape),
    ];
    return () => { cleanup.forEach(stop => stop()); clearTimer(); };
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
  function scheduleHide() {
    clearTimer();
    timer.current = setTimeout(() => setActiveId(null), dimension(tip?.hideDelay ?? 1500, 'tooltip.hideDelay'));
  }
  function choose(id: string) {
    const bar = bars.find(item => item.segment.id === id);
    if (!bar) return;
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    props.onSelect?.(next ? bar.segment : null);
    props.onSegmentClick?.(bar.segment);
    if (tip?.persistOnSelect === false) { setActiveId(id); scheduleHide(); }
  }
  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    clearTimer(); suppressClick.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    if (event.pointerType === 'touch') {
      event.currentTarget.setPointerCapture?.(event.pointerId);
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
      scheduleHide();
    }
  }
  return <div ref={host} id={props.id} className={props.className} style={{ position: 'relative', width: props.width ?? '100%', minWidth: 0, color: foreground, ...props.style }}>
    <svg ref={svg} width="100%" height={totalHeight} viewBox={`0 0 ${width} ${totalHeight}`} role="group" aria-label={props.ariaLabel ?? 'Sleep stages over time'}
      style={{ display: 'block', touchAction: 'pan-y' }}
      onClick={event => { if (suppressClick.current) suppressClick.current = false;
        else if (!(event.target as Element).closest('[data-segment]')) dismiss(); }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={cancelGesture}
      onPointerLeave={event => { if (event.pointerType !== 'touch') setActiveId(null); }}>
      <g pointerEvents="none">
        {gridEnabled && gridLines.map((y, i) => <line key={i} x1={plot.x} x2={plot.x + plot.width} y1={y} y2={y} stroke={gridConfig?.stroke ?? 'currentColor'} strokeWidth={gridConfig?.strokeWidth ?? 1} opacity={gridConfig?.opacity ?? 0.18} strokeDasharray={gridConfig?.lineStyle === 'solid' ? undefined : (gridConfig?.strokeDasharray ?? '3 5')} data-grid-line={gridConfig?.position ?? 'between'} />)}
        {props.interaction?.selection !== false && selected && <rect {...selected.interval} fill={props.interaction?.selectionColor ?? selected.stage.color} opacity={props.interaction?.selectionColor ? 1 : 0.13} rx="4" {...props.interaction?.selectionStyle} data-highlight="selection" />}
        {props.interaction?.hover !== false && shown && shown !== selected && <rect {...shown.interval} fill={props.interaction?.hoverColor ?? shown.stage.color} opacity={props.interaction?.hoverColor ? 1 : 0.07} rx="4" {...props.interaction?.hoverStyle} data-highlight="hover" />}
        <g clipPath={`url(#${prefix}-outline)`}>
          <rect {...plot} fill={`url(#${prefix}-palette)`} data-stage-paint="palette" />
        </g>
        <path d={outline} fill="none" stroke={props.dark ? '#ffffff35' : '#ffffff80'} strokeWidth="0.8" style={props.outlineStyle} />
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
        onClick={() => { if (!suppressClick.current) choose(bar.segment.id); }} />)}
      <defs>
        <clipPath id={`${prefix}-outline`}><path d={outline} /></clipPath>
        <linearGradient id={`${prefix}-palette`} gradientUnits="userSpaceOnUse" x1={plot.x} x2={plot.x} y1={plot.y} y2={plot.y + plot.height}>
          {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />)}
        </linearGradient>
      </defs>
    </svg>
    {activeContext && tip && <Tooltip context={activeContext} options={tip} boundary={coordinates.boundary} />}
  </div>;
}
