import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import {
  defaultTrackBy,
  type ColDef,
  type SortState,
  type TrackByFunction,
} from './table.types';

/**
 * Table — client-side sortable / searchable / paginated data table.
 * All transforms (filter → sort → paginate) are computed signals; no manual
 * change detection.
 *
 * @example
 * <ax-table [columns]="cols" [data]="rows" [pageSize]="10" [searchable]="true" />
 */
@Component({
  selector: 'ax-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, AxIconComponent],
  host: { class: 'block' },
  template: `
    @if (searchable() || pageSize() > 0) {
      <div class="mb-3 flex items-center justify-between gap-2">
        @if (searchable()) {
          <input
            type="search"
            class="h-9 w-64 rounded-[var(--radius-field)] border border-input bg-background px-3 text-sm"
            placeholder="Search…"
            aria-label="Search table"
            [value]="query()"
            (input)="onSearch($event)"
          />
        }
        @if (pageSize() > 0) {
          <span class="text-sm text-muted-foreground">
            Page {{ page() + 1 }} / {{ pageCount() }} · {{ filtered().length }} rows
          </span>
        }
      </div>
    }

    <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      @if (caption()) {
        <caption class="sr-only">{{ caption() }}</caption>
      }
      <thead>
        <tr class="border-b border-border">
          @for (col of columns(); track col.key) {
            <th
              scope="col"
              class="h-[var(--height-row)] px-3 text-start font-medium text-muted-foreground"
              [class.text-end]="col.align === 'end'"
              [attr.aria-sort]="ariaSortFor(col)"
            >
              @if (col.sortable) {
                <button
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1 transition-colors duration-[var(--duration-fast)] ease-out-quart hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  (click)="toggleSort(col)"
                >
                  {{ col.header }}
                  @if (sort()?.key === col.key) {
                    <ax-icon [name]="sort()!.dir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="14" />
                  }
                </button>
              } @else {
                {{ col.header }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of paged(); track trackBy()($index, row)) {
          <tr
            class="cursor-pointer border-b border-border transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/50"
            (click)="rowClick.emit(row)"
          >
            @for (col of columns(); track col.key) {
              <td class="h-[var(--height-row)] px-3" [class.text-end]="col.align === 'end'">
                @if (col.cellTemplate) {
                  <ng-container
                    [ngTemplateOutlet]="col.cellTemplate"
                    [ngTemplateOutletContext]="{ $implicit: row, value: row[col.key] }"
                  />
                } @else {
                  {{ row[col.key] }}
                }
              </td>
            }
          </tr>
        }
        @if (paged().length === 0) {
          <tr>
            <td [attr.colspan]="columns().length" class="px-3 py-6 text-center text-muted-foreground">No data</td>
          </tr>
        }
      </tbody>
    </table>
    </div>

    @if (pageSize() > 0 && pageCount() > 1) {
      <div class="mt-3 flex items-center justify-end gap-1">
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="First page" [disabled]="page() === 0" (click)="first()">«</button>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Previous page" [disabled]="page() === 0" (click)="prev()">‹</button>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Next page" [disabled]="page() >= pageCount() - 1" (click)="next()">›</button>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Last page" [disabled]="page() >= pageCount() - 1" (click)="last()">»</button>
      </div>
    }
  `,
})
export class AxTableComponent<T extends Record<string, unknown>> {
  /** Column definitions. */
  columns = input.required<ColDef<T>[]>();
  /** Row data. */
  data = input.required<T[]>();
  /** Rows per page; 0 disables pagination. @default 10 */
  pageSize = input<number>(10);
  /** Show the search toolbar. @default false */
  searchable = input<boolean>(false);
  /** Accessible caption (visually hidden) naming the table for screen readers. @default '' */
  caption = input<string>('');
  /** Row trackBy. @default index */
  trackBy = input<TrackByFunction<T>>(defaultTrackBy);
  /** Emitted when a body row is clicked. */
  readonly rowClick = output<T>();

  protected readonly query = signal('');
  protected readonly sort = signal<SortState<T> | null>(null);
  protected readonly page = signal(0);

  /** data → search-filtered. */
  protected readonly filtered = computed<T[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.data();
    const searchableCols = this.columns().filter((c) => c.searchable !== false);
    return this.data().filter((row) =>
      searchableCols.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q))
    );
  });

  /** filtered → sorted. */
  protected readonly sorted = computed<T[]>(() => {
    const s = this.sort();
    if (!s) return this.filtered();
    const rows = [...this.filtered()];
    rows.sort((a, b) => {
      const av = a[s.key] as string | number;
      const bv = b[s.key] as string | number;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return s.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  });

  protected readonly pageCount = computed(() => {
    const size = this.pageSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(this.sorted().length / size));
  });

  /** sorted → current page slice. */
  protected readonly paged = computed<T[]>(() => {
    const size = this.pageSize();
    if (size <= 0) return this.sorted();
    const start = this.page() * size;
    return this.sorted().slice(start, start + size);
  });

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(0);
  }

  /** aria-sort for a header cell: only on sortable columns; 'none' unless it's the active sort. */
  protected ariaSortFor(col: ColDef<T>): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    const s = this.sort();
    if (s?.key !== col.key) return 'none';
    return s.dir === 'asc' ? 'ascending' : 'descending';
  }

  protected toggleSort(col: ColDef<T>): void {
    const current = this.sort();
    if (!current || current.key !== col.key) {
      this.sort.set({ key: col.key, dir: 'asc' });
    } else if (current.dir === 'asc') {
      this.sort.set({ key: col.key, dir: 'desc' });
    } else {
      this.sort.set(null); // third click resets
    }
    this.page.set(0);
  }

  protected first(): void {
    this.page.set(0);
  }
  protected prev(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }
  protected next(): void {
    this.page.update((p) => Math.min(this.pageCount() - 1, p + 1));
  }
  protected last(): void {
    this.page.set(this.pageCount() - 1);
  }
}
