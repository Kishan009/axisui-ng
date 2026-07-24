import type { GridColumnDef } from './grid-core';

export type PinSide = 'start' | 'end';

export interface ColumnState {
  order: string[];
  hidden: string[];
  pinned?: Record<string, PinSide>;
}

/** Full key order: state.order (existing keys only) then natural keys not yet listed. */
export function effectiveOrder<T>(columns: GridColumnDef<T>[], state: ColumnState): string[] {
  const natural = columns.map((c) => String(c.key));
  const present = new Set(natural);
  const ordered = state.order.filter((k) => present.has(k));
  const seen = new Set(ordered);
  for (const k of natural) if (!seen.has(k)) ordered.push(k);
  return ordered;
}

export function pinnedSideOf<T>(col: GridColumnDef<T>, state: ColumnState): PinSide | undefined {
  return state.pinned?.[String(col.key)] ?? col.pin;
}

/** Ordered, visible columns partitioned into [start-pinned, center, end-pinned]. */
export function resolveColumns<T>(columns: GridColumnDef<T>[], state: ColumnState): GridColumnDef<T>[] {
  const byKey = new Map(columns.map((c) => [String(c.key), c]));
  const hidden = new Set(state.hidden);
  const start: GridColumnDef<T>[] = [];
  const center: GridColumnDef<T>[] = [];
  const end: GridColumnDef<T>[] = [];
  for (const key of effectiveOrder(columns, state)) {
    if (hidden.has(key)) continue;
    const col = byKey.get(key);
    if (!col) continue;
    const side = pinnedSideOf(col, state);
    if (side === 'start') start.push(col);
    else if (side === 'end') end.push(col);
    else center.push(col);
  }
  return [...start, ...center, ...end];
}

/** Move `fromKey` to sit immediately before `toKey`. No-op if either is missing or equal. */
export function moveColumn(order: string[], fromKey: string, toKey: string): string[] {
  if (fromKey === toKey) return order;
  const from = order.indexOf(fromKey);
  const to = order.indexOf(toKey);
  if (from === -1 || to === -1) return order;
  const next = order.slice();
  next.splice(from, 1);
  next.splice(next.indexOf(toKey), 0, fromKey);
  return next;
}

export function toggleHidden(hidden: string[], key: string): string[] {
  return hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
}

export function pinnedSlots<T>(
  resolved: GridColumnDef<T>[],
  state: ColumnState
): { key: string; side: PinSide; slot: number }[] {
  let s = 0;
  let e = 0;
  const out: { key: string; side: PinSide; slot: number }[] = [];
  for (const col of resolved) {
    const side = pinnedSideOf(col, state);
    if (side === 'start') out.push({ key: String(col.key), side, slot: s++ });
    else if (side === 'end') out.push({ key: String(col.key), side, slot: e++ });
  }
  return out;
}

export function togglePin(
  pinned: Record<string, PinSide> | undefined,
  key: string,
  side: PinSide
): Record<string, PinSide> {
  const next = { ...(pinned ?? {}) };
  if (next[key] === side) delete next[key];
  else next[key] = side;
  return next;
}

export function cumulativeOffsets(widths: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const w of widths) {
    out.push(acc);
    acc += w;
  }
  return out;
}
