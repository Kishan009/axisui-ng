import type { GridColumnDef, RowId } from './grid-core';

export interface CellEdit {
  rowId: RowId;
  colKey: string;
  value: unknown;
}

export function editKey(rowId: RowId, colKey: string): string {
  return JSON.stringify([rowId, colKey]);
}

export function setEditEntry(
  edits: ReadonlyMap<string, CellEdit>,
  rowId: RowId,
  colKey: string,
  value: unknown
): Map<string, CellEdit> {
  const next = new Map(edits);
  next.set(editKey(rowId, colKey), { rowId, colKey, value });
  return next;
}

export function clearEditEntry(
  edits: ReadonlyMap<string, CellEdit>,
  rowId: RowId,
  colKey: string
): Map<string, CellEdit> {
  const next = new Map(edits);
  next.delete(editKey(rowId, colKey));
  return next;
}

export function clearSavedEntries(
  edits: ReadonlyMap<string, CellEdit>,
  saved: CellEdit[]
): Map<string, CellEdit> {
  const next = new Map(edits);
  for (const s of saved) {
    const key = editKey(s.rowId, s.colKey);
    const current = next.get(key);
    if (current && current.value === s.value) next.delete(key);
  }
  return next;
}

export function editedValue(
  edits: ReadonlyMap<string, CellEdit>,
  rowId: RowId,
  colKey: string
): unknown {
  return edits.get(editKey(rowId, colKey))?.value;
}

export function validateCell<T>(col: GridColumnDef<T>, value: unknown, row: T): string | null {
  return col.validator ? col.validator(value, row) : null;
}
