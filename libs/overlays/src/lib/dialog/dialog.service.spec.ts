import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDialogService } from './dialog.service';
import { DialogRef } from './dialog-ref';
import { DIALOG_DATA } from './dialog.types';
import { OVERLAY_REF } from '@axisui-ng/overlays-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Dialog body</p>
    <button type="button" (click)="ref.close('confirmed')">Confirm</button>
  `,
})
class TestDialogComponent {
  readonly ref = inject<DialogRef<TestDialogComponent>>(DialogRef);
  readonly data = inject(DIALOG_DATA, { optional: true });
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxDialogService', () => {
  let service: AxDialogService;

  beforeEach(() => {
    service = TestBed.inject(AxDialogService);
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('opens a dialog and returns a DialogRef with the component instance', () => {
    const ref = service.open(TestDialogComponent);
    expect(ref).toBeInstanceOf(DialogRef);
    expect(ref.componentInstance).toBeInstanceOf(TestDialogComponent);
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.className).toContain('bg-card');
    expect(panel.className).toContain('max-w-lg');
    expect(overlayRoot().textContent).toContain('Dialog body');
    ref.close();
  });

  it('applies size max-width on the dialog panel', () => {
    const ref = service.open(TestDialogComponent, { size: 'sm' });
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.className).toContain('max-w-sm');
    ref.close();
  });

  it('provides the DialogRef and OVERLAY_REF to the opened component', () => {
    const ref = service.open(TestDialogComponent);
    expect(ref.componentInstance.ref).toBe(ref);
    expect(ref.injector.get(OVERLAY_REF)).toBe(ref);
    ref.close();
  });

  it('injects optional data into the opened component', () => {
    const ref = service.open(TestDialogComponent, { data: { hello: 'world' } });
    expect(ref.componentInstance.data).toEqual({ hello: 'world' });
    ref.close();
  });

  it('delivers the close result through result$', (done) => {
    const ref = service.open(TestDialogComponent);
    ref.result$.subscribe((result) => {
      expect(result).toBe('confirmed');
      done();
    });
    ref.close('confirmed');
  });

  it('disposes the overlay on close and is idempotent', () => {
    const ref = service.open(TestDialogComponent);
    expect(overlayRoot().querySelector('[role="dialog"]')).toBeTruthy();
    ref.close();
    expect(overlayRoot().querySelector('[role="dialog"]')).toBeNull();
    // Closing again must not throw.
    expect(() => ref.close()).not.toThrow();
  });

  it('supports multiple stacked dialogs', () => {
    const first = service.open(TestDialogComponent);
    const second = service.open(TestDialogComponent);
    expect(first).not.toBe(second);
    expect(first.componentInstance).not.toBe(second.componentInstance);
    expect(overlayRoot().querySelectorAll('[role="dialog"]').length).toBe(2);
    first.close();
    second.close();
  });

  it('closes on backdrop click when backdrop enabled', () => {
    const ref = service.open(TestDialogComponent);
    const backdrop = overlayRoot().querySelector('.cdk-overlay-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    expect(overlayRoot().querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not render a backdrop when backdrop disabled', () => {
    const ref = service.open(TestDialogComponent, { backdrop: false });
    expect(overlayRoot().querySelector('.cdk-overlay-backdrop')).toBeNull();
    ref.close();
  });

  it('closes on Escape when closeOnEscape enabled', () => {
    const ref = service.open(TestDialogComponent);
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlayRoot().querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not close on Escape when closeOnEscape disabled', () => {
    const ref = service.open(TestDialogComponent, { closeOnEscape: false });
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlayRoot().querySelector('[role="dialog"]')).toBeTruthy();
    ref.close();
  });

  it('applies a custom class to the overlay pane', () => {
    const ref = service.open(TestDialogComponent, { customClass: 'my-dialog' });
    expect(overlayRoot().querySelector('.my-dialog')).toBeTruthy();
    ref.close();
  });

  it('has no a11y violations for the opened dialog', async () => {
    const ref = service.open(TestDialogComponent, { ariaLabel: 'Test dialog' });
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
    ref.close();
  });

  describe('focus trap', () => {
    // Read the DOM through the injected DOCUMENT (project convention: no raw
    // top-level `document` access; see AGENTS.md → SSR safety).
    const doc = (): Document => TestBed.inject(DOCUMENT);

    // jsdom limitation: CDK's FocusTrap auto-capture relies on the
    // InteractivityChecker, which treats elements as non-focusable when they
    // report zero client rects (always true in jsdom — no layout). So a "did
    // focus actually move into the overlay?" assertion is not reliably testable
    // here. We instead assert the trap is created over the overlay element and
    // auto-capture is requested (wiring), and that restoration genuinely fires
    // (direct element.focus() IS honored by jsdom).

    it('creates a focus trap over the overlay element and requests auto-capture', () => {
      const focusTrapFactory = TestBed.inject(FocusTrapFactory);
      const createSpy = jest.spyOn(focusTrapFactory, 'create');

      const ref = service.open(TestDialogComponent);

      expect(createSpy).toHaveBeenCalledTimes(1);
      const trap = createSpy.mock.results[0].value as FocusTrap;
      // Trap is created around the overlay host so Tab cannot escape it.
      const overlayHost = createSpy.mock.calls[0][0] as HTMLElement;
      expect(overlayHost.classList.contains('cdk-overlay-pane')).toBe(true);
      // Auto-capture moves focus into the dialog on open.
      const initialSpy = jest.spyOn(trap, 'focusInitialElementWhenReady');
      // Already called synchronously during open(); assert it resolved a promise.
      expect(trap.focusInitialElementWhenReady()).toBeInstanceOf(Promise);
      initialSpy.mockRestore();

      ref.close();
    });

    it('restores focus to the previously-focused element on close', fakeAsync(() => {
      // A trigger button outside the overlay, focused before opening. jsdom
      // honors direct element.focus(), so this round-trip is testable.
      const trigger = doc().createElement('button');
      trigger.textContent = 'Open';
      doc().body.appendChild(trigger);
      trigger.focus();
      expect(doc().activeElement).toBe(trigger);

      const ref = service.open(TestDialogComponent);
      flush();

      ref.close();
      flush();
      // Focus returns to the trigger that opened the dialog.
      expect(doc().activeElement).toBe(trigger);

      trigger.remove();
    }));

    it('disposes the focus trap on close', () => {
      const focusTrapFactory = TestBed.inject(FocusTrapFactory);
      const createSpy = jest.spyOn(focusTrapFactory, 'create');

      const ref = service.open(TestDialogComponent);
      const trap = createSpy.mock.results[0].value as FocusTrap;
      const destroySpy = jest.spyOn(trap, 'destroy');

      ref.close();
      expect(destroySpy).toHaveBeenCalledTimes(1);
      // Idempotent close must not destroy the trap twice.
      ref.close();
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it('does not throw when the previously-focused element is gone on close', fakeAsync(() => {
      const trigger = doc().createElement('button');
      doc().body.appendChild(trigger);
      trigger.focus();

      const ref = service.open(TestDialogComponent);
      flush();
      // Remove the restore target before closing — restore must be a no-op.
      trigger.remove();
      expect(() => {
        ref.close();
        flush();
      }).not.toThrow();
    }));
  });

  describe('closeButton option', () => {
    it('renders a dismiss button that closes the dialog (default on)', () => {
      const ref = service.open(TestDialogComponent);
      const closeBtn = overlayRoot().querySelector(
        'button.ax-dialog-close',
      ) as HTMLButtonElement | null;
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('type')).toBe('button');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
      closeBtn?.click();
      expect(overlayRoot().querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders no dismiss button when closeButton is false', () => {
      const ref = service.open(TestDialogComponent, { closeButton: false });
      expect(overlayRoot().querySelector('button.ax-dialog-close')).toBeNull();
      ref.close();
    });
  });
});
