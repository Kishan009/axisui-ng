import type { OverlayRef } from '@angular/cdk/overlay';
import type { Injector } from '@angular/core';
import { Subject, type Observable } from 'rxjs';

import type { OverlayRefLike } from '@axisui-ng/overlays-core';

/**
 * Handle to a dialog opened via {@link AxDialogService.open}.
 *
 * Implements {@link OverlayRefLike} (`close()`) and is provided to the opened
 * component under both `DialogRef` and `OVERLAY_REF`, so content can dismiss
 * itself — including via the `axOverlayClose` directive.
 *
 * @typeParam T - The opened component's type.
 * @typeParam R - The result type delivered through {@link result$} on close.
 */
export class DialogRef<T = unknown, R = unknown> implements OverlayRefLike {
  private readonly _result = new Subject<R | undefined>();
  private readonly _teardown: Array<() => void> = [];
  private closed = false;
  private _componentInstance!: T;

  /** Emits the close result once, then completes. */
  readonly result$: Observable<R | undefined> = this._result.asObservable();

  constructor(
    private readonly overlayRef: OverlayRef,
    /** Injector used for the opened component (provides this ref, OVERLAY_REF and DIALOG_DATA). */
    readonly injector: Injector,
  ) {}

  /** The component instance rendered inside the dialog. */
  get componentInstance(): T {
    return this._componentInstance;
  }

  /**
   * Set the rendered component instance. Called once by {@link AxDialogService}
   * after the portal is attached. Internal — not part of the public surface.
   */
  _setComponentInstance(instance: T): void {
    this._componentInstance = instance;
  }

  /**
   * Register a teardown callback run exactly once on {@link close} (after the
   * overlay is disposed). Used by {@link AxDialogService} to dispose the focus
   * trap and restore focus to the previously-focused element. Internal.
   */
  _onClose(fn: () => void): void {
    this._teardown.push(fn);
  }

  /**
   * Close the dialog, emit `result` through {@link result$}, dispose the
   * overlay, and run any registered teardown. Idempotent — calling more than
   * once is a no-op.
   */
  close(result?: R): void {
    if (this.closed) return;
    this.closed = true;
    this._result.next(result);
    this._result.complete();
    this.overlayRef.dispose();
    for (const fn of this._teardown.splice(0)) fn();
  }
}
