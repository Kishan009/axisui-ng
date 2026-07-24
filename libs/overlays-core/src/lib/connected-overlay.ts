import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayRef, type ScrollStrategy } from '@angular/cdk/overlay';

import { connectedPositions, type Placement } from './placement';

/**
 * Create (but do not attach) a CDK OverlayRef anchored to `origin`, positioned per `placement`.
 * Direction-aware (start/end flip in RTL). Repositions on scroll by default.
 */
export function createConnectedOverlayRef(
  overlay: Overlay,
  dir: Directionality,
  origin: HTMLElement,
  placement: Placement,
  scrollStrategy: ScrollStrategy = overlay.scrollStrategies.reposition(),
): OverlayRef {
  const positionStrategy = overlay
    .position()
    .flexibleConnectedTo(origin)
    .withPositions(connectedPositions(placement, dir.value))
    .withFlexibleDimensions(false)
    .withPush(true);
  return overlay.create({ positionStrategy, scrollStrategy, direction: dir.value });
}

/**
 * Dispose a connected OverlayRef AFTER its exit animation finishes, so closing
 * overlays animate out instead of vanishing.
 *
 * Sets `data-state="closed"` on the overlay's `[data-ax-overlay]` panel (which
 * triggers the `ax-overlay-out` keyframe from the theme layer), then disposes on
 * `animationend`. A timeout fallback covers the no-panel / no-animation /
 * interrupted cases — and reduced motion, where the base-layer floor collapses
 * the animation to ~0ms so `animationend` fires almost immediately anyway.
 *
 * Triggers should null out their local `OverlayRef` reference right after calling
 * this (a re-open then creates a fresh overlay while this one finishes animating).
 */
/**
 * Return focus to `trigger` as an overlay closes — but only when focus is
 * currently inside the overlay (i.e. the user was navigating it by keyboard).
 * This restores focus after Escape / item selection (WCAG 2.4.3) without
 * stealing it when the overlay was dismissed by a click elsewhere. SSR-safe
 * (reads the overlay's own `ownerDocument`, never the global `document`).
 * Call this BEFORE {@link animateOverlayClose}, while the overlay is still mounted.
 */
export function returnFocusToTrigger(
  overlayRef: OverlayRef,
  trigger: HTMLElement | null | undefined,
): void {
  if (!trigger) return;
  const overlayEl = overlayRef.overlayElement;
  const active = overlayEl?.ownerDocument.activeElement;
  if (overlayEl && active && overlayEl.contains(active)) {
    trigger.focus();
  }
}

export function animateOverlayClose(overlayRef: OverlayRef): void {
  const panel = overlayRef.overlayElement?.querySelector('[data-ax-overlay]') as HTMLElement | null;
  if (!panel) {
    overlayRef.dispose();
    return;
  }
  panel.setAttribute('data-state', 'closed');
  // If no exit animation is actually in effect — no stylesheet (jsdom/unit tests),
  // or the rule resolves to none — dispose synchronously instead of waiting.
  const animationName = getComputedStyle(panel).animationName;
  if (!animationName || animationName === 'none') {
    overlayRef.dispose();
    return;
  }
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    overlayRef.dispose();
  };
  panel.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, 300);
}
