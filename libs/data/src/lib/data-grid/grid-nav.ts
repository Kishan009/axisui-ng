export interface FocusPos {
  row: number; // -1 = leaf header row; 0..bodyCount-1 = rendered body rows
  col: number; // 0..colCount-1 across (optional) selection col + leaf data columns
}

export type NavKey =
  | 'up' | 'down' | 'left' | 'right' | 'home' | 'end'
  | 'pageup' | 'pagedown' | 'ctrl-home' | 'ctrl-end';

export interface NavDims {
  bodyCount: number;
  colCount: number;
  pageRows: number;
}

export function moveFocus(pos: FocusPos, key: NavKey, dims: NavDims): FocusPos {
  const lastRow = dims.bodyCount - 1;
  const lastCol = dims.colCount - 1;
  const clampRow = (r: number): number => Math.min(Math.max(r, -1), lastRow);
  const clampCol = (c: number): number => Math.min(Math.max(c, 0), lastCol);
  switch (key) {
    case 'up': return { row: clampRow(pos.row - 1), col: pos.col };
    case 'down': return { row: clampRow(pos.row + 1), col: pos.col };
    case 'left': return { row: pos.row, col: clampCol(pos.col - 1) };
    case 'right': return { row: pos.row, col: clampCol(pos.col + 1) };
    case 'home': return { row: pos.row, col: 0 };
    case 'end': return { row: pos.row, col: lastCol };
    case 'pageup': return { row: clampRow(Math.max(pos.row - dims.pageRows, 0)), col: pos.col };
    case 'pagedown': return { row: clampRow(pos.row + dims.pageRows), col: pos.col };
    case 'ctrl-home': return { row: clampRow(0), col: 0 };
    case 'ctrl-end': return { row: clampRow(lastRow), col: lastCol };
  }
}
