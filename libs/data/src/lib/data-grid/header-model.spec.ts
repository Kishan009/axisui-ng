import { isGroupCol, flattenLeaves, treeDepth, headerRows } from './header-model';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { a: string; b: string; c: string }
const FLAT: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }];
const GROUPED: GridColumnDef<Row>[] = [
  { key: 'g1', header: 'Group 1', children: [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }] },
  { key: 'c', header: 'C' },
];
const none = () => false;

describe('header-model', () => {
  it('isGroupCol detects children', () => {
    expect(isGroupCol(GROUPED[0])).toBe(true);
    expect(isGroupCol(GROUPED[1])).toBe(false);
  });
  it('flattenLeaves collects leaves in order', () => {
    expect(flattenLeaves(GROUPED).map((c) => c.key)).toEqual(['a', 'b', 'c']);
    expect(flattenLeaves(FLAT).map((c) => c.key)).toEqual(['a', 'b']);
  });
  it('treeDepth: flat=1, grouped=2', () => {
    expect(treeDepth(FLAT)).toBe(1);
    expect(treeDepth(GROUPED)).toBe(2);
  });
  it('headerRows: flat = one row of leaf cells', () => {
    const rows = headerRows(FLAT, none);
    expect(rows.length).toBe(1);
    expect(rows[0].map((c) => [c.col.key, c.colspan, c.rowspan, c.isGroup])).toEqual([
      ['a', 1, 1, false], ['b', 1, 1, false],
    ]);
  });
  it('headerRows: grouped matrix with colspan/rowspan', () => {
    const rows = headerRows(GROUPED, none);
    expect(rows.length).toBe(2);
    expect(rows[0].map((c) => [c.col.key, c.colspan, c.rowspan, c.isGroup])).toEqual([
      ['g1', 2, 1, true], ['c', 1, 2, false],
    ]);
    expect(rows[1].map((c) => c.col.key)).toEqual(['a', 'b']);
  });
  it('headerRows: hiding a leaf shrinks the group; emptied group drops', () => {
    const hideA = (k: string) => k === 'a';
    expect(headerRows(GROUPED, hideA)[0].find((c) => c.col.key === 'g1')?.colspan).toBe(1);
    const hideAll = (k: string) => k === 'a' || k === 'b';
    expect(headerRows(GROUPED, hideAll)[0].map((c) => c.col.key)).toEqual(['c']);
  });
});
