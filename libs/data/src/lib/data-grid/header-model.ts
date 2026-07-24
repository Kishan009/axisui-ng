import type { GridColumnDef } from './grid-core';

export interface HeaderCell<T> {
  col: GridColumnDef<T>;
  colspan: number;
  rowspan: number;
  isGroup: boolean;
}

export function isGroupCol<T>(col: GridColumnDef<T>): boolean {
  return !!col.children && col.children.length > 0;
}

export function flattenLeaves<T>(columns: GridColumnDef<T>[]): GridColumnDef<T>[] {
  const out: GridColumnDef<T>[] = [];
  const walk = (cols: GridColumnDef<T>[]): void => {
    for (const c of cols) {
      if (isGroupCol(c)) walk(c.children ?? []);
      else out.push(c);
    }
  };
  walk(columns);
  return out;
}

export function treeDepth<T>(columns: GridColumnDef<T>[]): number {
  let d = 0;
  for (const c of columns) d = Math.max(d, isGroupCol(c) ? 1 + treeDepth(c.children ?? []) : 1);
  return d;
}

function visibleLeafCount<T>(col: GridColumnDef<T>, isHidden: (key: string) => boolean): number {
  if (!isGroupCol(col)) return isHidden(String(col.key)) ? 0 : 1;
  let n = 0;
  for (const c of col.children ?? []) n += visibleLeafCount(c, isHidden);
  return n;
}

export function headerRows<T>(
  columns: GridColumnDef<T>[],
  isHidden: (key: string) => boolean
): HeaderCell<T>[][] {
  const depth = treeDepth(columns);
  const rows: HeaderCell<T>[][] = Array.from({ length: depth }, () => []);
  const walk = (cols: GridColumnDef<T>[], level: number): void => {
    const row = rows[level];
    if (!row) return;
    for (const col of cols) {
      const vlc = visibleLeafCount(col, isHidden);
      if (vlc === 0) continue;
      if (isGroupCol(col)) {
        row.push({ col, colspan: vlc, rowspan: 1, isGroup: true });
        walk(col.children ?? [], level + 1);
      } else {
        row.push({ col, colspan: 1, rowspan: depth - level, isGroup: false });
      }
    }
  };
  walk(columns, 0);
  return rows;
}
