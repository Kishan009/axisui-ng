import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Overlay, type OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, type StaticProvider, type Type, inject } from '@angular/core';

import { OVERLAY_REF } from '@axisui-ng/overlays-core';
import { AxDialogContainerComponent } from './dialog-container.component';
import { DialogRef } from './dialog-ref';
import { DIALOG_DATA, type DialogOptions, type DialogSize } from './dialog.types';

/** Max-width class applied to the overlay pane per {@link DialogSize}. */
const SIZE_CLASS: Record<DialogSize, string> = {
  sm: 'ax-dialog-sm',
  md: 'ax-dialog-md',
  lg: 'ax-dialog-lg',
};

/**
 * AxDialogService — open a component inside a modal dialog programmatically.
 *
 * Complements the template-driven `<ax-dialog>`: same overlay config (centered,
 * backdrop, block scroll), focus trap with auto-capture and focus restoration,
 * but renders an arbitrary component and returns a {@link DialogRef} with a
 * reactive close result.
 *
 * @example
 * const ref = dialog.open(ConfirmComponent, { data: { message: 'Sure?' } });
 * ref.result$.subscribe((confirmed) => { ... });
 */
@Injectable({ providedIn: 'root' })
export class AxDialogService {
  private readonly overlay = inject(Overlay);
  private readonly parentInjector = inject(Injector);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly document = inject(DOCUMENT);

  /**
   * Open `component` in a modal dialog.
   *
   * @typeParam T - The component type to render.
   * @typeParam R - The result type delivered through {@link DialogRef.result$}.
   */
  open<T, R = unknown>(component: Type<T>, options: DialogOptions = {}): DialogRef<T, R> {
    const {
      backdrop = true,
      closeOnEscape = true,
      closeOnBackdrop = true,
      closeButton = true,
      size = 'md',
      ariaLabel = null,
      customClass,
      data,
    } = options;

    // Capture the element to restore focus to on close, before the dialog
    // steals focus. Guarded for SSR / detached DOM.
    const previouslyFocused = this.activeElement();

    const config: OverlayConfig = {
      hasBackdrop: backdrop,
      backdropClass: 'cdk-overlay-dark-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      panelClass: [SIZE_CLASS[size], ...(customClass ? [customClass] : [])],
    };

    const overlayRef = this.overlay.create(config);

    // Child injector so the opened component can inject its own ref + data, and
    // so the `axOverlayClose` directive (which reads OVERLAY_REF) dismisses it.
    const providers: StaticProvider[] = [
      { provide: DialogRef, useFactory: () => ref },
      { provide: OVERLAY_REF, useFactory: () => ref },
      { provide: DIALOG_DATA, useValue: data ?? null },
    ];
    const injector = Injector.create({ parent: this.parentInjector, providers });

    // Construct the ref before attaching so the component can inject it during
    // creation; the instance is wired back once the portal is attached.
    const ref = new DialogRef<T, R>(overlayRef, injector);

    // Attach a tiny host container, then project the requested component into
    // it. The container owns panel chrome + the optional dismiss button so both
    // sit inside the overlay (and the focus trap) alongside the content.
    const containerRef = overlayRef.attach(
      new ComponentPortal(AxDialogContainerComponent, null, injector),
    );
    containerRef.setInput('closeButton', closeButton);
    containerRef.setInput('size', size);
    containerRef.setInput('ariaLabel', ariaLabel);
    containerRef.instance.closeClick.subscribe(() => ref.close());

    const portal = new ComponentPortal(component, null, injector);
    const componentRef = containerRef.instance.attachContent(portal);
    ref._setComponentInstance(componentRef.instance);

    // Render the container synchronously (it is OnPush and attached
    // programmatically) so the optional close button and the projected content
    // exist in the DOM before the focus trap looks for tabbable elements.
    containerRef.changeDetectorRef.detectChanges();

    // Focus trap over the whole overlay element so Tab cannot escape to
    // background content; auto-capture moves focus into the dialog on open.
    const focusTrap = this.focusTrapFactory.create(overlayRef.overlayElement);
    // Returns a promise; auto-capture happens once the element is ready.
    void focusTrap.focusInitialElementWhenReady();

    // Dispose the trap and restore focus exactly once on close (idempotent).
    ref._onClose(() => {
      focusTrap.destroy();
      this.restoreFocus(previouslyFocused);
    });

    if (backdrop) {
      overlayRef.backdropClick().subscribe(() => {
        if (closeOnBackdrop) ref.close();
      });
    }
    overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape' && closeOnEscape) ref.close();
    });

    return ref;
  }

  /** The currently-focused element, or null when there is no DOM (SSR). */
  private activeElement(): HTMLElement | null {
    const active = this.document?.activeElement;
    return active instanceof HTMLElement ? active : null;
  }

  /** Restore focus to `target` if it is still connected and focusable. */
  private restoreFocus(target: HTMLElement | null): void {
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus();
    }
  }
}
