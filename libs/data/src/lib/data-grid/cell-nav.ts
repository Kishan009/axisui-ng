import type { RowId } from './grid-core';

export interface CellPos {
  rowIndex: number;
  colKey: string;
}

export function nextEditableCell(
  rows: RowId[],
  editableColKeys: string[],
  current: CellPos
): CellPos | null {
  const colIndex = editableColKeys.indexOf(current.colKey);
  if (colIndex === -1) return null;
  const nextCol = editableColKeys[colIndex + 1];
  if (nextCol !== undefined) return { rowIndex: current.rowIndex, colKey: nextCol };
  const firstCol = editableColKeys[0];
  if (firstCol !== undefined && current.rowIndex + 1 < rows.length) {
    return { rowIndex: current.rowIndex + 1, colKey: firstCol };
  }
  return null;
}

export function prevEditableCell(
  rows: RowId[],
  editableColKeys: string[],
  current: CellPos
): CellPos | null {
  const colIndex = editableColKeys.indexOf(current.colKey);
  if (colIndex === -1) return null;
  const prevCol = editableColKeys[colIndex - 1];
  if (prevCol !== undefined) return { rowIndex: current.rowIndex, colKey: prevCol };
  const lastCol = editableColKeys[editableColKeys.length - 1];
  if (lastCol !== undefined && current.rowIndex - 1 >= 0) {
    return { rowIndex: current.rowIndex - 1, colKey: lastCol };
  }
  return null;
}
