import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { collapse, expand, normalizeSizes, resize, snapThreshold } from './splitter-core';
import {
  SPLITTER_CONTEXT,
  type SplitterContext,
  type SplitterOrientation,
  type SplitterPanelRef,
} from './splitter.types';
import { AxSplitterHandleComponent } from './splitter-handle.component';
import { AxSplitterPanelComponent } from './splitter-panel.component';

/**
 * Resizable split-pane container. Lays its panels along the main axis (flex),
 * sizing each by flex-grow = its percentage (applied via Renderer2 — the allowed
 * escape hatch; no [style.*]). Gutters are auto-rendered by panels by default, or
 * placed explicitly via <ax-splitter-handle> when [autoGutters]="false".
 */
@Component({
  selector: 'ax-splitter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    role: 'group',
    class: 'flex h-full w-full overflow-hidden',
    '[class.flex-row]': "orientation() === 'horizontal'",
    '[class.flex-col]': "orientation() === 'vertical'",
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  providers: [{ provide: SPLITTER_CONTEXT, useExisting: AxSplitterComponent }],
})
export class AxSplitterComponent implements SplitterContext {
  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly autoGutters = input(true, { transform: booleanAttribute });
  readonly gutterSize = input(4);
  readonly step = input(10);
  readonly storeKey = input('');
  readonly ariaLabel = input('');
  readonly sizes = model<number[]>([]);

  private readonly panelQuery = contentChildren(AxSplitterPanelComponent);
  private readonly handleQuery = contentChildren(AxSplitterHandleComponent);

  readonly panels = computed<readonly SplitterPanelRef[]>(() => this.panelQuery());
  readonly count = computed(() => this.panels().length);
  readonly mins = computed(() => this.panels().map((p) => p.minSize()));
  readonly maxes = computed(() => this.panels().map((p) => p.maxSize()));
  /** Drag-time lower bounds: a collapsible panel may shrink to its collapsedSize (snaps on release). */
  private readonly dragMins = computed(() =>
    this.panels().map((p) => (p.collapsible() ? Math.min(p.collapsedSize(), p.minSize()) : p.minSize())),
  );

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly restored = signal(false);
  private readonly lastExpanded = new Map<number, number>();

  /** Sizes actually applied: the model when it matches the panel count, else a normalized seed. */
  readonly effectiveSizes = computed(() => {
    const c = this.count();
    const s = this.sizes();
    if (c > 0 && s.length === c) return s;
    return normalizeSizes(
      this.panels().map((p) => p.size()),
      c,
      this.mins(),
      this.maxes(),
    );
  });

  constructor() {
    effect(() => {
      const sizes = this.effectiveSizes();
      this.panels().forEach((p, i) => this.renderer.setStyle(p.element, 'flex-grow', String(sizes[i] ?? 0)));
    });

    effect(() => {
      const key = this.storeKey();
      const sizes = this.effectiveSizes();
      if (key && this.restored()) this.persist(key, sizes);
    });

    afterNextRender(() => {
      const key = this.storeKey();
      if (key) {
        const stored = this.readStored(key);
        if (stored && stored.length === this.count()) this.sizes.set(stored);
      }
      this.restored.set(true);
    });
  }

  indexOf(panel: SplitterPanelRef): number {
    return this.panels().indexOf(panel);
  }
  isLast(panel: SplitterPanelRef): boolean {
    const ps = this.panels();
    return ps.length > 0 && ps[ps.length - 1] === panel;
  }
  handleIndex(handle: unknown): number {
    return this.handleQuery().findIndex((h) => h === handle);
  }

  resizeBoundary(b: number, deltaPx: number): void {
    const full = this.orientation() === 'horizontal' ? this.host.clientWidth : this.host.clientHeight;
    // Manual-mode handles are separate flex items; subtract their px from the grow space.
    const main = this.autoGutters() ? full : full - this.handleQuery().length * this.gutterSize();
    if (main <= 0) return;
    this.commit(resize(this.effectiveSizes(), b, (deltaPx / main) * 100, this.dragMins(), this.maxes()));
  }

  endResize(b: number): void {
    const sizes = this.effectiveSizes();
    const ps = this.panels();
    for (const idx of [b, b + 1]) {
      const p = ps[idx];
      if (!p?.collapsible()) continue;
      const size = sizes[idx] ?? 0;
      const snapped = snapThreshold(size, p.collapsedSize(), p.minSize());
      if (snapped !== size) {
        const delta = idx === b ? snapped - size : size - snapped;
        this.commit(resize(this.effectiveSizes(), b, delta, this.dragMins(), this.maxes()));
        return;
      }
    }
  }

  nudgeBoundary(b: number, dir: -1 | 1): void {
    this.commit(resize(this.effectiveSizes(), b, dir * this.step(), this.mins(), this.maxes()));
  }

  extendBoundary(b: number, to: 'min' | 'max'): void {
    const cur = this.effectiveSizes()[b] ?? 0;
    const target = to === 'min' ? this.mins()[b] ?? 0 : this.maxes()[b] ?? 100;
    this.commit(resize(this.effectiveSizes(), b, target - cur, this.mins(), this.maxes()));
  }

  toggleBoundaryCollapse(b: number): void {
    const idx = this.pickCollapsible(b);
    if (idx < 0) return;
    const panel = this.panels()[idx]!;
    const collapsedSize = panel.collapsedSize();
    const cur = this.effectiveSizes()[idx] ?? 0;
    if (cur > collapsedSize) {
      this.lastExpanded.set(idx, cur);
      this.commit(collapse(this.effectiveSizes(), idx, collapsedSize));
    } else {
      const restore = this.lastExpanded.get(idx) ?? this.maxes()[idx] ?? 50;
      this.commit(expand(this.effectiveSizes(), idx, restore));
    }
  }

  /** Collapsible panel adjacent to boundary b — prefer the left panel. */
  private pickCollapsible(b: number): number {
    const ps = this.panels();
    if (ps[b]?.collapsible()) return b;
    if (ps[b + 1]?.collapsible()) return b + 1;
    return -1;
  }

  private commit(next: number[]): void {
    this.sizes.set(next);
  }

  private persist(key: string, sizes: number[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(key, JSON.stringify(sizes));
    } catch {
      /* storage disabled / quota exceeded — ignore */
    }
  }

  private readStored(key: string): number[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')) return parsed;
    } catch {
      /* corrupt JSON — ignore */
    }
    return null;
  }
}
