import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, OnDestroy, ViewContainerRef, inject, input } from '@angular/core';

import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement } from '@axisui-ng/overlays-core';
import { AxHoverCardComponent } from './hover-card.component';

/**
 * Opens the referenced <ax-hover-card> on hover/focus after a delay.
 *
 * @example <a [axHoverCardFor]="h">@user</a>
 */
@Directive({
  selector: '[axHoverCardFor]',
  host: {
    '(mouseenter)': 'scheduleOpen()',
    '(mouseleave)': 'scheduleClose()',
    '(focus)': 'scheduleOpen()',
    '(blur)': 'scheduleClose()',
  },
})
export class AxHoverCardTriggerDirective implements OnDestroy {
  readonly card = input.required<AxHoverCardComponent>({ alias: 'axHoverCardFor' });
  /** Override the card's open delay (ms). @default 300 */
  readonly openDelay = input<number>(300);
  /** Override the card's close delay (ms). @default 150 */
  readonly closeDelay = input<number>(150);

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected scheduleOpen(): void {
    this.clear();
    if (this.openDelay() === 0) {
      this.attach();
      return;
    }
    this.timer = setTimeout(() => this.attach(), this.openDelay());
  }

  protected scheduleClose(): void {
    this.clear();
    if (this.closeDelay() === 0) {
      this.detach();
      return;
    }
    this.timer = setTimeout(() => this.detach(), this.closeDelay());
  }

  private attach(): void {
    if (this.overlayRef) return;
    this.overlayRef = createConnectedOverlayRef(
      this.overlay,
      this.dir,
      this.host.nativeElement,
      normalizePlacement(this.card().placement()),
    );
    this.overlayRef.attach(new TemplatePortal(this.card().contentTemplate(), this.vcr));
    this.card().open.set(true);
    // Keep open while the pointer is over the card itself.
    this.overlayRef.overlayElement.addEventListener('mouseenter', () => this.clear());
    this.overlayRef.overlayElement.addEventListener('mouseleave', () => this.scheduleClose());
  }

  private detach(): void {
    this.card().open.set(false);
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }

  private clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  ngOnDestroy(): void {
    this.clear();
    this.card().open.set(false);
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
