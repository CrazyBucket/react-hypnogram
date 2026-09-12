import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ActiveContext, Rect, TooltipOptions } from '../types';
import { dimension } from './layout';
import { listen } from './events';
import { placeTooltip } from './tooltip-position';

export function Tooltip<S extends string, M>({ context, options, boundary }: {
  context: ActiveContext<S, M>; options: TooltipOptions<S, M>; boundary: Rect;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const padding = dimension(options.boundaryPadding ?? 8, 'tooltip.boundaryPadding');
  const position = placeTooltip(context.anchor, size, boundary, options.placement ?? 'top',
    dimension(options.offset ?? 12, 'tooltip.offset'), padding);
  const content = options.render ? options.render({ ...context, placement: position.placement, arrowOffset: position.arrowOffset }) : <>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}><strong>{context.stage.label}</strong><span>{context.durationLabel}</span></div>
    <div style={{ marginTop: 6 }}>{context.startLabel} → {context.endLabel}</div>
  </>;
  const hasContent = content !== null && content !== undefined;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = { width: element.offsetWidth, height: element.offsetHeight };
      setSize(old => old.width === next.width && old.height === next.height ? old : next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return listen(window, 'resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasContent, typeof ResizeObserver === 'undefined' ? content : null]);
  if (!hasContent) return null;
  return <div ref={ref} role="tooltip" className={options.className} data-placement={position.placement}
    style={{ width: 'max-content', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
      background: '#172f3a', color: '#fff', fontSize: 12, lineHeight: 1.4, boxShadow: '0 4px 16px #0002', zIndex: 1,
      ...options.style, maxWidth: Math.max(0, boundary.width - 2 * padding),
      position: 'absolute', left: position.left, top: position.top, pointerEvents: 'none',
      visibility: size.width > 0 ? 'visible' : 'hidden',
      '--hypnogram-arrow-x': `${position.arrowOffset}px`,
    } as React.CSSProperties}>{content}</div>;
}
