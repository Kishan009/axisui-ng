import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';

import { type GridColumnDef, type SortState } from './grid-core';
import { type GridState } from './grid-state';

/** Editable list of the grid's active multi-sort, reflecting `GridState.sort`. */
@Component({
  selector: 'ax-data-grid-sort-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { class: 'block rounded-[var(--radius-field)] border border-border bg-popover p-3 text-sm' },
  template: `
    @let sorts = state().sort();
    @if (sorts.length === 0) {
      <p class="text-muted-foreground">No sorts</p>
    } @else {
      <ul class="flex flex-col gap-1">
        @for (s of sorts; track s.key; let i = $index) {
          <li [attr.data-sort-row]="s.key" class="flex items-center gap-2">
            <span class="grow">{{ headerFor(s.key) }}</span>
            <button type="button" data-dir class="inline-flex items-center rounded-[var(--radius-sm)] px-1 hover:bg-muted"
              [attr.aria-label]="'Toggle direction for ' + headerFor(s.key)" (click)="toggleDir(s)">
              <ax-icon [name]="s.dir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="14" />
            </button>
            <button type="button" data-up class="rounded-[var(--radius-sm)] px-1 hover:bg-muted disabled:opacity-50"
              aria-label="Move up" [disabled]="i === 0" (click)="state().reorderSort(i, i - 1)">↑</button>
            <button type="button" data-down class="rounded-[var(--radius-sm)] px-1 hover:bg-muted disabled:opacity-50"
              aria-label="Move down" [disabled]="i === sorts.length - 1" (click)="state().reorderSort(i, i + 1)">↓</button>
            <button type="button" data-remove class="rounded-[var(--radius-sm)] px-1 hover:bg-muted"
              [attr.aria-label]="'Remove sort ' + headerFor(s.key)" (click)="state().removeSort(s.key)">✕</button>
          </li>
        }
      </ul>
    }
  `,
})
export class AxDataGridSortPanelComponent<T extends Record<string, unknown>> {
  readonly state = input.required<GridState<T>>();
  readonly columns = input.required<GridColumnDef<T>[]>();

  private readonly headerMap = computed(() => {
    const map = new Map<keyof T, string>();
    for (const c of this.columns()) map.set(c.key, c.header);
    return map;
  });

  protected headerFor(key: keyof T): string {
    return this.headerMap().get(key) ?? String(key);
  }

  protected toggleDir(s: SortState<T>): void {
    this.state().setSortDir(s.key, s.dir === 'asc' ? 'desc' : 'asc');
  }
}
