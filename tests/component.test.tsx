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
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.restoreAllMocks(); vi.useRealTimers(); });

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
  it('uses one shared Y palette without connector overlays at large radii', async () => {
    await render({ data, radius: 14, stageHeight: 26 });
    expect(host.querySelectorAll('linearGradient')).toHaveLength(1);
    expect(host.querySelector('mask, [data-connector-paint]')).toBeNull();
    expect(host.querySelector('[data-stage-paint]')?.getAttribute('fill')).toMatch(/-palette/);
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
    await render({ data, stageHeight: 44, barThickness: 44, radius: 5, connectors: false });
    expect([...new Set([...host.querySelectorAll('stop')].map(node => node.getAttribute('stop-color')))]).toEqual(DEFAULT_STAGES.map(s => s.color));
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

// Touch events keep their original DOM target during a drag: selection must use coordinates.
it('scrubs across intervals on touch and hides custom content after release', async () => {
  vi.useFakeTimers();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 96, width: 400, height: 96, toJSON() {},
  });
  const onClick = vi.fn();
  await render({ data, width: 400, stageHeight: 24, barThickness: 24, xLabels: false, yLabels: false,
    plotPadding: { top: 0, right: 0, bottom: 0, left: 0 },
    tooltip: { persistOnSelect: false, hideDelay: 1000, render: c => c.segment.id }, onSegmentClick: onClick });
  const target = host.querySelector('[data-segment="a"]')!;
  const pointer = async (type: string, x: number) => act(async () => {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true,
      pointerType: 'touch', button: 0, clientX: x, clientY: 65 }));
  });
  await pointer('pointerdown', 100);
  expect(host.querySelector('[role="tooltip"]')?.textContent).toBe('a');
  await pointer('pointermove', 300);
  expect(host.querySelector('[role="tooltip"]')?.textContent).toBe('b');
  await pointer('pointerup', 300);
  expect(onClick).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTime(999));
  expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  await act(async () => vi.advanceTimersByTime(1));
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
});
it('reports original metadata and root-relative bar bounds to external tooltips', async () => {
  const onActiveChange = vi.fn();
  const metadata = { note: 'original' };
  const annotated = data.map(s => ({ ...s, metadata }));
  await render({ data: annotated, width: 400, tooltip: false, onActiveChange, stageHeight: 24, barThickness: 24,
    xLabels: false, yLabels: false, plotPadding: { top: 0, right: 0, bottom: 0, left: 0 } });
  await click('a');
  const context = onActiveChange.mock.calls.at(-1)![0];
  expect(context.segment).toBe(annotated[0]);
  expect(context.segment.metadata).toBe(metadata);
  expect(context.anchor).toEqual({ x: 0, y: 48, width: 200, height: 24 });
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
  await click('a');
  expect(onActiveChange).toHaveBeenLastCalledWith(null);
});
it('measures custom tooltip dimensions and positions inside a surrounding card', async () => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.getAttribute('role') === 'tooltip' ? 230 : 400;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.getAttribute('role') === 'tooltip' ? 90 : 96;
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 96, width: 400, height: 96, toJSON() {},
  });
  const card = document.createElement('div');
  card.getBoundingClientRect = () => ({ x: 0, y: -100, left: 0, top: -100, right: 400,
    bottom: 200, width: 400, height: 300, toJSON() {} });
  await render({ data, width: 400, stageHeight: 24, barThickness: 24, xLabels: false, yLabels: false,
    plotPadding: { top: 0, right: 0, bottom: 0, left: 0 },
    tooltip: { boundary: () => card, offset: 10, render: c => `${c.placement}/${c.arrowOffset}` } });
  await click('b');
  const element = host.querySelector<HTMLElement>('[role="tooltip"]')!;
  expect(element.style.left).toBe('162px');
  expect(element.style.top).toBe('-28px');
  expect(element.style.visibility).toBe('visible');
  expect(element.textContent).toBe('top/138');
  expect(element.style.getPropertyValue('--hypnogram-arrow-x')).toBe('138px');
});
it('keeps selection state but dismisses transient click tooltips on schedule', async () => {
  vi.useFakeTimers();
  await render({ data, tooltip: { persistOnSelect: false, hideDelay: 1000 } });
  await click('a');
  expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  await act(async () => vi.advanceTimersByTime(1000));
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
  expect(host.querySelector('[data-segment="a"]')?.getAttribute('aria-pressed')).toBe('true');
});
it('clears a mouse drag released outside and resumes normal hover dismissal', async () => {
  await render({ data, width: 400 });
  const svg = host.querySelector('svg')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 310, width: 400, height: 310, x: 0, y: 0, toJSON() {} });
  const pointer = async (target: Element, type: string) => act(async () => target.dispatchEvent(new PointerEvent(type, {
    bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, clientX: 150, clientY: 100,
    relatedTarget: document.body,
  })));
  await pointer(svg, 'pointerdown');
  await pointer(svg, 'pointermove');
  expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  await pointer(document.body, 'pointerup');
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
  await pointer(svg, 'pointermove');
  expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  await pointer(svg, 'pointerout');
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
});
it('does not dismiss a touch tooltip on the compatibility click targeting its capturing SVG', async () => {
  await render({ data, width: 400, tooltip: { persistOnSelect: false, hideDelay: 1000 } });
  const svg = host.querySelector('svg')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 310, width: 400, height: 310, x: 0, y: 0, toJSON() {} });
  for (const type of ['pointerdown', 'pointerup']) await act(async () => svg.dispatchEvent(new PointerEvent(type, {
    bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 150, clientY: 100,
  })));
  await act(async () => svg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  await act(async () => svg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(host.querySelector('[role="tooltip"]')).toBeNull();
});
it('retains the tooltip size observer when custom content changes', async () => {
  const NativeObserver = globalThis.ResizeObserver;
  let instances = 0;
  const observers: Array<{ target?: Element; resize: () => void }> = [];
  class Observer {
    record: { target?: Element; resize: () => void };
    constructor(callback: () => void) { instances++; this.record = { resize: callback }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    disconnect() {}
    unobserve() {}
  }
  globalThis.ResizeObserver = Observer as unknown as typeof ResizeObserver;
  let tooltipWidth = 120;
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.getAttribute('role') === 'tooltip' ? tooltipWidth : 400;
  });
  try {
    const content = (context: { segment: { id: string } }) => <b>{context.segment.id}</b>;
    await render({ data, width: 400, tooltip: { render: content } });
    await click('a');
    const count = instances;
    await click('b');
    expect(instances).toBe(count);
    tooltipWidth = 200;
    const observer = observers.find(o => o.target?.getAttribute('role') === 'tooltip')!;
    expect(observer).toBeDefined();
    await act(async () => observer.resize());
    expect(instances).toBe(count);
    expect(host.querySelector('[role="tooltip"]')?.textContent).toBe('b');
  } finally {
    await act(async () => root?.unmount()); root = undefined;
    globalThis.ResizeObserver = NativeObserver;
  }
});
