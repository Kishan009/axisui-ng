import { toXlsxCell, buildSheet, sheetToMatrix, type XlsxSheet } from './xlsx-core';
import type { GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { name: string; age: number; born: Date; active: boolean }
const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
  { key: 'born', header: 'Born' },
  { key: 'active', header: 'Active' },
];
const d = new Date('2020-01-02T00:00:00Z');
const rows: Row[] = [{ name: 'Ada', age: 36, born: d, active: true }];

describe('toXlsxCell', () => {
  it('passes number/boolean/string through unchanged', () => {
    expect(toXlsxCell(36)).toBe(36);
    expect(toXlsxCell(true)).toBe(true);
    expect(toXlsxCell('x')).toBe('x');
  });
  it('passes Date through unchanged', () => {
    expect(toXlsxCell(d)).toBe(d);
  });
  it('maps null and undefined to null', () => {
    expect(toXlsxCell(null)).toBeNull();
    expect(toXlsxCell(undefined)).toBeNull();
  });
  it('stringifies other objects', () => {
    expect(toXlsxCell({ toString: () => 'obj' })).toBe('obj');
  });
});

describe('buildSheet', () => {
  it('builds a header row of col.header plus native-typed body rows', () => {
    const sheet: XlsxSheet = buildSheet(rows, cols, 'Sheet1');
    expect(sheet.name).toBe('Sheet1');
    expect(sheet.rows[0]).toEqual(['Name', 'Age', 'Born', 'Active']);
    expect(sheet.rows[1]).toEqual(['Ada', 36, d, true]);
    expect(typeof sheet.rows[1]![1]).toBe('number'); // native, not stringified
  });
  it('uses a custom valueOf getter when provided (overlay-aware in the component)', () => {
    const sheet = buildSheet(rows, cols, 'S', (row, col) => (String(col.key) === 'age' ? 99 : row[col.key as keyof Row]));
    expect(sheet.rows[1]).toEqual(['Ada', 99, d, true]);
  });
  it('empty rows → header only', () => {
    expect(buildSheet([], cols, 'S').rows).toEqual([['Name', 'Age', 'Born', 'Active']]);
  });
});

describe('sheetToMatrix', () => {
  const d = new Date('2020-01-02T00:00:00Z');
  it('stringifies typed cells and maps null/undefined to empty string', () => {
    const sheet = { name: 'S', rows: [['Name', 'Age', 'Active'], ['Ada', 36, true], ['Bo', null, false]] };
    expect(sheetToMatrix(sheet as never)).toEqual([
      ['Name', 'Age', 'Active'],
      ['Ada', '36', 'true'],
      ['Bo', '', 'false'],
    ]);
  });
  it('stringifies a Date to a Date.parse-able form', () => {
    const [row] = sheetToMatrix({ name: 'S', rows: [[d]] } as never);
    expect(Number.isNaN(Date.parse(row![0]!))).toBe(false);
  });
  it('empty sheet → empty matrix', () => {
    expect(sheetToMatrix({ name: 'S', rows: [] } as never)).toEqual([]);
  });
});
