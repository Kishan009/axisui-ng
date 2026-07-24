import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement, returnFocusToTrigger } from '@axisui-ng/overlays-core';
import { AxPopoverComponent } from './popover.component';

/**
 * Opens the referenced <ax-popover> in a connected overlay on click. Light-dismiss
 * on outside-click and Escape.
 *
 * @example <button [axPopoverTriggerFor]="p">Open</button>
 */
@Directive({
  selector: '[axPopoverTriggerFor]',
  host: {
    '(click)': 'toggle()',
    '[attr.aria-expanded]': 'popover().open()',
    '[attr.aria-haspopup]': '"true"',
  },
})
export class AxPopoverTriggerDirective {
  /** The popover to control. */
  readonly popover = input.required<AxPopoverComponent>({ alias: 'axPopoverTriggerFor' });

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  constructor() {
    effect(() => {
      if (this.popover().open()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  protected toggle(): void {
    this.popover().open.update((v) => !v);
  }

  private attach(): void {
    if (this.overlayRef) return;
    this.overlayRef = createConnectedOverlayRef(
      this.overlay,
      this.dir,
      this.host.nativeElement,
      normalizePlacement(this.popover().placement()),
    );
    this.overlayRef.attach(new TemplatePortal(this.popover().contentTemplate(), this.vcr));
    this.overlayRef.outsidePointerEvents().subscribe(() => this.popover().open.set(false));
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.popover().open.set(false);
    });
  }

  private detach(): void {
    if (this.overlayRef) {
      returnFocusToTrigger(this.overlayRef, this.host.nativeElement);
      animateOverlayClose(this.overlayRef);
    }
    this.overlayRef = null;
  }
}
