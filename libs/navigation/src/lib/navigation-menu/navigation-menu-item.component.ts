import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewContainerRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
} from '@angular/core';

import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement } from '@axisui-ng/overlays';
import { cn } from '../_utils/cn';
import { NAV_MENU_CONTEXT } from './navigation-menu.types';
import { AxNavigationMenuContentComponent } from './navigation-menu-content.component';

/** A NavigationMenu item: a trigger that opens its projected content panel. */
@Component({
  selector: 'ax-navigation-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [class]="triggerClasses()"
      [attr.aria-expanded]="isOpen()"
      (click)="toggle()"
      (mouseenter)="onEnter()"
      (focus)="onEnter()"
    >
      {{ label() }}
    </button>
    <ng-content select="ax-navigation-menu-content" />
  `,
})
export class AxNavigationMenuItemComponent {
  /** Unique value identifying this item. */
  readonly value = input.required<string>();
  /** Trigger label. @default '' */
  readonly label = input<string>('');

  protected readonly ctx = inject(NAV_MENU_CONTEXT);
  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly content = contentChild.required(AxNavigationMenuContentComponent);
  private overlayRef: OverlayRef | null = null;

  readonly isOpen = computed(() => this.ctx.openValue() === this.value());

  protected readonly triggerClasses = computed(() =>
    cn(
      // relative z-[1]: keep label above the sliding backdrop (nav paints backdrop behind).
      'relative z-[1] cursor-pointer rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium outline-none',
      'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
      // Backdrop owns the hover/open fill — do not paint a second accent bg on the trigger.
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ),
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  /** The trigger `<button>` element, used by the backdrop for geometry. */
  getTriggerElement(): HTMLElement | null {
    return (this.hostRef.nativeElement as HTMLElement).querySelector('button');
  }

  protected toggle(): void {
    this.ctx.setOpen(this.isOpen() ? null : this.value());
  }
  /** Hover/focus opens (and switches) the panel — no prior click required. */
  protected onEnter(): void {
    this.ctx.setHovered(this.value());
    this.ctx.setOpen(this.value());
  }

  private attach(): void {
    if (this.overlayRef) return;
    const trigger = (this.hostRef.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
    this.overlayRef = createConnectedOverlayRef(this.overlay, this.dir, trigger, normalizePlacement('bottom-start'));
    this.overlayRef.attach(new TemplatePortal(this.content().contentTemplate(), this.vcr));
    this.overlayRef.outsidePointerEvents().subscribe((event) => {
      const target = event.target;
      if (target instanceof Node && trigger.contains(target)) return;
      this.ctx.setOpen(null);
    });
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.ctx.setOpen(null);
    });
  }

  private detach(): void {
    // Animate the panel out (data-ax-overlay contract) rather than disposing instantly.
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }
}
