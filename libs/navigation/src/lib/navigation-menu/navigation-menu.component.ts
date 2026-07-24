import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { NAV_MENU_CONTEXT, type NavMenuContext } from './navigation-menu.types';
import { AxNavigationMenuItemComponent } from './navigation-menu-item.component';

/**
 * NavigationMenu — a horizontal nav whose items open rich mega-menu panels.
 * One item open at a time.
 *
 * An animated highlight backdrop (a sliding/resizing pill) sits behind the
 * currently-active trigger — the hovered item, falling back to the open item —
 * and smoothly animates to the new position/size as the active item changes via
 * hover or keyboard. The backdrop is purely decorative (`aria-hidden`).
 *
 * Customization (CSS variables, set on the host or an ancestor):
 * - `--navigation-menu-backdrop-color` — backdrop fill (default: theme accent).
 * - `--navigation-menu-animation-duration` — transition duration (default: `200ms`;
 *   set to `0ms` to disable the animation).
 * - `--navigation-menu-animation-easing` — transition easing (default: `ease-out`).
 *
 * Honors `prefers-reduced-motion: reduce` (transition disabled).
 */
@Component({
  selector: 'ax-navigation-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', class: 'relative inline-flex items-center gap-1', '(mouseleave)': 'setHovered(null)' },
  template: `
    <div #backdrop class="ax-navigation-menu-backdrop" aria-hidden="true" [attr.data-active]="activeValue()"></div>
    <ng-content select="ax-navigation-menu-item" />
  `,
  styles: [
    `
      .ax-navigation-menu-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: var(--radius-sm, 0.375rem);
        background-color: var(--navigation-menu-backdrop-color, var(--color-accent, oklch(0 0 0 / 0.06)));
        transition:
          transform var(--navigation-menu-animation-duration, 200ms) var(--navigation-menu-animation-easing, ease-out),
          width var(--navigation-menu-animation-duration, 200ms) var(--navigation-menu-animation-easing, ease-out),
          height var(--navigation-menu-animation-duration, 200ms) var(--navigation-menu-animation-easing, ease-out),
          opacity var(--navigation-menu-animation-duration, 200ms) var(--navigation-menu-animation-easing, ease-out);
        pointer-events: none;
        /* Triggers use relative z-[1] so labels stay above this pill. */
        z-index: 0;
        opacity: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .ax-navigation-menu-backdrop {
          transition: none;
        }
      }
    `,
  ],
  providers: [{ provide: NAV_MENU_CONTEXT, useExisting: forwardRef(() => AxNavigationMenuComponent) }],
})
export class AxNavigationMenuComponent implements NavMenuContext {
  /** The value of the currently-open item, or null. @default null */
  readonly value = model<string | null>(null);
  readonly openValue = this.value.asReadonly();

  private readonly hovered = signal<string | null>(null);
  readonly hoveredValue = this.hovered.asReadonly();

  /** Active item the backdrop follows: hovered, falling back to open. */
  protected readonly activeValue = computed(() => this.hoveredValue() ?? this.openValue());

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly items = contentChildren(AxNavigationMenuItemComponent);
  private readonly backdrop = viewChild<ElementRef<HTMLElement>>('backdrop');

  constructor() {
    // Reposition whenever the active item (or the set of items) changes.
    effect(() => {
      this.activeValue();
      this.items();
      if (this.isBrowser) this.positionBackdrop();
    });

    // Re-measure on layout changes once the view exists (browser only).
    afterNextRender(() => {
      this.positionBackdrop();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.positionBackdrop());
      observer.observe(this.el.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  setOpen(value: string | null): void {
    this.value.set(value);
  }

  setHovered(value: string | null): void {
    this.hovered.set(value);
  }

  private positionBackdrop(): void {
    const backdrop = this.backdrop()?.nativeElement;
    if (!backdrop) return;

    const active = this.activeValue();
    const item = active ? this.items().find((i) => i.value() === active) : undefined;
    const trigger = item?.getTriggerElement() ?? null;

    if (!trigger) {
      this.renderer.setStyle(backdrop, 'opacity', '0');
      return;
    }

    const navRect = this.el.nativeElement.getBoundingClientRect();
    const r = trigger.getBoundingClientRect();
    const left = r.left - navRect.left;
    const top = r.top - navRect.top;

    this.renderer.setStyle(backdrop, 'transform', `translate(${left}px, ${top}px)`);
    this.renderer.setStyle(backdrop, 'width', `${r.width}px`);
    this.renderer.setStyle(backdrop, 'height', `${r.height}px`);
    this.renderer.setStyle(backdrop, 'opacity', '1');
  }
}
