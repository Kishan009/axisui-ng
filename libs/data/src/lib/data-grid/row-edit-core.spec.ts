import { validateRowDrafts, rowCommitEntries } from './row-edit-core';
import type { GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
const row: Row = { id: 1, name: 'Ada', age: 36 };
const colKeyOf = (c: GridColumnDef<Row>) => String(c.key);

const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'age', header: 'Age', editable: true, validator: (v) => (typeof v === 'number' && v >= 0 ? null : 'bad age') },
];

describe('validateRowDrafts', () => {
  it('returns an empty map when every draft is valid', () => {
    const drafts = new Map<string, unknown>([['name', 'Ada L.'], ['age', 40]]);
    expect(validateRowDrafts(cols, row, drafts, colKeyOf).size).toBe(0);
  });

  it('collects only the failing columns error messages', () => {
    const drafts = new Map<string, unknown>([['name', 'Ada L.'], ['age', -5]]);
    const errs = validateRowDrafts(cols, row, drafts, colKeyOf);
    expect(errs.size).toBe(1);
    expect(errs.get('age')).toBe('bad age');
  });

  it('treats a column without a validator as always valid', () => {
    const drafts = new Map<string, unknown>([['name', 123], ['age', 5]]);
    const errs = validateRowDrafts(cols, row, drafts, colKeyOf);
    expect(errs.has('name')).toBe(false);
  });

  it('collects multiple failing columns', () => {
    const both: GridColumnDef<Row>[] = [
      { key: 'name', header: 'Name', editable: true, validator: () => 'no name' },
      { key: 'age', header: 'Age', editable: true, validator: () => 'no age' },
    ];
    const drafts = new Map<string, unknown>([['name', 'x'], ['age', 1]]);
    const errs = validateRowDrafts(both, row, drafts, colKeyOf);
    expect(errs.size).toBe(2);
  });
});

describe('rowCommitEntries', () => {
  it('returns one entry per editable column pulled from drafts', () => {
    const drafts = new Map<string, unknown>([['name', 'Ada L.'], ['age', 40]]);
    expect(rowCommitEntries(cols, drafts, colKeyOf)).toEqual([
      { colKey: 'name', value: 'Ada L.' },
      { colKey: 'age', value: 40 },
    ]);
  });

  it('carries an empty-string draft through as-is', () => {
    const drafts = new Map<string, unknown>([['name', ''], ['age', 0]]);
    expect(rowCommitEntries(cols, drafts, colKeyOf)).toEqual([
      { colKey: 'name', value: '' },
      { colKey: 'age', value: 0 },
    ]);
  });
});
