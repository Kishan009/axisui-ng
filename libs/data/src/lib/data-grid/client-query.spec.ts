import { computeClientPage } from './client-query';
import type { GridColumnDef } from './grid-core';
import type { GridQuery } from './grid-data-source';

interface Row extends Record<string, unknown> { id: number; name: string; age: number }
const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age', filterType: 'number', filterable: true },
];
const rows: Row[] = [
  { id: 1, name: 'Ada', age: 36 },
  { id: 2, name: 'Bo', age: 40 },
  { id: 3, name: 'Cy', age: 9 },
];
const baseQuery = (over: Partial<GridQuery<Row>> = {}): GridQuery<Row> => ({
  startRow: 0, endRow: 100, sort: [], search: '', columnFilters: {}, filterModel: null, ...over,
});

describe('computeClientPage', () => {
  it('returns all rows with total when unfiltered', () => {
    const page = computeClientPage(rows, cols, baseQuery());
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.name)).toEqual(['Ada', 'Bo', 'Cy']);
  });
  it('applies the global search filter', () => {
    const page = computeClientPage(rows, cols, baseQuery({ search: 'a' })); // Ada
    expect(page.rows.map((r) => r.name)).toEqual(['Ada']);
    expect(page.total).toBe(1);
  });
  it('applies a column filter', () => {
    const page = computeClientPage(rows, cols, baseQuery({ columnFilters: { age: '4' } }));
    expect(page.rows.map((r) => r.name)).toEqual(['Bo']);
  });
  it('sorts by the given sort state', () => {
    const page = computeClientPage(rows, cols, baseQuery({ sort: [{ key: 'age', dir: 'asc' }] }));
    expect(page.rows.map((r) => r.age)).toEqual([9, 36, 40]);
  });
  it('paginates via startRow/endRow but total is the full filtered count', () => {
    const page = computeClientPage(rows, cols, baseQuery({ startRow: 1, endRow: 2 }));
    expect(page.rows.map((r) => r.name)).toEqual(['Bo']);
    expect(page.total).toBe(3);
  });
});
