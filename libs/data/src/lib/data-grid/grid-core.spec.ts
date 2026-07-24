import {
  cellValue, globalFilter, columnFilter,
  sortRows, paginate, pageCount, toggleRow, toggleAll, selectionState, applyRange, clampWidth, asText,
  type GridColumnDef, type RowId,
} from './grid-core';

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
const NAME: GridColumnDef<Row> = { key: 'name', header: 'Name' };

describe('grid-core asText', () => {
  it('coerces primitives and objects safely', () => {
    expect(asText('hi')).toBe('hi');
    expect(asText(42)).toBe('42');
    expect(asText(null)).toBe('');
    expect(asText(undefined)).toBe('');
    expect(asText({ a: 1 })).toBe('{"a":1}');
  });
});

describe('grid-core cellValue', () => {
  it('reads the row key by default', () => {
    expect(cellValue({ id: 1, name: 'Alice', age: 30 }, NAME)).toBe('Alice');
  });
  it('uses valueGetter when provided', () => {
    const col: GridColumnDef<Row> = { key: 'name', header: 'Name', valueGetter: (r) => r.age * 2 };
    expect(cellValue({ id: 1, name: 'Alice', age: 30 }, col)).toBe(60);
  });
});

const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
];
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', filterable: true },
  { key: 'age', header: 'Age', searchable: false },
];

describe('grid-core globalFilter', () => {
  it('returns all rows for an empty query', () => {
    expect(globalFilter(ROWS, '', COLS)).toHaveLength(3);
  });
  it('matches across searchable columns, case-insensitively', () => {
    expect(globalFilter(ROWS, 'ali', COLS).map((r) => r.name)).toEqual(['Alice']);
  });
  it('skips columns with searchable:false', () => {
    expect(globalFilter(ROWS, '25', COLS)).toHaveLength(0);
  });
});

describe('grid-core columnFilter', () => {
  it('returns all rows when no filters are active', () => {
    expect(columnFilter(ROWS, {}, COLS)).toHaveLength(3);
  });
  it('narrows by a per-column term on filterable columns', () => {
    expect(columnFilter(ROWS, { name: 'cha' }, COLS).map((r) => r.name)).toEqual(['Charlie']);
  });
});

describe('grid-core sortRows', () => {
  it('returns a copy when no sort is given', () => {
    const out = sortRows(ROWS, []);
    expect(out).not.toBe(ROWS);
    expect(out.map((r) => r.id)).toEqual([1, 2, 3]);
  });
  it('sorts numbers ascending then descending', () => {
    expect(sortRows(ROWS, [{ key: 'age', dir: 'asc' }]).map((r) => r.age)).toEqual([25, 30, 35]);
    expect(sortRows(ROWS, [{ key: 'age', dir: 'desc' }]).map((r) => r.age)).toEqual([35, 30, 25]);
  });
  it('applies multi-sort in priority order', () => {
    const data: Row[] = [
      { id: 1, name: 'B', age: 20 }, { id: 2, name: 'A', age: 20 }, { id: 3, name: 'A', age: 10 },
    ];
    const out = sortRows(data, [{ key: 'name', dir: 'asc' }, { key: 'age', dir: 'asc' }]);
    expect(out.map((r) => r.id)).toEqual([3, 2, 1]);
  });
  it('sorts nullish values last (ascending)', () => {
    const data: Row[] = [
      { id: 1, name: 'A', age: 30 }, { id: 2, name: 'B', age: null as unknown as number }, { id: 3, name: 'C', age: 10 },
    ];
    expect(sortRows(data, [{ key: 'age', dir: 'asc' }]).map((r) => r.id)).toEqual([3, 1, 2]);
  });
});

describe('grid-core paginate/pageCount', () => {
  it('returns the whole list when pageSize <= 0', () => {
    expect(paginate(ROWS, 0, 0)).toHaveLength(3);
  });
  it('slices the requested page', () => {
    expect(paginate(ROWS, 1, 2).map((r) => r.id)).toEqual([3]);
  });
  it('computes page count (min 1)', () => {
    expect(pageCount(3, 2)).toBe(2);
    expect(pageCount(0, 2)).toBe(1);
  });
});

describe('grid-core selection', () => {
  it('toggles a single id', () => {
    expect([...toggleRow(new Set<RowId>(), 1)]).toEqual([1]);
    expect([...toggleRow(new Set<RowId>([1]), 1)]).toEqual([]);
  });
  it('toggleAll selects all then clears all', () => {
    expect([...toggleAll(new Set<RowId>(), [1, 2])]).toEqual([1, 2]);
    expect([...toggleAll(new Set<RowId>([1, 2]), [1, 2])]).toEqual([]);
  });
  it('toggleAll selects the rest when partially selected', () => {
    expect([...toggleAll(new Set<RowId>([1]), [1, 2])].sort()).toEqual([1, 2]);
  });
  it('selectionState reports none/some/all', () => {
    expect(selectionState(new Set<RowId>(), [1, 2])).toBe('none');
    expect(selectionState(new Set<RowId>([1]), [1, 2])).toBe('some');
    expect(selectionState(new Set<RowId>([1, 2]), [1, 2])).toBe('all');
  });
});

describe('grid-core clampWidth', () => {
  it('never goes below the minimum', () => {
    expect(clampWidth(40, 60)).toBe(60);
    expect(clampWidth(120, 60)).toBe(120);
  });
  it('returns the minimum when px equals min', () => {
    expect(clampWidth(60, 60)).toBe(60);
  });
});

describe('clampWidth (min/max)', () => {
  it('clamps below the minimum up to min', () => {
    expect(clampWidth(40, 60)).toBe(60);
  });
  it('passes through a value within range', () => {
    expect(clampWidth(120, 60, 300)).toBe(120);
  });
  it('clamps above the maximum down to max', () => {
    expect(clampWidth(500, 60, 300)).toBe(300);
  });
  it('ignores max when omitted (legacy 2-arg behavior)', () => {
    expect(clampWidth(9999, 60)).toBe(9999);
  });
});

describe('applyRange', () => {
  const ids: RowId[] = ['a', 'b', 'c', 'd', 'e'];

  it('adds the inclusive range forward (anchor before target)', () => {
    const result = applyRange(new Set(), ids, 'b', 'd', true);
    expect([...result].sort()).toEqual(['b', 'c', 'd']);
  });

  it('adds the inclusive range backward (anchor after target)', () => {
    const result = applyRange(new Set(), ids, 'd', 'b', true);
    expect([...result].sort()).toEqual(['b', 'c', 'd']);
  });

  it('falls back to applying just the target when the anchor is missing from ids', () => {
    const result = applyRange(new Set(['a']), ids, 'z', 'c', true);
    expect([...result].sort()).toEqual(['a', 'c']);
  });

  it('removes the inclusive range when add is false', () => {
    const seeded = new Set<RowId>(['a', 'b', 'c', 'd', 'e']);
    const result = applyRange(seeded, ids, 'b', 'd', false);
    expect([...result].sort()).toEqual(['a', 'e']);
  });

  it('does not mutate the input set', () => {
    const seeded = new Set<RowId>(['a']);
    applyRange(seeded, ids, 'b', 'd', true);
    expect([...seeded].sort()).toEqual(['a']);
  });
});
