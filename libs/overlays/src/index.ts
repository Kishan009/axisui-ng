/**
 * @axisui-ng/overlays — Public API barrel.
 * Overlay components: Dialog, Sheet, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu.
 */

export {
  AxOverlayCloseDirective, OVERLAY_REF, type OverlayRefLike,
  type Placement, type PlacementInput, type OverlaySide, type OverlayAlign,
  normalizePlacement, connectedPositions,
  createConnectedOverlayRef, animateOverlayClose, cn,
} from '@axisui-ng/overlays-core';

export * from './lib/tooltip';
export * from './lib/popover';
export * from './lib/hover-card';
export * from './lib/dialog';
export * from './lib/sheet';
export * from './lib/menu';
export * from './lib/context-menu';
