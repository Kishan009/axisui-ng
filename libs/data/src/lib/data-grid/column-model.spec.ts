import { effectiveOrder, resolveColumns, moveColumn, toggleHidden, type ColumnState, pinnedSideOf, pinnedSlots, togglePin, cumulativeOffsets, type PinSide } from './column-model';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { a: string; b: string; c: string }
const COLS: GridColumnDef<Row>[] = [
  { key: 'a', header: 'A' }, { key: 'b', header: 'B' }, { key: 'c', header: 'C' },
];

describe('column-model', () => {
  it('effectiveOrder: empty state = natural order', () => {
    expect(effectiveOrder(COLS, { order: [], hidden: [] })).toEqual(['a', 'b', 'c']);
  });
  it('effectiveOrder: applies order, appends new cols, drops stale keys', () => {
    expect(effectiveOrder(COLS, { order: ['c', 'a', 'zzz'], hidden: [] })).toEqual(['c', 'a', 'b']);
  });
  it('resolveColumns: identity on empty state', () => {
    expect(resolveColumns(COLS, { order: [], hidden: [] })).toEqual(COLS);
  });
  it('resolveColumns: applies order and drops hidden', () => {
    const out = resolveColumns(COLS, { order: ['c', 'b', 'a'], hidden: ['b'] });
    expect(out.map((c) => c.key)).toEqual(['c', 'a']);
  });
  it('moveColumn: drops before the target', () => {
    expect(moveColumn(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
    expect(moveColumn(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'a', 'c']);
  });
  it('moveColumn: no-op on missing/equal', () => {
    expect(moveColumn(['a', 'b'], 'x', 'a')).toEqual(['a', 'b']);
    expect(moveColumn(['a', 'b'], 'a', 'a')).toEqual(['a', 'b']);
  });
  it('toggleHidden flips membership', () => {
    expect(toggleHidden([], 'a')).toEqual(['a']);
    expect(toggleHidden(['a'], 'a')).toEqual([]);
  });
});

const PINCOLS: GridColumnDef<Row>[] = [
  { key: 'a', header: 'A' }, { key: 'b', header: 'B', pin: 'end' }, { key: 'c', header: 'C' },
];

describe('column-model pinning', () => {
  it('pinnedSideOf: state overrides def', () => {
    expect(pinnedSideOf(PINCOLS[1], { order: [], hidden: [] })).toBe('end');
    expect(pinnedSideOf(PINCOLS[0], { order: [], hidden: [], pinned: { a: 'start' } })).toBe('start');
    expect(pinnedSideOf(PINCOLS[1], { order: [], hidden: [], pinned: { b: 'start' } })).toBe('start');
  });
  it('resolveColumns partitions [start, center, end]', () => {
    const out = resolveColumns(PINCOLS, { order: [], hidden: [], pinned: { c: 'start' } });
    expect(out.map((c) => c.key)).toEqual(['c', 'a', 'b']);
  });
  it('resolveColumns identity when no pins', () => {
    const out = resolveColumns([{ key: 'a', header: 'A' }, { key: 'c', header: 'C' }], { order: [], hidden: [] });
    expect(out.map((c) => c.key)).toEqual(['a', 'c']);
  });
  it('pinnedSlots assigns per-band slot indices', () => {
    const state: ColumnState = { order: [], hidden: [], pinned: { c: 'start', a: 'start' } };
    const resolved = resolveColumns(PINCOLS, state);
    const slots = pinnedSlots(resolved, state);
    expect(slots.filter((s) => s.side === 'start').map((s) => [s.key, s.slot])).toEqual([['a', 0], ['c', 1]]);
    expect(slots.filter((s) => s.side === 'end').map((s) => [s.key, s.slot])).toEqual([['b', 0]]);
  });
  it('togglePin sets, switches, and unpins', () => {
    expect(togglePin(undefined, 'a', 'start')).toEqual({ a: 'start' });
    expect(togglePin({ a: 'start' }, 'a', 'end')).toEqual({ a: 'end' });
    expect(togglePin({ a: 'start' }, 'a', 'start')).toEqual({});
  });
  it('cumulativeOffsets = prefix sums', () => {
    expect(cumulativeOffsets([100, 50, 80])).toEqual([0, 100, 150]);
    expect(cumulativeOffsets([])).toEqual([]);
  });
});
