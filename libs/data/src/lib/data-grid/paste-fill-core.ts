import type { GridColumnDef } from './grid-core';

export interface FillTarget<T> {
  rowIndex: number;
  col: GridColumnDef<T>;
  raw: string;
}

/** Geometry for a fill paste: walk the parsed block (row 0 = data, NO header) from the anchor
 *  cell down/right, clip to the visible row count and column list, and SKIP non-editable target
 *  columns. Returns one FillTarget per writable cell (rowIndex indexes the visible rows). */
export function planFill<T>(
  matrix: string[][],
  anchor: { rowIndex: number; colIndex: number },
  columns: GridColumnDef<T>[],
  rowCount: number,
): FillTarget<T>[] {
  const out: FillTarget<T>[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const targetRow = anchor.rowIndex + r;
    if (targetRow >= rowCount) break;
    const cells = matrix[r] ?? [];
    for (let c = 0; c < cells.length; c++) {
      const col = columns[anchor.colIndex + c];
      if (col === undefined) break;
      if (!col.editable) continue;
      out.push({ rowIndex: targetRow, col, raw: cells[c] ?? '' });
    }
  }
  return out;
}
