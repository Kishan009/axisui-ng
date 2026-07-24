import { GridState } from './grid-state';
import { type FilterGroup } from './filter-model';
import { editKey } from './edit-core';

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }

describe('GridState', () => {
  it('cycles a column sort asc -> desc -> none (single-sort in Phase 0)', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    expect(s.sort()).toEqual([{ key: 'age', dir: 'asc' }]);
    s.toggleSort('age');
    expect(s.sort()).toEqual([{ key: 'age', dir: 'desc' }]);
    s.toggleSort('age');
    expect(s.sort()).toEqual([]);
  });

  it('switching column resets to a single asc sort', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    s.toggleSort('name');
    expect(s.sort()).toEqual([{ key: 'name', dir: 'asc' }]);
  });

  it('setSearch resets the page to 0', () => {
    const s = new GridState<Row>();
    s.page.set(3);
    s.setSearch('abc');
    expect(s.search()).toBe('abc');
    expect(s.page()).toBe(0);
  });

  it('setColumnFilter stores the term and resets the page', () => {
    const s = new GridState<Row>();
    s.page.set(2);
    s.setColumnFilter('name', 'al');
    expect(s.columnFilters()).toEqual({ name: 'al' });
    expect(s.page()).toBe(0);
  });

  it('setWidth records a column width', () => {
    const s = new GridState<Row>();
    s.setWidth('name', 120);
    expect(s.widths()).toEqual({ name: 120 });
  });

  it('clearWidth removes a width override', () => {
    const s = new GridState<Row>();
    s.setWidth('name', 240);
    expect(s.widths()['name']).toBe(240);
    s.clearWidth('name');
    expect(s.widths()['name']).toBeUndefined();
  });
});

describe('GridState.setColumnSort', () => {
  it('replaces the sort with a single-column entry in the given direction and resets the page', () => {
    const s = new GridState<{ id: number; name: string }>();
    s.page.set(3);
    s.setColumnSort('name', 'desc');
    expect(s.sort()).toEqual([{ key: 'name', dir: 'desc' }]);
    expect(s.page()).toBe(0);
    s.setColumnSort('name', 'asc');
    expect(s.sort()).toEqual([{ key: 'name', dir: 'asc' }]);
  });
});

describe('GridState multi-sort', () => {
  it('additive append adds a second sort, preserving order', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    s.toggleSort('name', true);
    expect(s.sort()).toEqual([{ key: 'age', dir: 'asc' }, { key: 'name', dir: 'asc' }]);
  });
  it('additive cycles one column asc->desc->removed while keeping others', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    s.toggleSort('name', true);
    s.toggleSort('age', true); // asc -> desc
    expect(s.sort()).toEqual([{ key: 'age', dir: 'desc' }, { key: 'name', dir: 'asc' }]);
    s.toggleSort('age', true); // desc -> removed
    expect(s.sort()).toEqual([{ key: 'name', dir: 'asc' }]);
  });
  it('plain click replaces a multi-sort with a single asc', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    s.toggleSort('name', true);
    s.toggleSort('age'); // not additive
    expect(s.sort()).toEqual([{ key: 'age', dir: 'asc' }]);
  });
  it('removeSort / setSortDir / reorderSort', () => {
    const s = new GridState<Row>();
    s.toggleSort('age');
    s.toggleSort('name', true);
    s.setSortDir('age', 'desc');
    expect(s.sort()[0]).toEqual({ key: 'age', dir: 'desc' });
    s.reorderSort(0, 1);
    expect(s.sort().map((x) => x.key)).toEqual(['name', 'age']);
    s.removeSort('name');
    expect(s.sort().map((x) => x.key)).toEqual(['age']);
  });
});

describe('GridState filterModel', () => {
  it('setFilterModel stores the model and resets page', () => {
    const s = new GridState<Row>();
    s.page.set(3);
    const model: FilterGroup<Row> = { kind: 'group', combinator: 'and', children: [] };
    s.setFilterModel(model);
    expect(s.filterModel()).toBe(model);
    expect(s.page()).toBe(0);
  });
  it('clearFilterModel nulls the model and resets page', () => {
    const s = new GridState<Row>();
    s.setFilterModel({ kind: 'group', combinator: 'and', children: [] });
    s.page.set(2);
    s.clearFilterModel();
    expect(s.filterModel()).toBeNull();
    expect(s.page()).toBe(0);
  });
});

describe('GridState grouping', () => {
  it('toggleGroup flips collapse membership; isCollapsed reflects it', () => {
    const s = new GridState<Row>();
    expect(s.isCollapsed('g1')).toBe(false);
    s.toggleGroup('g1');
    expect(s.isCollapsed('g1')).toBe(true);
    expect([...s.collapsedGroups()]).toEqual(['g1']);
    s.toggleGroup('g1');
    expect(s.isCollapsed('g1')).toBe(false);
  });
});

