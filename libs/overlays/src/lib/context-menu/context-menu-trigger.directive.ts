import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { animateOverlayClose, returnFocusToTrigger } from '@axisui-ng/overlays-core';
import { AxDropdownMenuComponent } from '@axisui-ng/overlays/menu';

/**
 * Opens the referenced <ax-dropdown-menu> at the pointer on right-click, or via
 * the keyboard (Shift+F10 / the ContextMenu key) anchored to the focused element.
 *
 * @example <div [axContextMenuTriggerFor]="menu">…</div>
 */
@Directive({
  selector: '[axContextMenuTriggerFor]',
  host: {
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AxContextMenuTriggerDirective {
  readonly menu = input.required<AxDropdownMenuComponent>({ alias: 'axContextMenuTriggerFor' });

  private readonly overlay = inject(Overlay);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;
  private point = { x: 0, y: 0 };

  constructor() {
    effect(() => {
      if (this.menu().open()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
  }

  /**
   * Keyboard equivalent of right-click (WCAG 2.1.1): Shift+F10 or the dedicated
   * ContextMenu key opens the menu anchored to the focused element's box.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      const anchor = (event.target as HTMLElement | null) ?? this.host.nativeElement;
      const rect = anchor.getBoundingClientRect();
      this.openAt(rect.left, rect.bottom);
    }
  }

  private openAt(x: number, y: number): void {
    this.point = { x, y };
    // Re-open at the new point if already open — dispose instantly (no exit
    // animation) so the menu jumps straight to the new position.
    if (this.menu().open()) {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    }
    this.menu().open.set(true);
  }

  private attach(): void {
    if (this.overlayRef) return;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: this.point.x, y: this.point.y })
      .withPositions([{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' }]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    this.overlayRef.attach(new TemplatePortal(this.menu().contentTemplate(), this.vcr));
    this.overlayRef.outsidePointerEvents().subscribe(() => this.menu().open.set(false));
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
