import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { pinnedSideOf, toggleHidden, togglePin, type ColumnState, type PinSide } from './column-model';
import { type GridColumnDef } from './grid-core';

/** Column chooser: a checkbox per column toggling visibility in `columnState`. */
@Component({
  selector: 'ax-data-grid-column-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-[var(--radius-field)] border border-border bg-popover p-3 text-sm' },
  template: `
    <ul class="flex flex-col gap-1">
      @for (col of columns(); track colKey(col)) {
        <li class="flex items-center gap-2">
          <input
            type="checkbox"
            [attr.data-col-toggle]="colKey(col)"
            [checked]="!isHidden(colKey(col))"
            [disabled]="isHidden(colKey(col)) ? false : visibleCount() <= 1"
            [attr.aria-label]="'Toggle ' + col.header"
            (change)="toggle(colKey(col))"
          />
          <span>{{ col.header }}</span>
          <span class="ms-auto inline-flex gap-1">
            <button type="button" [attr.data-pin-start]="colKey(col)" class="rounded-[var(--radius-sm)] px-1 text-xs hover:bg-muted"
              [attr.aria-pressed]="sideOf(col) === 'start'" [class.bg-muted]="sideOf(col) === 'start'" aria-label="Pin start" (click)="pin(colKey(col), 'start')">⇤</button>
            <button type="button" [attr.data-pin-end]="colKey(col)" class="rounded-[var(--radius-sm)] px-1 text-xs hover:bg-muted"
              [attr.aria-pressed]="sideOf(col) === 'end'" [class.bg-muted]="sideOf(col) === 'end'" aria-label="Pin end" (click)="pin(colKey(col), 'end')">⇥</button>
          </span>
        </li>
      }
    </ul>
  `,
})
export class AxDataGridColumnPanelComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<GridColumnDef<T>[]>();
  readonly columnState = model<ColumnState>({ order: [], hidden: [] });

  private readonly hiddenSet = computed(() => new Set(this.columnState().hidden));
  protected readonly visibleCount = computed(() => this.columns().length - this.hiddenSet().size);

  protected colKey(col: GridColumnDef<T>): string {
    return String(col.key);
  }
  protected isHidden(key: string): boolean {
    return this.hiddenSet().has(key);
  }

  protected toggle(key: string): void {
    this.columnState.set({ ...this.columnState(), hidden: toggleHidden(this.columnState().hidden, key) });
  }

  protected sideOf(col: GridColumnDef<T>): PinSide | undefined {
    return pinnedSideOf(col, this.columnState());
  }
  protected pin(key: string, side: PinSide): void {
    this.columnState.set({ ...this.columnState(), pinned: togglePin(this.columnState().pinned, key, side) });
  }
}
