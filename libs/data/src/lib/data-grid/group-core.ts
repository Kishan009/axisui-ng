import { asText, cellValue, type GridColumnDef } from './grid-core';

export type AggFn = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface GroupNode<T> {
  kind: 'group';
  level: number;
  key: keyof T;
  value: unknown;
  groupId: string;
  count: number;
  aggregates: Record<string, number>;
  children: GroupNode<T>[];
  leaves: T[];
}

export type DisplayRow<T> =
  | { kind: 'group'; node: GroupNode<T> }
  | { kind: 'leaf'; row: T }
  | { kind: 'group-loading'; level: number; groupId: string }
  | { kind: 'tree'; row: T; level: number; expandable: boolean }
  | { kind: 'detail'; row: T };

/** Aggregate the columns that declare an `aggregation`, keyed by `String(col.key)`. */
export function aggregate<T extends Record<string, unknown>>(
  rows: T[],
  columns: GridColumnDef<T>[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const col of columns) {
    if (!col.aggregation) continue;
    const k = String(col.key);
    if (col.aggregation === 'count') { out[k] = rows.length; continue; }
    const nums = rows.map((r) => Number(cellValue(r, col))).filter((n) => !Number.isNaN(n));
    if (nums.length === 0) { out[k] = 0; continue; }
    const sum = nums.reduce((a, b) => a + b, 0);
    out[k] = col.aggregation === 'sum' ? sum
      : col.aggregation === 'avg' ? sum / nums.length
      : col.aggregation === 'min' ? nums.reduce((a, b) => Math.min(a, b), Infinity)
      : nums.reduce((a, b) => Math.max(a, b), -Infinity);
  }
  return out;
}

function buildLevel<T extends Record<string, unknown>>(
  rows: T[],
  groupKeys: (keyof T)[],
  level: number,
  columns: GridColumnDef<T>[],
  parentPath: string
): GroupNode<T>[] {
  const key = groupKeys[level];
  if (key === undefined) return [];
  const col = columns.find((c) => c.key === key);
  const buckets: { value: unknown; rows: T[] }[] = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const value = col ? cellValue(row, col) : row[key];
    const k = asText(value);
    let bi = index.get(k);
    if (bi === undefined) { bi = buckets.length; index.set(k, bi); buckets.push({ value, rows: [] }); }
    const bucket = buckets[bi];
    if (bucket) bucket.rows.push(row);
  }
  return buckets.map(({ value, rows: groupRowsArr }) => {
    const groupId = `${parentPath}${level}:${String(key)}=${asText(value)}`;
    const isLeafLevel = level + 1 >= groupKeys.length;
    return {
      kind: 'group',
      level,
      key,
      value,
      groupId,
      count: groupRowsArr.length,
      aggregates: aggregate(groupRowsArr, columns),
      children: isLeafLevel ? [] : buildLevel(groupRowsArr, groupKeys, level + 1, columns, `${groupId}|`),
      leaves: isLeafLevel ? groupRowsArr : [],
    } satisfies GroupNode<T>;
  });
}

export function groupRows<T extends Record<string, unknown>>(
  rows: T[],
  groupKeys: (keyof T)[],
  columns: GridColumnDef<T>[]
): { groups: GroupNode<T>[]; grandTotals: Record<string, number> } {
  const grandTotals = aggregate(rows, columns);
  if (groupKeys.length === 0) return { groups: [], grandTotals };
  return { groups: buildLevel(rows, groupKeys, 0, columns, ''), grandTotals };
}

/** Depth-first display rows; a group recurses unless its id is in `collapsed` (absent => expanded). */
export function flattenGroups<T extends Record<string, unknown>>(
  groups: GroupNode<T>[],
  collapsed: ReadonlySet<string>
): DisplayRow<T>[] {
  const out: DisplayRow<T>[] = [];
  const walk = (nodes: GroupNode<T>[]): void => {
    for (const node of nodes) {
      out.push({ kind: 'group', node });
      if (collapsed.has(node.groupId)) continue;
      if (node.children.length > 0) walk(node.children);
      else for (const row of node.leaves) out.push({ kind: 'leaf', row });
    }
  };
  walk(groups);
  return out;
}
