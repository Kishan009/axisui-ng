import { moveFocus, type FocusPos, type NavDims } from './grid-nav';

const dims: NavDims = { bodyCount: 3, colCount: 4, pageRows: 2 };
const at = (row: number, col: number): FocusPos => ({ row, col });

describe('moveFocus', () => {
  it('down/up move the row and clamp at the rendered edges', () => {
    expect(moveFocus(at(0, 1), 'down', dims)).toEqual(at(1, 1));
    expect(moveFocus(at(2, 1), 'down', dims)).toEqual(at(2, 1)); // clamp at last body row
    expect(moveFocus(at(0, 1), 'up', dims)).toEqual(at(-1, 1));   // body 0 -> header
    expect(moveFocus(at(-1, 1), 'up', dims)).toEqual(at(-1, 1));  // clamp at header
    expect(moveFocus(at(-1, 1), 'down', dims)).toEqual(at(0, 1)); // header -> body 0
  });

  it('left/right move the col and clamp', () => {
    expect(moveFocus(at(1, 1), 'right', dims)).toEqual(at(1, 2));
    expect(moveFocus(at(1, 3), 'right', dims)).toEqual(at(1, 3)); // clamp at last col
    expect(moveFocus(at(1, 1), 'left', dims)).toEqual(at(1, 0));
    expect(moveFocus(at(1, 0), 'left', dims)).toEqual(at(1, 0));  // clamp at col 0
  });

  it('home/end jump within the current row', () => {
    expect(moveFocus(at(1, 2), 'home', dims)).toEqual(at(1, 0));
    expect(moveFocus(at(1, 1), 'end', dims)).toEqual(at(1, 3));
  });

  it('pageup floors at body row 0 (not the header); pagedown clamps at the last body row', () => {
    expect(moveFocus(at(2, 1), 'pageup', dims)).toEqual(at(0, 1));   // 2 - 2 = 0
    expect(moveFocus(at(1, 1), 'pageup', dims)).toEqual(at(0, 1));   // 1 - 2 floors to 0
    expect(moveFocus(at(0, 1), 'pagedown', dims)).toEqual(at(2, 1)); // 0 + 2 = 2
    expect(moveFocus(at(2, 1), 'pagedown', dims)).toEqual(at(2, 1)); // clamp
  });

  it('ctrl-home/ctrl-end jump to the grid corners', () => {
    expect(moveFocus(at(2, 3), 'ctrl-home', dims)).toEqual(at(0, 0));
    expect(moveFocus(at(0, 0), 'ctrl-end', dims)).toEqual(at(2, 3));
  });

  it('degenerate: no body rows -> row clamps to the header', () => {
    const headerOnly: NavDims = { bodyCount: 0, colCount: 2, pageRows: 2 };
    expect(moveFocus(at(-1, 0), 'down', headerOnly)).toEqual(at(-1, 0));
    expect(moveFocus(at(-1, 1), 'ctrl-end', headerOnly)).toEqual(at(-1, 1));
    expect(moveFocus(at(-1, 0), 'ctrl-home', headerOnly)).toEqual(at(-1, 0));
  });
});
