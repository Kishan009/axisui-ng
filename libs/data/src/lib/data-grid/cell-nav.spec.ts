import { nextEditableCell, prevEditableCell, type CellPos } from './cell-nav';
import type { RowId } from './grid-core';

const rows: RowId[] = [1, 2, 3];
const cols = ['name', 'age']; // editable column keys in display order

describe('nextEditableCell', () => {
  it('advances to the next editable column in the same row', () => {
    expect(nextEditableCell(rows, cols, { rowIndex: 0, colKey: 'name' })).toEqual({ rowIndex: 0, colKey: 'age' });
  });

  it('wraps to the next row first editable column at the row end', () => {
    expect(nextEditableCell(rows, cols, { rowIndex: 0, colKey: 'age' })).toEqual({ rowIndex: 1, colKey: 'name' });
  });

  it('returns null at the last editable cell of the last row', () => {
    expect(nextEditableCell(rows, cols, { rowIndex: 2, colKey: 'age' })).toBeNull();
  });

  it('returns null when the current column is not in the editable set', () => {
    expect(nextEditableCell(rows, cols, { rowIndex: 0, colKey: 'role' })).toBeNull();
  });

  it('returns null when there are no editable columns', () => {
    expect(nextEditableCell(rows, [], { rowIndex: 0, colKey: 'name' })).toBeNull();
  });
});

describe('prevEditableCell', () => {
  it('moves to the previous editable column in the same row', () => {
    expect(prevEditableCell(rows, cols, { rowIndex: 1, colKey: 'age' })).toEqual({ rowIndex: 1, colKey: 'name' });
  });

  it('wraps to the previous row last editable column at the row start', () => {
    expect(prevEditableCell(rows, cols, { rowIndex: 1, colKey: 'name' })).toEqual({ rowIndex: 0, colKey: 'age' });
  });

  it('returns null at the first editable cell of the first row', () => {
    expect(prevEditableCell(rows, cols, { rowIndex: 0, colKey: 'name' })).toBeNull();
  });
});

describe('single editable column + single row', () => {
  it('nextEditableCell returns null', () => {
    expect(nextEditableCell([9], ['name'], { rowIndex: 0, colKey: 'name' })).toBeNull();
  });
  it('prevEditableCell returns null', () => {
    expect(prevEditableCell([9], ['name'], { rowIndex: 0, colKey: 'name' })).toBeNull();
  });
});
