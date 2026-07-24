import type { ConnectedPosition, HorizontalConnectionPos, VerticalConnectionPos } from '@angular/cdk/overlay';

export type OverlaySide = 'top' | 'bottom' | 'start' | 'end';
export type OverlayAlign = 'start' | 'center' | 'end';
export interface Placement {
  side: OverlaySide;
  align: OverlayAlign;
}
export type PlacementInput = OverlaySide | `${OverlaySide}-${OverlayAlign}`;

/** Parse a 'bottom' | 'bottom-start' shorthand into a normalized Placement (center by default). */
export function normalizePlacement(input: PlacementInput): Placement {
  const [side, align] = input.split('-') as [OverlaySide, OverlayAlign | undefined];
  return { side, align: align ?? 'center' };
}

/** Resolve a logical horizontal value ('start'|'center'|'end') to a physical CDK pos for the given dir. */
function resolveX(value: OverlayAlign, dir: 'ltr' | 'rtl'): HorizontalConnectionPos {
  if (value === 'center') return 'center';
  const physicalStart: HorizontalConnectionPos = dir === 'rtl' ? 'end' : 'start';
  const physicalEnd: HorizontalConnectionPos = dir === 'rtl' ? 'start' : 'end';
  return value === 'start' ? physicalStart : physicalEnd;
}

/**
 * Map a logical Placement to CDK ConnectedPosition[] (primary + opposite-side fallback).
 * For top/bottom sides the main axis is vertical and `align` is the horizontal alignment.
 * For start/end sides the main axis is horizontal and `align` is the vertical alignment.
 */
export function connectedPositions(p: Placement, dir: 'ltr' | 'rtl'): ConnectedPosition[] {
  const verticalMain = p.side === 'top' || p.side === 'bottom';

  if (verticalMain) {
    const originY: VerticalConnectionPos = p.side === 'bottom' ? 'bottom' : 'top';
    const overlayY: VerticalConnectionPos = p.side === 'bottom' ? 'top' : 'bottom';
    const x = resolveX(p.align, dir);
    const primary: ConnectedPosition = { originX: x, overlayX: x, originY, overlayY };
    const fallback: ConnectedPosition = { originX: x, overlayX: x, originY: overlayY, overlayY: originY };
    return [primary, fallback];
  }

  // start/end side: horizontal main axis
  const physicalSide = resolveX(p.side === 'start' ? 'start' : 'end', dir);
  const originX: HorizontalConnectionPos = physicalSide;
  const overlayX: HorizontalConnectionPos = physicalSide === 'start' ? 'end' : 'start';
  const y: VerticalConnectionPos = p.align === 'center' ? 'center' : p.align === 'start' ? 'top' : 'bottom';
  const primary: ConnectedPosition = { originX, overlayX, originY: y, overlayY: y };
  const fallback: ConnectedPosition = { originX: overlayX, overlayX: originX, originY: y, overlayY: y };
  return [primary, fallback];
}
