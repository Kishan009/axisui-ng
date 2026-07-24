import { cellText, clampMenuPosition, columnMenuItems, rowTsv, type ColumnMenuFlags } from './menu-core';

const base: ColumnMenuFlags = { sortDir: null, pinned: null, filterable: true, hidable: true };
const ids = (f: ColumnMenuFlags) => columnMenuItems(f).map((i) => i.id);
const byId = (f: ColumnMenuFlags, id: string) => columnMenuItems(f).find((i) => i.id === id);

describe('columnMenuItems', () => {
  it('includes all sort/pin/hide/reset ids and filter when filterable', () => {
    expect(ids(base)).toEqual([
      'sort-asc', 'sort-desc', 'sort-clear', 'pin-start', 'pin-end', 'unpin', 'hide', 'reset-width', 'filter',
    ]);
  });

  it('omits the filter item when the column is not filterable', () => {
    expect(ids({ ...base, filterable: false })).not.toContain('filter');
  });

  it('disables the current sort direction and enables clear only when sorted', () => {
    expect(byId({ ...base, sortDir: 'asc' }, 'sort-asc')?.disabled).toBe(true);
    expect(byId({ ...base, sortDir: 'asc' }, 'sort-desc')?.disabled).toBe(false);
    expect(byId({ ...base, sortDir: null }, 'sort-clear')?.disabled).toBe(true);
    expect(byId({ ...base, sortDir: 'desc' }, 'sort-clear')?.disabled).toBe(false);
  });

  it('disables the active pin side and enables unpin only when pinned', () => {
    expect(byId({ ...base, pinned: 'start' }, 'pin-start')?.disabled).toBe(true);
    expect(byId({ ...base, pinned: null }, 'unpin')?.disabled).toBe(true);
    expect(byId({ ...base, pinned: 'end' }, 'unpin')?.disabled).toBe(false);
  });

  it('disables hide when the column is the last visible one', () => {
    expect(byId({ ...base, hidable: false }, 'hide')?.disabled).toBe(true);
  });

  it('marks the pin-group and hide-group start with a separator', () => {
    expect(byId(base, 'pin-start')?.separatorBefore).toBe(true);
    expect(byId(base, 'hide')?.separatorBefore).toBe(true);
  });
});

describe('copy text builders', () => {
  it('cellText passes a value through', () => {
    expect(cellText('hello')).toBe('hello');
  });
  it('rowTsv joins cells with tabs', () => {
    expect(rowTsv(['a', 'b', 'c'])).toBe('a\tb\tc');
  });
});

describe('clampMenuPosition', () => {
  const vp = { width: 1000, height: 800 };
  const size = { width: 200, height: 300 };

  it('returns the anchor unchanged when the menu fits', () => {
    expect(clampMenuPosition({ x: 100, y: 100 }, size, vp)).toEqual({ x: 100, y: 100 });
  });
  it('flips left when the menu would overflow the right edge', () => {
    expect(clampMenuPosition({ x: 900, y: 100 }, size, vp)).toEqual({ x: 800, y: 100 });
  });
  it('flips up when the menu would overflow the bottom edge', () => {
    expect(clampMenuPosition({ x: 100, y: 700 }, size, vp)).toEqual({ x: 100, y: 500 });
  });
  it('never returns negative coordinates', () => {
    expect(clampMenuPosition({ x: 10, y: 10 }, { width: 200, height: 300 }, { width: 100, height: 100 }))
      .toEqual({ x: 0, y: 0 });
  });
});
