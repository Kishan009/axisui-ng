import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement, type PlacementInput } from '@axisui-ng/overlays-core';
import { AxTooltipPanelComponent } from './tooltip-panel.component';

/**
 * Tooltip — shows a small text panel on hover and focus.
 *
 * @example <button [axTooltip]="'Save'" axTooltipPlacement="top">Save</button>
 */
@Directive({
  selector: '[axTooltip]',
  host: {
    '(mouseenter)': 'scheduleShow()',
    '(mouseleave)': 'scheduleHide()',
    '(focus)': 'scheduleShow()',
    '(blur)': 'scheduleHide()',
    '(keydown.escape)': 'hide()',
  },
})
export class AxTooltipDirective implements OnDestroy {
  /** Tooltip text. Empty = disabled. */
  axTooltip = input<string>('');
  /** Placement relative to the trigger. @default 'top' */
  axTooltipPlacement = input<PlacementInput>('top');
  /** Delay before showing (ms). @default 300 */
  showDelay = input<number>(300);
  /** Delay before hiding (ms). @default 100 */
  hideDelay = input<number>(100);
  /** Force-disable. @default false */
  disabled = input<boolean>(false);

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly host = inject(ElementRef<HTMLElement>);

  private overlayRef: OverlayRef | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  protected scheduleShow(): void {
    if (this.disabled() || !this.axTooltip()) return;
    this.clearTimers();
    if (this.showDelay() === 0) {
      this.show();
      return;
    }
    this.showTimer = setTimeout(() => this.show(), this.showDelay());
  }

  protected scheduleHide(): void {
    this.clearTimers();
    if (this.hideDelay() === 0) {
      this.hide();
      return;
    }
    this.hideTimer = setTimeout(() => this.hide(), this.hideDelay());
  }

  private show(): void {
    if (this.overlayRef) return;
    this.overlayRef = createConnectedOverlayRef(
      this.overlay,
      this.dir,
      this.host.nativeElement,
      normalizePlacement(this.axTooltipPlacement()),
    );
    const ref = this.overlayRef.attach(new ComponentPortal(AxTooltipPanelComponent));
    ref.setInput('text', this.axTooltip());
    this.host.nativeElement.setAttribute('aria-describedby', this.overlayRef.overlayElement.id);
  }

  protected hide(): void {
    this.clearTimers();
    this.host.nativeElement.removeAttribute('aria-describedby');
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }

  private clearTimers(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.showTimer = this.hideTimer = null;
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.host.nativeElement.removeAttribute('aria-describedby');
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
