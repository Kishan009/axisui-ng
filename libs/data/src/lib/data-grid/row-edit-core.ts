import type { GridColumnDef } from './grid-core';

export function validateRowDrafts<T>(
  editableCols: GridColumnDef<T>[],
  row: T,
  drafts: ReadonlyMap<string, unknown>,
  colKeyOf: (c: GridColumnDef<T>) => string,
): Map<string, string> {
  const errors = new Map<string, string>();
  for (const col of editableCols) {
    if (!col.validator) continue;
    const key = colKeyOf(col);
    const msg = col.validator(drafts.get(key), row);
    if (msg) errors.set(key, msg);
  }
  return errors;
}

export function rowCommitEntries<T>(
  editableCols: GridColumnDef<T>[],
  drafts: ReadonlyMap<string, unknown>,
  colKeyOf: (c: GridColumnDef<T>) => string,
): { colKey: string; value: unknown }[] {
  return editableCols.map((col) => {
    const colKey = colKeyOf(col);
    return { colKey, value: drafts.get(colKey) };
  });
}
