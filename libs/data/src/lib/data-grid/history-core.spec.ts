import {
  emptyHistory, pushDelta, pushBatch, undo, redo, canUndo, canRedo,
  type EditDelta, type EditHistory,
} from './history-core';

const d = (rowId: number, colKey: string, before: unknown, after: unknown): EditDelta =>
  ({ rowId, colKey, before, after });

describe('history-core', () => {
  it('emptyHistory has two empty stacks', () => {
    expect(emptyHistory).toEqual({ undo: [], redo: [] });
  });

  it('pushDelta appends a length-1 step and clears redo', () => {
    const seeded: EditHistory = { undo: [], redo: [[d(1, 'name', undefined, 'X')]] };
    const next = pushDelta(seeded, d(2, 'age', undefined, 5));
    expect(next.undo).toEqual([[d(2, 'age', undefined, 5)]]);
    expect(next.redo).toEqual([]);
  });

  it('pushBatch appends one multi-delta step and clears redo', () => {
    const batch = [d(1, 'name', undefined, 'A'), d(2, 'name', undefined, 'B')];
    const next = pushBatch(emptyHistory, batch);
    expect(next.undo).toEqual([batch]);
    expect(next.redo).toEqual([]);
  });

  it('pushBatch with an empty array is a no-op (no empty step)', () => {
    const seeded: EditHistory = { undo: [[d(1, 'name', undefined, 'A')]], redo: [] };
    expect(pushBatch(seeded, [])).toBe(seeded);
  });

  it('undo moves the top step from undo to redo and returns its deltas', () => {
    const step = [d(1, 'name', 'A', 'B'), d(2, 'age', 1, 2)];
    const h: EditHistory = { undo: [[d(1, 'name', undefined, 'A')], step], redo: [] };
    const result = undo(h);
    expect(result).not.toBeNull();
    expect(result!.deltas).toEqual(step);
    expect(result!.history.undo).toEqual([[d(1, 'name', undefined, 'A')]]);
    expect(result!.history.redo).toEqual([step]);
  });

  it('redo moves the top step from redo to undo and returns its deltas', () => {
    const step = [d(1, 'name', 'A', 'B')];
    const h: EditHistory = { undo: [[d(1, 'name', undefined, 'A')]], redo: [step] };
    const result = redo(h);
    expect(result).not.toBeNull();
    expect(result!.deltas).toEqual(step);
    expect(result!.history.undo).toEqual([[d(1, 'name', undefined, 'A')], step]);
    expect(result!.history.redo).toEqual([]);
  });

  it('a batch undoes and redoes as ONE step', () => {
    const batch = [d(1, 'name', undefined, 'A'), d(2, 'name', undefined, 'B')];
    let h = pushBatch(emptyHistory, batch);
    const u = undo(h)!;
    expect(u.deltas).toEqual(batch);
    expect(u.history.undo).toEqual([]);
    h = u.history;
    const r = redo(h)!;
    expect(r.deltas).toEqual(batch);
    expect(r.history.undo).toEqual([batch]);
  });

  it('undo and redo on empty stacks return null', () => {
    expect(undo(emptyHistory)).toBeNull();
    expect(redo(emptyHistory)).toBeNull();
  });

  it('canUndo / canRedo reflect stack sizes', () => {
    expect(canUndo(emptyHistory)).toBe(false);
    expect(canRedo(emptyHistory)).toBe(false);
    expect(canUndo({ undo: [[d(1, 'name', undefined, 'A')]], redo: [] })).toBe(true);
    expect(canRedo({ undo: [], redo: [[d(1, 'name', undefined, 'A')]] })).toBe(true);
  });

  it('pushDelta after an undo truncates the redo stack', () => {
    let h: EditHistory = { undo: [[d(1, 'name', undefined, 'A')]], redo: [] };
    h = undo(h)!.history;
    h = pushDelta(h, d(2, 'age', undefined, 9));
    expect(h.redo).toEqual([]);
    expect(h.undo).toEqual([[d(2, 'age', undefined, 9)]]);
  });

  it('does not mutate its inputs', () => {
    const h: EditHistory = { undo: [[d(1, 'name', undefined, 'A')]], redo: [] };
    pushDelta(h, d(2, 'age', undefined, 9));
    pushBatch(h, [d(3, 'x', undefined, 1)]);
    undo(h);
    expect(h.undo).toEqual([[d(1, 'name', undefined, 'A')]]);
    expect(h.redo).toEqual([]);
  });
});
