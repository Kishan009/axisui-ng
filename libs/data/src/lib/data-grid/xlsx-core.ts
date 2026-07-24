import type { GridColumnDef } from './grid-core';
import { cellValue } from './grid-core';

/** A workbook cell in the adapter's transport shape. Native types survive to Excel. */
export type XlsxCell = string | number | boolean | Date | null;

/** One worksheet: row 0 is the header, the rest are data rows. */
export interface XlsxSheet { name: string; rows: XlsxCell[][]; }

/** The port the grid needs from a consumer-supplied xlsx engine. Both methods may be sync (SheetJS's
 *  `XLSX.write`/`read`) or async (ExcelJS's `writeBuffer`/`load`) — the grid awaits either. */
export interface XlsxAdapter {
  /** Encode sheets to .xlsx bytes (export). */
  toWorkbook(sheets: XlsxSheet[]): ArrayBuffer | Promise<ArrayBuffer>;
  /** Decode .xlsx bytes to sheets (import — used by 6e-ii). */
  fromWorkbook(data: ArrayBuffer): XlsxSheet[] | Promise<XlsxSheet[]>;
}

/** Coerce an arbitrary cell value to the XlsxCell transport union (keeps number/boolean/Date native). */
export function toXlsxCell(value: unknown): XlsxCell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  if (value instanceof Date) return value;
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- fallback intentionally honors a custom toString() (see spec); JSON.stringify would drop it.
  return String(value);
}

/** Build a single worksheet from rows + columns: header row of `col.header`, then one row per record
 *  with NATIVE-typed cells pulled by `valueOf(row, col)` (overlay-aware in the component). */
export function buildSheet<T extends Record<string, unknown>>(
  rows: T[],
  columns: GridColumnDef<T>[],
  name: string,
  valueOf: (row: T, col: GridColumnDef<T>) => unknown = (row, col) => cellValue(row, col),
): XlsxSheet {
  const header: XlsxCell[] = columns.map((c) => c.header);
  const body: XlsxCell[][] = rows.map((row) => columns.map((col) => toXlsxCell(valueOf(row, col))));
  return { name, rows: [header, ...body] };
}

/** Stringify a worksheet's typed cells to a plain string matrix so the CSV import pipeline
 *  (coerce/map) can consume it. null/undefined → '' ; Date → its String() form (re-parsed by
 *  coerceCsvValue for date columns); number/boolean → String(). */
export function sheetToMatrix(sheet: XlsxSheet): string[][] {
  return sheet.rows.map((row) => row.map((cell) => (cell == null ? '' : String(cell))));
}
