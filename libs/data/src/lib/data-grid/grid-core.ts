import type { TemplateRef } from '@angular/core'; // type-only — erased at runtime, core stays pure

export type SortDir = 'asc' | 'desc';
export type RowId = string | number;
export type Density = 'dense' | 'compact' | 'comfortable' | 'spacious';

export interface GridColumnDef<T> {
  key: keyof T;
  header: string;
  // sizing
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  // layout (activated in later phases)
  pin?: 'start' | 'end';
  hidden?: boolean;
  children?: GridColumnDef<T>[];
  // behavior
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'number' | 'date' | 'set';
  searchable?: boolean;
  /** Higher = kept/shown first in responsive card mode; used as the card title. @default 0 */
  priority?: number;
  align?: 'start' | 'end';
  editable?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  // rendering
  valueGetter?: (row: T) => unknown;
  cellTemplate?: TemplateRef<{ $implicit: T; value: unknown }>;
  headerTemplate?: TemplateRef<{ $implicit: GridColumnDef<T> }>;
  footerTemplate?: TemplateRef<{ $implicit: unknown }>;
  cellClass?: (row: T, value: unknown) => string | undefined;
  validator?: (value: unknown, row: T) => string | null;
  cellEditorTemplate?: TemplateRef<{ $implicit: T; value: unknown; col: GridColumnDef<T>; onChange: (v: unknown) => void }>;
}

export interface SortState<T> {
  key: keyof T;
  dir: SortDir;
}

/** Resolve the display value for a cell: `valueGetter` if present, else `row[key]`. */
export function cellValue<T extends Record<string, unknown>>(row: T, col: GridColumnDef<T>): unknown {
  return col.valueGetter ? col.valueGetter(row) : row[col.key];
}

/** Safe string coercion for filtering: primitives via `String`, objects via JSON, nullish → ''. */
export function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
}

export function globalFilter<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  columns: GridColumnDef<T>[]
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return rows;
  const cols = columns.filter((c) => c.searchable !== false);
  return rows.filter((row) =>
    cols.some((c) => asText(cellValue(row, c)).toLowerCase().includes(q))
  );
}

export function columnFilter<T extends Record<string, unknown>>(
  rows: T[],
  filters: Record<string, string>,
  columns: GridColumnDef<T>[]
): T[] {
  const active = columns
    .filter((c) => c.filterable && (filters[String(c.key)] ?? '').trim() !== '')
    .map((c) => ({ col: c, term: (filters[String(c.key)] ?? '').toLowerCase().trim() }));
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every(({ col, term }) => asText(cellValue(row, col)).toLowerCase().includes(term))
  );
}

export function sortRows<T extends Record<string, unknown>>(rows: T[], sorts: SortState<T>[]): T[] {
  if (sorts.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const { key, dir } of sorts) {
      const factor = dir === 'asc' ? 1 : -1;
      const av = a[key];
      const bv = b[key];
      if (av === bv) continue;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      if (av == null) return 1;            // nulls/undefined sort last, regardless of dir
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv));
      if (cmp !== 0) return cmp * factor;
    }
    return 0;
  });
}

export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) return rows;
  const start = page * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function toggleRow(selected: ReadonlySet<RowId>, id: RowId): Set<RowId> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function toggleAll(selected: ReadonlySet<RowId>, ids: RowId[]): Set<RowId> {
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const next = new Set(selected);
  if (allSelected) ids.forEach((id) => next.delete(id));
  else ids.forEach((id) => next.add(id));
  return next;
}

export function selectionState(selected: ReadonlySet<RowId>, ids: RowId[]): 'none' | 'some' | 'all' {
  if (ids.length === 0) return 'none';
  let count = 0;
  for (const id of ids) if (selected.has(id)) count++;
  if (count === 0) return 'none';
  return count === ids.length ? 'all' : 'some';
}

export function applyRange(
  selected: ReadonlySet<RowId>,
  ids: RowId[],
  anchor: RowId,
  target: RowId,
  add: boolean,
): Set<RowId> {
  const from = ids.indexOf(anchor);
  const to = ids.indexOf(target);
  const next = new Set(selected);
  const apply = (id: RowId): void => { if (add) next.add(id); else next.delete(id); };
  if (from === -1 || to === -1) { apply(target); return next; }
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  for (let i = lo; i <= hi; i++) {
    const id = ids[i];
    if (id !== undefined) apply(id);
  }
  return next;
}

export function clampWidth(px: number, min: number, max?: number): number {
  const lo = Math.max(px, min);
  return max != null ? Math.min(lo, max) : lo;
}
