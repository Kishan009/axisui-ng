import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement, returnFocusToTrigger, type PlacementInput } from '@axisui-ng/overlays-core';
import { AxDropdownMenuComponent } from './dropdown-menu.component';

/**
 * Opens the referenced <ax-dropdown-menu> below the trigger on click.
 *
 * @example <button [axMenuTriggerFor]="menu">Open</button>
 */
@Directive({
  selector: '[axMenuTriggerFor]',
  host: {
    '(click)': 'toggle()',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'menu().open()',
  },
})
export class AxMenuTriggerDirective {
  readonly menu = input.required<AxDropdownMenuComponent>({ alias: 'axMenuTriggerFor' });
  /** Placement relative to the trigger. @default 'bottom-start' */
  readonly placement = input<PlacementInput>('bottom-start');

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  constructor() {
    effect(() => {
      if (this.menu().open()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  protected toggle(): void {
    this.menu().open.update((v) => !v);
  }

  private attach(): void {
    if (this.overlayRef) return;
    this.overlayRef = createConnectedOverlayRef(
      this.overlay,
      this.dir,
      this.host.nativeElement,
      normalizePlacement(this.placement()),
    );
    this.overlayRef.attach(new TemplatePortal(this.menu().contentTemplate(), this.vcr));
    // Ignore outside events on the trigger — (click) toggle owns open/close (avoids blink).
    this.overlayRef.outsidePointerEvents().subscribe((event) => {
      const target = event.target;
      if (target instanceof Node && this.host.nativeElement.contains(target)) return;
      this.menu().open.set(false);
    });
    queueMicrotask(() => this.menu().focusFirst());
  }

  private detach(): void {
    if (this.overlayRef) {
      returnFocusToTrigger(this.overlayRef, this.host.nativeElement);
      animateOverlayClose(this.overlayRef);
    }
    this.overlayRef = null;
  }
}
