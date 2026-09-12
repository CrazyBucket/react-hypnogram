import type { Rect } from '../types';

export function placeTooltip(anchor: Rect, size: { width: number; height: number }, boundary: Rect,
  preferred: 'top' | 'bottom', offset: number, padding: number) {
  const center = anchor.x + anchor.width / 2;
  const minX = boundary.x + padding;
  const maxX = Math.max(minX, boundary.x + boundary.width - padding - size.width);
  const left = Math.max(minX, Math.min(maxX, center - size.width / 2));
  const topSpace = anchor.y - boundary.y - padding - offset;
  const bottomSpace = boundary.y + boundary.height - padding - anchor.y - anchor.height - offset;
  const fitsPreferred = (preferred === 'top' ? topSpace : bottomSpace) >= size.height;
  const placement = fitsPreferred ? preferred : topSpace >= bottomSpace ? 'top' : 'bottom';
  const idealTop = placement === 'top' ? anchor.y - size.height - offset : anchor.y + anchor.height + offset;
  const minY = boundary.y + padding;
  const maxY = Math.max(minY, boundary.y + boundary.height - padding - size.height);
  return { left, top: Math.max(minY, Math.min(maxY, idealTop)), placement,
    arrowOffset: Math.max(0, Math.min(size.width, center - left)) };
}
