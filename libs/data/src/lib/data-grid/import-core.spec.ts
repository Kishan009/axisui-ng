import { parseDelimited, sniffDelimiter } from './import-core';
import { coerceCsvValue, mapImportedRows } from './import-core';
import { autoGuessMapping, buildRowsFromMapping } from './import-core';
import { type GridColumnDef } from './grid-core';

describe('parseDelimited', () => {
  it('parses plain rows', () => {
    expect(parseDelimited('a,b\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });
  it('handles a quoted field containing the delimiter', () => {
    expect(parseDelimited('x,"a,b"')).toEqual([['x', 'a,b']]);
  });
  it('handles a quoted field containing a newline', () => {
    expect(parseDelimited('"a\nb",c')).toEqual([['a\nb', 'c']]);
  });
  it('unescapes doubled quotes', () => {
    expect(parseDelimited('"x""y"')).toEqual([['x"y']]);
  });
  it('accepts LF, CRLF, and CR line endings', () => {
    expect(parseDelimited('a\nb')).toEqual([['a'], ['b']]);
    expect(parseDelimited('a\r\nb')).toEqual([['a'], ['b']]);
    expect(parseDelimited('a\rb')).toEqual([['a'], ['b']]);
  });
  it('ignores a trailing newline (no empty final row)', () => {
    expect(parseDelimited('a,b\r\n')).toEqual([['a', 'b']]);
  });
  it('empty input -> empty matrix', () => {
    expect(parseDelimited('')).toEqual([]);
  });
  it('parses TSV via the delimiter arg', () => {
    expect(parseDelimited('a\tb\r\nc\td', '\t')).toEqual([['a', 'b'], ['c', 'd']]);
  });
});

interface Row extends Record<string, unknown> { name: string; age: number; when: unknown; active: unknown }
const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age', filterType: 'number' },
  { key: 'when', header: 'When', filterType: 'date' },
  { key: 'active', header: 'Active' },
];

describe('coerceCsvValue', () => {
  const c = (k: string, v: string) => coerceCsvValue(v, cols.find((x) => x.key === k)!);
  it('coerces number columns', () => { expect(c('age', '36')).toBe(36); expect(c('age', 'x')).toBe('x'); expect(c('age', '')).toBe(''); });
  it('coerces date columns to Date', () => {
    const d = c('when', '2026-07-10');
    expect(d instanceof Date).toBe(true);
    expect(c('when', 'nope')).toBe('nope');
  });
  it('coerces boolean tokens on other columns', () => {
    expect(c('active', 'true')).toBe(true); expect(c('active', 'YES')).toBe(true);
    expect(c('active', 'false')).toBe(false); expect(c('active', 'no')).toBe(false);
    expect(c('active', 'hello')).toBe('hello');
  });
});

describe('mapImportedRows', () => {
  it('maps by header name with numeric/boolean coercion', () => {
    const rows = mapImportedRows([['Name', 'Age', 'Active'], ['Ada', '36', 'yes']], cols);
    expect(rows).toEqual([{ name: 'Ada', age: 36, active: true }]);
  });
  it('falls back to key when the header does not match a display name', () => {
    const rows = mapImportedRows([['name', 'age'], ['Ada', '36']], cols);
    expect(rows).toEqual([{ name: 'Ada', age: 36 }]);
  });
  it('drops unknown headers and skips fully-empty rows', () => {
    const rows = mapImportedRows([['Name', 'Zzz'], ['Ada', 'x'], ['', '']], cols);
    expect(rows).toEqual([{ name: 'Ada' }]);
  });
  it('skips a row that is empty in all MAPPED columns even if a dropped column has data', () => {
    const rows = mapImportedRows([['Name', 'Zzz'], ['', 'junk'], ['Ada', 'x']], cols);
    expect(rows).toEqual([{ name: 'Ada' }]);
  });
  it('pads a short data row to empty strings', () => {
    const rows = mapImportedRows([['Name', 'Age'], ['Ada']], cols);
    expect(rows).toEqual([{ name: 'Ada', age: '' }]);
  });
});

describe('autoGuessMapping', () => {
  it('maps each header to a column key by header then key, else null', () => {
    expect(autoGuessMapping(['Name', 'age', 'Zzz'], cols)).toEqual(['name', 'age', null]);
  });
});

describe('buildRowsFromMapping', () => {
  const matrix = [['H1', 'H2', 'H3'], ['Ada', '36', 'yes'], ['', '', '']];
  it('applies an explicit mapping (null = ignore) with coercion', () => {
    expect(buildRowsFromMapping(matrix, ['name', 'age', null], cols)).toEqual([{ name: 'Ada', age: 36 }]);
  });
  it('a mapping key that matches no column is treated as ignore', () => {
    expect(buildRowsFromMapping([['H1', 'H2'], ['Ada', 'x']], ['name', 'nope'], cols)).toEqual([{ name: 'Ada' }]);
  });
  it('skips a row empty in the mapped columns and pads short rows', () => {
    expect(buildRowsFromMapping([['H1', 'H2'], ['Ada'], ['', 'junk']], ['name', null], cols)).toEqual([{ name: 'Ada' }]);
  });
});

describe('sniffDelimiter', () => {
  it('returns tab when the first line contains a tab (Excel/Sheets TSV)', () => {
    expect(sniffDelimiter('Name\tAge\r\nAda\t36')).toBe('\t');
  });
  it('returns comma when the first line has no tab', () => {
    expect(sniffDelimiter('Name,Age\r\nAda,36')).toBe(',');
  });
  it('only inspects the FIRST line (a tab in a later line does not switch to TSV)', () => {
    expect(sniffDelimiter('Name,Age\r\nAda,3\t6')).toBe(',');
  });
  it('handles LF and CR line endings, not just CRLF', () => {
    expect(sniffDelimiter('a\tb\nc\td')).toBe('\t');
    expect(sniffDelimiter('a\tb\rc\td')).toBe('\t');
  });
  it('empty string returns comma (harmless; parseDelimited("") is [])', () => {
    expect(sniffDelimiter('')).toBe(',');
  });
});
