import { type GridColumnDef } from './grid-core';

/** Orders columns by `priority` (desc, missing = 0), stable within equal priority.
 *  The first element is the responsive card's title field; the rest stack as label:value. */
export function orderByPriority<T>(columns: GridColumnDef<T>[]): GridColumnDef<T>[] {
  return columns
    .map((col, i) => ({ col, i }))
    .sort((a, b) => (b.col.priority ?? 0) - (a.col.priority ?? 0) || a.i - b.i)
    .map((e) => e.col);
}