describe('GridState row expansion', () => {
  it('toggleRowExpand flips membership; multiple ids open', () => {
    const s = new GridState<Row>();
    expect(s.isRowExpanded(1)).toBe(false);
    s.toggleRowExpand(1);
    s.toggleRowExpand(2);
    expect(s.isRowExpanded(1)).toBe(true);
    expect(s.isRowExpanded(2)).toBe(true);
    expect([...s.expandedRows()].sort()).toEqual([1, 2]);
    s.toggleRowExpand(1);
    expect(s.isRowExpanded(1)).toBe(false);
  });
});

describe('GridState edits', () => {
  it('setEdit adds a pending edit and clearEdit removes it', () => {
    const state = new GridState<Record<string, unknown>>();
    expect(state.edits().size).toBe(0);
    state.setEdit(1, 'name', 'Ada');
    expect(state.edits().get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada' });
    state.clearEdit(1, 'name');
    expect(state.edits().has(editKey(1, 'name'))).toBe(false);
  });

  it('clearSavedEdits removes an entry only if its value still matches what was saved', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.clearSavedEdits([{ rowId: 1, colKey: 'name', value: 'Ada' }]);
    expect(state.edits().get(editKey(1, 'name'))).toBeUndefined();

    state.setEdit(2, 'name', 'Bob');
    state.setEdit(2, 'name', 'Bobby'); // re-edited
    state.clearSavedEdits([{ rowId: 2, colKey: 'name', value: 'Bob' }]); // stale batch value
    expect(state.edits().get(editKey(2, 'name'))).toEqual({ rowId: 2, colKey: 'name', value: 'Bobby' });
  });

  it('clearAllEdits empties the overlay in one shot', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.setEdit(2, 'name', 'Bob');
    state.clearAllEdits();
    expect(state.edits().size).toBe(0);
  });

  it('pushHistory records a delta and applyUndo restores the before-value to the overlay', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.pushHistory({ rowId: 1, colKey: 'name', before: undefined, after: 'Ada' });
    state.applyUndo();
    // before was undefined => the cell returns to clean (removed from the overlay)
    expect(state.edits().get(editKey(1, 'name'))).toBeUndefined();
  });

  it('applyRedo re-applies the after-value', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.pushHistory({ rowId: 1, colKey: 'name', before: undefined, after: 'Ada' });
    state.applyUndo();  // overlay now clean
    state.applyRedo();  // re-apply 'Ada'
    expect(state.edits().get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada' });
  });

  it('applyUndo writes a defined before-value back to the overlay', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.setEdit(1, 'name', 'Ada Lovelace');
    state.pushHistory({ rowId: 1, colKey: 'name', before: 'Ada', after: 'Ada Lovelace' });
    state.applyUndo();
    expect(state.edits().get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada' });
  });

  it('resetHistory empties both stacks so applyUndo/applyRedo no-op', () => {
    const state = new GridState<Record<string, unknown>>();
    state.setEdit(1, 'name', 'Ada');
    state.pushHistory({ rowId: 1, colKey: 'name', before: undefined, after: 'Ada' });
    state.resetHistory();
    state.applyUndo(); // no-op
    expect(state.edits().get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada' });
    expect(state.history()).toEqual({ undo: [], redo: [] });
  });
});

describe('GridState history batches', () => {
  it('pushHistoryBatch + applyUndo reverts every cell in the batch in one step', () => {
    const s = new GridState<Row>();
    s.setEdit(1, 'name', 'A');
    s.setEdit(2, 'age', 5);
    s.pushHistoryBatch([
      { rowId: 1, colKey: 'name', before: undefined, after: 'A' },
      { rowId: 2, colKey: 'age', before: undefined, after: 5 },
    ]);
    s.applyUndo();
    expect(s.edits().size).toBe(0); // both cleared (before === undefined)
  });

  it('applyRedo re-applies every cell in the batch', () => {
    const s = new GridState<Row>();
    s.pushHistoryBatch([
      { rowId: 1, colKey: 'name', before: undefined, after: 'A' },
      { rowId: 2, colKey: 'age', before: undefined, after: 5 },
    ]);
    s.applyUndo();
    s.applyRedo();
    expect(s.edits().size).toBe(2);
  });

  it('single-edit undo/redo still works (regression)', () => {
    const s = new GridState<Row>();
    s.setEdit(1, 'name', 'B');
    s.pushHistory({ rowId: 1, colKey: 'name', before: undefined, after: 'B' });
    s.applyUndo();
    expect(s.edits().size).toBe(0);
    s.applyRedo();
    expect(s.edits().size).toBe(1);
  });
});
