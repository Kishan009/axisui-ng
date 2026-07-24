import { type GridColumnDef } from './grid-core';

/** Parse RFC-4180 delimited text into a matrix of string cells (inverse of `toDelimited`).
 *  Handles quoted fields (embedded delimiter/newline, `""` escapes) and CRLF/LF/CR line ends. */
export function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  let sawAny = false; // did the current row get any content/field?
  const pushField = (): void => { row.push(field); field = ''; };
  const pushRow = (): void => { pushField(); rows.push(row); row = []; sawAny = false; };
  while (i < text.length) {
    const ch = text[i] as string; // guaranteed non-undefined while i < text.length
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; sawAny = true; i++; continue; }
    if (ch === delimiter) { pushField(); sawAny = true; i++; continue; }
    if (ch === '\r') { pushRow(); if (text[i + 1] === '\n') i++; i++; continue; }
    if (ch === '\n') { pushRow(); i++; continue; }
    field += ch; sawAny = true; i++;
  }
  // flush the final field/row unless the input ended exactly on a row terminator
  if (sawAny || field !== '' || row.length > 0) pushRow();
  return rows;
}

/** Coerce a raw CSV cell to a value based on the target column's type. */
export function coerceCsvValue<T>(raw: string, col: GridColumnDef<T>): unknown {
  const s = raw.trim();
  if (s === '') return '';
  if (col.filterType === 'number') {
    const n = Number(s);
    return Number.isNaN(n) ? s : n;
  }
  if (col.filterType === 'date') {
    const t = Date.parse(s);
    return Number.isNaN(t) ? s : new Date(t);
  }
  const low = s.toLowerCase();
  if (low === 'true' || low === 'yes') return true;
  if (low === 'false' || low === 'no') return false;
  return s;
}

/** For each CSV header cell, the target column key (`String(col.key)`) matched by `header`
 *  then `key`, else null (ignore). */
export function autoGuessMapping<T>(header: string[], columns: GridColumnDef<T>[]): (string | null)[] {
  return header.map((cell) => {
    const col = columns.find((c) => c.header === cell) ?? columns.find((c) => String(c.key) === cell);
    return col ? String(col.key) : null;
  });
}

/** Build row objects from a parsed matrix using an explicit CSV-column → target-key mapping
 *  (null = ignore; a key matching no column is also ignored). Coerces per the target column,
 *  skips rows empty in the mapped columns, pads short rows. */
export function buildRowsFromMapping<T>(matrix: string[][], mapping: (string | null)[], columns: GridColumnDef<T>[]): T[] {
  const mapped: { index: number; col: GridColumnDef<T> }[] = [];
  mapping.forEach((key, index) => {
    if (key == null) return;
    const col = columns.find((c) => String(c.key) === key);
    if (col) mapped.push({ index, col });
  });
  const out: T[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r] ?? [];
    if (mapped.every(({ index }) => (cells[index] ?? '').trim() === '')) continue;
    const obj: Record<string, unknown> = {};
    for (const { index, col } of mapped) obj[String(col.key)] = coerceCsvValue(cells[index] ?? '', col);
    out.push(obj as T);
  }
  return out;
}

/** Map a parsed matrix (row 0 = header) to row objects: header→column by `header` then `key`,
 *  with per-column coercion. Unknown headers dropped; fully-empty rows skipped. */
export function mapImportedRows<T>(matrix: string[][], columns: GridColumnDef<T>[]): T[] {
  return buildRowsFromMapping(matrix, autoGuessMapping(matrix[0] ?? [], columns), columns);
}

/** Pick the delimiter for a pasted/loaded block: tab if the first line contains a tab
 *  (Excel/Sheets copy TSV), else comma. */
export function sniffDelimiter(text: string): '\t' | ',' {
  const firstLine = text.split(/\r\n|\r|\n/, 1)[0] ?? '';
  return firstLine.includes('\t') ? '\t' : ',';
}
