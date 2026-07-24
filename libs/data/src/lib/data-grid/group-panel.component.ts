import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { type GridColumnDef } from './grid-core';

/** Toolbar chips for the active group-by columns (add / remove / reorder). */
@Component({
  selector: 'ax-data-grid-group-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex flex-wrap items-center gap-1' },
  template: `
    <span class="text-xs text-muted-foreground">Group by:</span>
    @for (key of groupBy(); track key; let i = $index) {
      <span data-group-chip class="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-muted px-2 py-0.5 text-xs">
        {{ headerFor(key) }}
        <button type="button" data-left class="hover:text-foreground disabled:opacity-40" aria-label="Move left" [disabled]="i === 0" (click)="move(i, i - 1)">‹</button>
        <button type="button" data-right class="hover:text-foreground disabled:opacity-40" aria-label="Move right" [disabled]="i === groupBy().length - 1" (click)="move(i, i + 1)">›</button>
        <button type="button" data-remove class="hover:text-foreground" [attr.aria-label]="'Remove group ' + headerFor(key)" (click)="remove(i)">✕</button>
      </span>
    }
    @if (available().length > 0) {
      <select data-add-group aria-label="Group by column" class="h-7 rounded-[var(--radius-sm)] border border-input bg-background px-1 text-xs" [value]="''" (change)="add($event)">
        <option value="" disabled>Group by…</option>
        @for (col of available(); track col.key) {
          <option [value]="asKey(col.key)">{{ col.header }}</option>
        }
      </select>
    }
  `,
})
export class AxDataGridGroupPanelComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<GridColumnDef<T>[]>();
  readonly groupBy = model<(keyof T)[]>([]);

  private readonly headerMap = computed(() => {
    const m = new Map<keyof T, string>();
    for (const c of this.columns()) m.set(c.key, c.header);
    return m;
  });
  protected readonly available = computed(() => {
    const active = new Set(this.groupBy());
    return this.columns().filter((c) => !active.has(c.key));
  });

  protected headerFor(key: keyof T): string { return this.headerMap().get(key) ?? String(key); }
  protected asKey(key: keyof T): string { return String(key); }

  protected add(e: Event): void {
    const key = (e.target as HTMLSelectElement).value as unknown as keyof T;
    if (key) this.groupBy.set([...this.groupBy(), key]);
  }
  protected remove(i: number): void {
    this.groupBy.set(this.groupBy().filter((_, k) => k !== i));
  }
  protected move(from: number, to: number): void {
    const next = this.groupBy().slice();
    if (to < 0 || to >= next.length) return;
    const [m] = next.splice(from, 1);
    if (m !== undefined) next.splice(to, 0, m);
    this.groupBy.set(next);
  }
}
