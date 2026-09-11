// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Hypnogram, DEFAULT_STAGES } from '../src';
import type { HypnogramProps } from '../src';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const data: HypnogramProps['data'] = [
  { id: 'a', stage: 'light', start: 0, end: 1000 },
  { id: 'b', stage: 'deep', start: 1000, end: 2000 },
];
let root: Root | undefined;
let host: HTMLDivElement;
async function render(props: HypnogramProps) {
  if (!root) { host = document.createElement('div'); document.body.append(host); root = createRoot(host); }
  await act(async () => root!.render(<Hypnogram {...props} />));
}
async function click(id: string) {
  await act(async () => host.querySelector(`[data-segment="${id}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
}
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('public component', () => {
  it('applies independent axis text styling even with axis lines hidden', async () => {
    await render({ data, axes: false,
      xAxis: { labelOffset: -20, labelStyle: { fill: '#999999', fontSize: 14, fontWeight: 600 } },
      yAxis: { labelOffset: -8, labelStyle: { fill: '#555555', fontFamily: 'monospace' } } });
    const xLabel = host.querySelector<SVGTextElement>('[data-axis-label="x"]')!;
    const yLabel = host.querySelector<SVGTextElement>('[data-axis-label="y"]')!;
    expect(xLabel.style.fontSize).toBe('14px');
    expect(xLabel.style.fontWeight).toBe('600');
    expect(yLabel.style.fontFamily).toBe('monospace');
    expect(xLabel.style.fill).toBe('#999999');
    expect(yLabel.style.fill).toBe('#555555');
  });
  it('supports direct style property with color, lineHeight, and fontFamily on axis labels', async () => {
    await render({ data,
      xAxis: { style: { color: '#0A77F5', fontSize: '15px', lineHeight: '1.5', fontFamily: 'sans-serif' } },
      yAxis: { style: { color: '#FF5500', fontWeight: 'bold' } } });
    const xLabel = host.querySelector<SVGTextElement>('[data-axis-label="x"]')!;
    const yLabel = host.querySelector<SVGTextElement>('[data-axis-label="y"]')!;
    expect(xLabel.style.fill).toBe('#0A77F5');
    expect(xLabel.style.fontSize).toBe('15px');
    expect(xLabel.style.fontFamily).toBe('sans-serif');
    expect(xLabel.getAttribute('fontSize')).toBeNull();
    expect(yLabel.style.fill).toBe('#FF5500');
    expect(yLabel.style.fontWeight).toBe('bold');
  });
  it('feathers connector paint into solid bars instead of cutting it at rectangle edges', async () => {
    await render({ data, radius: 14, rowGap: -18 });
    const connector = host.querySelector('[data-connector-paint]')!;
    const maskId = connector.getAttribute('mask')!.slice(5, -1);
    const mask = host.querySelector(`mask[id="${maskId}"]`)!;
    expect(mask).not.toBeNull();
    const fadeId = mask.querySelector('rect')!.getAttribute('fill')!.slice(5, -1);
    const stops = host.querySelectorAll(`linearGradient[id="${fadeId}"] stop`);
    expect(stops[0]!.getAttribute('stop-opacity')).toBe('0');
    expect(stops[stops.length - 1]!.getAttribute('stop-opacity')).toBe('0');
  });
  it('renders without window-dependent work during SSR and uses instance-unique gradient IDs', () => {
    const stages = DEFAULT_STAGES.map(s => ({ ...s, fill: { type: 'linear' as const, stops: [{ offset: 0, color: s.color }, { offset: 1, color: '#fff' }] } }));
    const output = renderToString(<><Hypnogram data={data} stages={stages} /><Hypnogram data={data} stages={stages} /></>);
    const ids = [...output.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(output).toContain('linearGradient');
    expect(output).not.toMatch(/NaN|Infinity/);
  });
  it('fires click for every activation and toggles selection callbacks', async () => {
    const onSegmentClick = vi.fn(), onSelect = vi.fn();
    await render({ data, onSegmentClick, onSelect });
    await click('a');
    expect(host.querySelector('[data-segment="a"]')?.getAttribute('aria-pressed')).toBe('true');
    await click('a');
    expect(onSelect.mock.calls.map(call => call[0])).toEqual([data[0], null]);
    expect(onSegmentClick).toHaveBeenCalledTimes(2);
    expect(onSegmentClick).toHaveBeenLastCalledWith(data[0]);
  });
  it('keeps the removed keyboard navigation absent', async () => {
    const onSegmentClick = vi.fn();
    await render({ data, onSegmentClick });
    expect(host.querySelector('[tabindex]')).toBeNull();
    const hit = host.querySelector('[data-segment="a"]')!;
    await act(async () => hit.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onSegmentClick).not.toHaveBeenCalled();
  });
  it('customizes tooltip content/style and permits returning null', async () => {
    await render({ data, tooltip: { render: context => createElement('b', {}, context.segment.id + context.durationLabel), style: { background: 'red' } } });
    await click('a');
    expect(host.querySelector('[role="tooltip"]')?.textContent).toBe('a1 sec');
    expect((host.querySelector('[role="tooltip"]') as HTMLElement).style.background).toBe('red');
    await render({ data, tooltip: { render: () => null } });
    expect(host.querySelector('[role="tooltip"]')).toBeNull();
  });
  it('keeps four solid row paints when gradients are absent, including touching full-height bars', async () => {
    await render({ data, rowGap: 0, barHeight: 44, radius: 5, connectors: false });
    expect([...host.querySelectorAll('[data-stage-paint]')].map(node => node.getAttribute('fill'))).toEqual(DEFAULT_STAGES.map(s => s.color));
    expect(host.querySelector('linearGradient')).toBeNull();
    expect(host.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('handles empty data and hidden axes without a default background', async () => {
    await render({ data: [], axes: false, xLabels: false, yLabels: false, grid: false });
    expect(host.querySelector('text, line, [role="button"]')).toBeNull();
    expect(host.firstElementChild?.getAttribute('style')).not.toContain('background');
  });
  it('clears selection when data is removed and dismisses it outside', async () => {
    const onSelect = vi.fn();
    await render({ data, onSelect });
    await click('a');
    await render({ data: [data[1]!], onSelect });
    expect(onSelect).toHaveBeenLastCalledWith(null);
    await click('b');
    await act(async () => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    expect(host.querySelector('[aria-pressed="true"]')).toBeNull();
  });
  it('renders alpha-inclusive highlight colors as-is without a forced overlay opacity', async () => {
    await render({ data, interaction: { selectionColor: '#1D81F512' } });
    await click('a');
    const band = host.querySelector('[data-highlight="selection"]');
    expect(band?.getAttribute('fill')).toBe('#1D81F512');
    expect(band?.getAttribute('opacity')).toBe('1');
  });
  it('hides highlight effects independently of tooltip and selection state', async () => {
    await render({ data, interaction: { hover: false, selection: false } });
    await click('a');
    expect(host.querySelector('[data-highlight]')).toBeNull();
    expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  });
  it('renders axes after chart shapes so chart does not cover axes lines', async () => {
    await render({ data });
    const outline = host.querySelector('path[d]');
    const lines = host.querySelectorAll('line');
    const yAxisLine = [...lines].find(line => line.getAttribute('stroke-dasharray') === null);
    expect(outline).not.toBeNull();
    expect(yAxisLine).not.toBeNull();
    expect(outline!.compareDocumentPosition(yAxisLine!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('renders connector gradients between contiguous stages', async () => {
    await render({ data });
    const connectorRect = host.querySelector('[data-connector-paint]');
    expect(connectorRect).not.toBeNull();
    const fill = connectorRect!.getAttribute('fill');
    expect(fill).toMatch(/^url\(#hypnogram-.*-connector-0\)$/);
    const gradId = fill!.replace(/^url\(#|\)$/g, '');
    const gradient = host.querySelector(`linearGradient#${gradId}`);
    expect(gradient).not.toBeNull();
    const stops = gradient!.querySelectorAll('stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
    expect(stops[0]!.getAttribute('stop-color')).toBe(DEFAULT_STAGES[2]!.color);
    expect(stops[stops.length - 1]!.getAttribute('stop-color')).toBe(DEFAULT_STAGES[3]!.color);
  });
  it('supports ConnectorOptions object and custom maxGap tolerance', async () => {
    const discrete = [
      { id: '1', stage: 'light' as const, start: 0, end: 1000 },
      { id: '2', stage: 'deep' as const, start: 2000, end: 3000 },
    ];
    await render({ data: discrete, connectors: { maxGap: 0 } });
    expect(host.querySelector('[data-connector-paint]')).toBeNull();
    await render({ data: discrete, radius: 0, connectors: { maxGap: 1500, width: 4 } });
    const connectorRect = host.querySelector('[data-connector-paint]');
    expect(connectorRect).not.toBeNull();
    expect(connectorRect?.getAttribute('width')).toBe('4');
  });
  it('renders with stageHeight and barThickness props', async () => {
    await render({ data, stageHeight: 32, barThickness: 20 });
    const outline = host.querySelector('path[d]');
    expect(outline).not.toBeNull();
    expect(host.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('supports GridOptions with between/center position and solid/dashed lineStyle', async () => {
    await render({ data, axes: false });
    const defaultLines = host.querySelectorAll('[data-grid-line="between"]');
    expect(defaultLines).toHaveLength(DEFAULT_STAGES.length - 1);
    expect(defaultLines[0]!.getAttribute('stroke-dasharray')).toBe('3 5');

    await render({ data, axes: false, grid: { position: 'center' } });
    const centerLines = host.querySelectorAll('[data-grid-line="center"]');
    expect(centerLines).toHaveLength(DEFAULT_STAGES.length);

    await render({ data, axes: false, grid: { lineStyle: 'solid' } });
    const solidLines = host.querySelectorAll('[data-grid-line="between"]');
    expect(solidLines[0]!.getAttribute('stroke-dasharray')).toBeNull();

    await render({ data, axes: false, grid: { includeEdges: true } });
    const edgeLines = host.querySelectorAll('[data-grid-line="between"]');
    expect(edgeLines).toHaveLength(DEFAULT_STAGES.length + 1);
  });
});
