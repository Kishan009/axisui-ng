import { Directive, InjectionToken, inject } from '@angular/core';

/** Minimal contract an overlay container exposes so content can dismiss it. */
export interface OverlayRefLike {
  close(): void;
}

/** Provided by each overlay container (Dialog, Sheet, Popover, menu) for its content. */
export const OVERLAY_REF = new InjectionToken<OverlayRefLike>('AX_OVERLAY_REF');

/**
 * axOverlayClose — put on any button inside overlay content to dismiss the overlay.
 * @example <button axOverlayClose>Cancel</button>
 */
@Directive({
  selector: '[axOverlayClose]',
  host: { '(click)': 'close()', type: 'button' },
})
export class AxOverlayCloseDirective {
  private readonly ref = inject(OVERLAY_REF, { optional: true });
  protected close(): void {
    this.ref?.close();
  }
}
