import type { RowId } from './grid-core';

export interface EditDelta {
  rowId: RowId;
  colKey: string;
  before: unknown;   // overlay value before the edit; undefined = cell was clean
  after: unknown;    // overlay value after the edit; undefined = cell became clean
}

/** Each undo/redo entry is a "step": one delta for a single edit, N for a batched paste. */
export interface EditHistory {
  undo: EditDelta[][];
  redo: EditDelta[][];
}

export const emptyHistory: EditHistory = { undo: [], redo: [] };

/** Push a batch of deltas as ONE undoable step. Empty batch → unchanged (no empty step). */
export function pushBatch(h: EditHistory, deltas: EditDelta[]): EditHistory {
  if (deltas.length === 0) return h;
  return { undo: [...h.undo, deltas], redo: [] };
}

/** Single-delta convenience: a length-1 step. */
export function pushDelta(h: EditHistory, delta: EditDelta): EditHistory {
  return pushBatch(h, [delta]);
}

export function undo(h: EditHistory): { history: EditHistory; deltas: EditDelta[] } | null {
  const step = h.undo[h.undo.length - 1];
  if (step === undefined) return null;
  return { history: { undo: h.undo.slice(0, -1), redo: [...h.redo, step] }, deltas: step };
}

export function redo(h: EditHistory): { history: EditHistory; deltas: EditDelta[] } | null {
  const step = h.redo[h.redo.length - 1];
  if (step === undefined) return null;
  return { history: { undo: [...h.undo, step], redo: h.redo.slice(0, -1) }, deltas: step };
}

export function canUndo(h: EditHistory): boolean {
  return h.undo.length > 0;
}

export function canRedo(h: EditHistory): boolean {
  return h.redo.length > 0;
}
