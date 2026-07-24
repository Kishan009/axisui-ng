/**
 * @axisui-ng/overlays-core — Shared internals for @axisui-ng/overlays.
 * Connected-overlay positioning, the overlay-ref token/directive, placement math, and the cn util.
 */
export { AxOverlayCloseDirective, OVERLAY_REF, type OverlayRefLike } from './lib/overlay-ref';
export {
  type Placement, type PlacementInput, type OverlaySide, type OverlayAlign,
  normalizePlacement, connectedPositions,
} from './lib/placement';
export { createConnectedOverlayRef, animateOverlayClose, returnFocusToTrigger } from './lib/connected-overlay';
export { cn } from './lib/cn';
