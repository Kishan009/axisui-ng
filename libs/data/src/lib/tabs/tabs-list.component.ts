import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { TABS_CONTEXT } from './tabs.types';

/**
 * TabsList — the tablist row. Handles ←/→/Home/End roving focus across triggers,
 * and renders the sliding active-tab indicator (measured from the selected tab).
 */
@Component({
  selector: 'ax-tabs-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tablist',
    class: 'relative inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-muted p-1',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <span
      aria-hidden="true"
      class="pointer-events-none absolute top-1 bottom-1 start-0 z-0 rounded-[var(--radius-sm)] bg-background shadow-sm transition-[transform,width] duration-[var(--duration)] ease-out-expo"
      [style]="thumbStyle()"
    ></span>
    <ng-content select="ax-tab-trigger" />
  `,
})
export class AxTabsListComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly ctx = inject(TABS_CONTEXT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Sliding-indicator geometry, measured from the active tab (browser-only). */
  protected readonly thumb = signal<{ x: number; w: number } | null>(null);
  protected readonly thumbStyle = computed<Record<string, string>>(() => {
    const t = this.thumb();
    return t ? { transform: `translateX(${t.x}px)`, width: `${t.w}px`, opacity: '1' } : { opacity: '0' };
  });

  constructor() {
    // Re-measure the indicator whenever the active tab changes.
    effect(() => {
      this.ctx.value();
      afterNextRender(() => this.measure(), { injector: this.injector });
    });
    // Keep it aligned when the tablist is resized.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => this.measure());
      ro.observe(this.hostRef.nativeElement);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  /** Measure the active tab and position the sliding indicator (RTL-aware). */
  private measure(): void {
    const host = this.hostRef.nativeElement;
    const active = host.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement | null;
    if (!active) {
      this.thumb.set(null);
      return;
    }
    const rtl = getComputedStyle(host).direction === 'rtl';
    const x = rtl ? -(host.clientWidth - active.offsetLeft - active.offsetWidth) : active.offsetLeft;
    this.thumb.set({ x, w: active.offsetWidth });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const root = this.hostRef.nativeElement;
    const tabs = Array.from(root.querySelectorAll('[role="tab"]:not([disabled])')) as HTMLElement[];
    if (tabs.length === 0) return;
    const current = tabs.indexOf(this.doc.activeElement as HTMLElement);
    let next = current;
    switch (event.key) {
      case 'ArrowLeft':
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case 'ArrowRight':
        next = (current + 1) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
    }
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }
}
