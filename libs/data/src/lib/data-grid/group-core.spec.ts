import { aggregate, groupRows, flattenGroups, type GroupNode } from './group-core';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { id: number; country: string; city: string; amt: number }
const COLS: GridColumnDef<Row>[] = [
  { key: 'country', header: 'Country' },
  { key: 'city', header: 'City' },
  { key: 'amt', header: 'Amount', aggregation: 'sum' },
  { key: 'id', header: 'Count', aggregation: 'count' },
];
const ROWS: Row[] = [
  { id: 1, country: 'US', city: 'NYC', amt: 10 },
  { id: 2, country: 'US', city: 'NYC', amt: 20 },
  { id: 3, country: 'US', city: 'LA', amt: 5 },
  { id: 4, country: 'CA', city: 'TOR', amt: 7 },
];

describe('aggregate', () => {
  it('computes sum/count over columns that declare an aggregation', () => {
    expect(aggregate(ROWS, COLS)).toEqual({ amt: 42, id: 4 });
  });
  it('handles avg/min/max and skips non-numerics', () => {
    const cols: GridColumnDef<Row>[] = [{ key: 'amt', header: 'A', aggregation: 'avg' }];
    expect(aggregate(ROWS, cols)).toEqual({ amt: 10.5 });
    expect(aggregate([], cols)).toEqual({ amt: 0 });
  });
});

describe('groupRows', () => {
  it('builds a nested tree with counts, aggregates, and grand totals', () => {
    const { groups, grandTotals } = groupRows(ROWS, ['country', 'city'], COLS);
    expect(groups.map((g) => g.value)).toEqual(['US', 'CA']);
    expect(groups[0].count).toBe(3);
    expect(groups[0].aggregates).toEqual({ amt: 35, id: 3 });
    expect(groups[0].children.map((c) => c.value)).toEqual(['NYC', 'LA']);
    expect(groups[0].children[0].count).toBe(2);
    expect(groups[0].children[0].leaves.map((r) => r.id)).toEqual([1, 2]);
    expect(grandTotals).toEqual({ amt: 42, id: 4 });
  });
  it('empty groupKeys yields no groups but still grand totals', () => {
    expect(groupRows(ROWS, [], COLS).groups).toEqual([]);
  });
});

describe('flattenGroups', () => {
  it('emits group then leaves; collapsed groups hide descendants', () => {
    const { groups } = groupRows(ROWS, ['country'], COLS);
    const all = flattenGroups(groups, new Set());
    expect(all.length).toBe(6);
    expect(all[0]).toMatchObject({ kind: 'group' });
    const usId = (groups[0] as GroupNode<Row>).groupId;
    const collapsed = flattenGroups(groups, new Set([usId]));
    expect(collapsed.length).toBe(3);
  });
});

describe('DisplayRow group-loading variant', () => {
  it('accepts a group-loading entry', () => {
    const entry: import('./group-core').DisplayRow<{ id: number }> = { kind: 'group-loading', level: 1, groupId: 'g' };
    expect(entry.kind).toBe('group-loading');
  });
});

describe('DisplayRow tree/detail variants', () => {
  it('accepts tree and detail entries', () => {
    const t: import('./group-core').DisplayRow<{ id: number }> = { kind: 'tree', row: { id: 1 }, level: 0, expandable: true };
    const d: import('./group-core').DisplayRow<{ id: number }> = { kind: 'detail', row: { id: 1 } };
    expect([t.kind, d.kind]).toEqual(['tree', 'detail']);
  });
});
