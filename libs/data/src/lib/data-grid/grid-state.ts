import { signal } from '@angular/core';
import { type RowId, type SortDir, type SortState } from './grid-core';
import { type FilterGroup } from './filter-model';
import { setEditEntry, clearEditEntry, clearSavedEntries, type CellEdit } from './edit-core';
import { emptyHistory, pushDelta, pushBatch, undo, redo, type EditDelta, type EditHistory } from './history-core';

/** Signals-based view-state store for ax-data-grid. Selection is owned by the component. */
export class GridState<T extends Record<string, unknown>> {
  readonly search = signal('');
  readonly columnFilters = signal<Record<string, string>>({});
  readonly sort = signal<SortState<T>[]>([]);
  readonly filterModel = signal<FilterGroup<T> | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly widths = signal<Record<string, number>>({});
  /** Collapsed group ids (inverted — absent ⇒ expanded, so new groups default open). */
  readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
  /** Expanded row ids (tree-data + master-detail). Multiple open; absent ⇒ collapsed. */
  readonly expandedRows = signal<ReadonlySet<RowId>>(new Set());
  readonly edits = signal<ReadonlyMap<string, CellEdit>>(new Map());
  readonly history = signal<EditHistory>(emptyHistory);

  /**
   * Cycle a column's sort. Plain click (`additive=false`) keeps a single 3-state sort
   * (asc -> desc -> none). Shift click (`additive=true`) appends/cycles this column while
   * preserving the others.
   */
  toggleSort(key: keyof T, additive = false): void {
    const current = this.sort();
    const idx = current.findIndex((s) => s.key === key);
    if (!additive) {
      const only = current.length === 1 ? current[0] : undefined;
      if (only && only.key === key) {
        this.sort.set(only.dir === 'asc' ? [{ key, dir: 'desc' }] : []);
      } else {
        this.sort.set([{ key, dir: 'asc' }]);
      }
    } else if (idx === -1) {
      this.sort.set([...current, { key, dir: 'asc' }]);
    } else {
      const cur = current[idx];
      const next = current.slice();
      if (cur && cur.dir === 'asc') next[idx] = { key, dir: 'desc' };
      else next.splice(idx, 1);
      this.sort.set(next);
    }
    this.page.set(0);
  }

  removeSort(key: keyof T): void {
    this.sort.update((s) => s.filter((x) => x.key !== key));
    this.page.set(0);
  }

  setSortDir(key: keyof T, dir: SortDir): void {
    this.sort.update((s) => s.map((x) => (x.key === key ? { key, dir } : x)));
    this.page.set(0);
  }

  /** Replaces the sort with a single-column entry (used by the column header menu). */
  setColumnSort(key: keyof T, dir: SortDir): void {
    this.sort.set([{ key, dir }]);
    this.page.set(0);
  }

  reorderSort(from: number, to: number): void {
    this.sort.update((s) => {
      if (from < 0 || from >= s.length || to < 0 || to >= s.length) return s;
      const next = s.slice();
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
    this.page.set(0);
  }

  setFilterModel(model: FilterGroup<T> | null): void {
    this.filterModel.set(model);
    this.page.set(0);
  }

  clearFilterModel(): void {
    this.filterModel.set(null);
    this.page.set(0);
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }

  setColumnFilter(key: string, value: string): void {
    this.columnFilters.update((f) => ({ ...f, [key]: value }));
    this.page.set(0);
  }

  setWidth(key: string, px: number): void {
    this.widths.update((w) => ({ ...w, [key]: px }));
  }

  clearWidth(key: string): void {
    this.widths.update((w) => {
      if (!(key in w)) return w;
      const { [key]: _removed, ...rest } = w;
      return rest;
    });
  }

  toggleGroup(id: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isCollapsed(id: string): boolean {
    return this.collapsedGroups().has(id);
  }

  toggleRowExpand(id: RowId): void {
    this.expandedRows.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRowExpanded(id: RowId): boolean {
    return this.expandedRows().has(id);
  }

  setEdit(rowId: RowId, colKey: string, value: unknown): void {
    this.edits.update((e) => setEditEntry(e, rowId, colKey, value));
  }

  clearEdit(rowId: RowId, colKey: string): void {
    this.edits.update((e) => clearEditEntry(e, rowId, colKey));
  }

  clearSavedEdits(saved: CellEdit[]): void {
    this.edits.update((e) => clearSavedEntries(e, saved));
  }

  clearAllEdits(): void {
    this.edits.set(new Map());
  }

  private applyOverlayValue(rowId: RowId, colKey: string, value: unknown): void {
    if (value === undefined) this.clearEdit(rowId, colKey);
    else this.setEdit(rowId, colKey, value);
  }

  pushHistory(delta: EditDelta): void {
    this.history.update((h) => pushDelta(h, delta));
  }

  pushHistoryBatch(deltas: EditDelta[]): void {
    this.history.update((h) => pushBatch(h, deltas));
  }

  applyUndo(): void {
    const result = undo(this.history());
    if (!result) return;
    for (const d of result.deltas) this.applyOverlayValue(d.rowId, d.colKey, d.before);
    this.history.set(result.history);
  }

  applyRedo(): void {
    const result = redo(this.history());
    if (!result) return;
    for (const d of result.deltas) this.applyOverlayValue(d.rowId, d.colKey, d.after);
    this.history.set(result.history);
  }

  resetHistory(): void {
    this.history.set(emptyHistory);
  }
}
