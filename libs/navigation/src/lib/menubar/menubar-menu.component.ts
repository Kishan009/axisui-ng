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
import { outputToObservable } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';

import { AxDropdownMenuComponent, animateOverlayClose, createConnectedOverlayRef, normalizePlacement } from '@axisui-ng/overlays';
import { cn } from '../_utils/cn';
import { MENUBAR_CONTEXT } from './menubar.types';

let _seq = 0;

/**
 * MenubarMenu — one top-level menu. Projects a <ax-dropdown-menu> whose content
 * opens in a connected overlay below the trigger. display:contents so the
 * trigger button is the menubar's effective menuitem child.
 */
@Component({
  selector: 'ax-menubar-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      type="button"
      role="menuitem"
      [class]="triggerClasses()"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-haspopup]="'menu'"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
    >
      {{ label() }}
    </button>
    <ng-content select="ax-dropdown-menu" />
  `,
})
export class AxMenubarMenuComponent {
  /** The menu's button label. */
  readonly label = input.required<string>();

  private readonly id = `menubar-menu-${_seq++}`;
  private readonly ctx = inject(MENUBAR_CONTEXT);
  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly menu = contentChild.required(AxDropdownMenuComponent);
  private overlayRef: OverlayRef | null = null;
  private closedSub: Subscription | null = null;

  readonly isOpen = computed(() => this.ctx.openId() === this.id);

  protected readonly triggerClasses = computed(() =>
    cn(
      'cursor-pointer rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium outline-none',
      'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      this.isOpen() ? 'bg-accent text-accent-foreground' : '',
    ),
  );

  constructor() {
    this.ctx.register(this.id);
    effect(() => {
      if (this.isOpen()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  protected toggle(): void {
    this.ctx.setOpen(this.isOpen() ? null : this.id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.ctx.focusByOffset(this.id, 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.ctx.focusByOffset(this.id, -1);
    } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      this.ctx.setOpen(this.id);
    } else if (event.key === 'Escape') {
      this.ctx.setOpen(null);
    }
  }

  private attach(): void {
    if (this.overlayRef) return;
    const trigger = (this.hostRef.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
    this.overlayRef = createConnectedOverlayRef(this.overlay, this.dir, trigger, normalizePlacement('bottom-start'));
    this.overlayRef.attach(new TemplatePortal(this.menu().contentTemplate(), this.vcr));
    // Trigger is outside the overlay pane. Without this guard, the same click that
    // toggles closed is also seen as an outside pointer → close then toggle re-opens
    // (visible blink). Let the trigger's (click)="toggle()" own that interaction.
    this.overlayRef.outsidePointerEvents().subscribe((event) => {
      const target = event.target;
      if (target instanceof Node && trigger.contains(target)) return;
      this.ctx.setOpen(null);
    });
    // Selecting an item closes the projected dropdown (close()): reset the
    // menubar so this menu collapses and the next trigger opens fresh.
    this.closedSub = outputToObservable(this.menu().closed).subscribe(() => this.ctx.setOpen(null));
    queueMicrotask(() => this.menu().focusFirst());
  }

  private detach(): void {
    this.closedSub?.unsubscribe();
    this.closedSub = null;
    // Animate the exit (the attached dropdown panel carries the data-ax-overlay
    // contract) instead of disposing instantly.
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }
}
