import type { RowId } from './grid-core';
import type { DisplayRow } from './group-core';

export interface LazyNode<T> {
  row: T;
  level: number;
  expanded: boolean;
  loading: boolean;
  children?: LazyNode<T>[];
}

export function buildLazyNodes<T>(rows: T[], level: number): LazyNode<T>[] {
  return rows.map((row) => ({ row, level, expanded: false, loading: false }));
}

export function findLazy<T>(nodes: LazyNode<T>[], id: RowId, getId: (row: T) => RowId): LazyNode<T> | undefined {
  for (const n of nodes) {
    if (getId(n.row) === id) return n;
    if (n.children) {
      const found = findLazy(n.children, id, getId);
      if (found) return found;
    }
  }
  return undefined;
}

export function setLazyAt<T>(
  nodes: LazyNode<T>[],
  id: RowId,
  getId: (row: T) => RowId,
  patch: Partial<Omit<LazyNode<T>, 'row' | 'level'>>
): LazyNode<T>[] {
  return nodes.map((n) => {
    if (getId(n.row) === id) return { ...n, ...patch };
    if (n.children) return { ...n, children: setLazyAt(n.children, id, getId, patch) };
    return n;
  });
}

export function flattenLazy<T>(
  nodes: LazyNode<T>[],
  hasChildren: (row: T) => boolean,
  getId: (row: T) => RowId,
  maxLevel: number
): DisplayRow<T>[] {
  const out: DisplayRow<T>[] = [];
  const walk = (list: LazyNode<T>[]): void => {
    for (const n of list) {
      const expandable = hasChildren(n.row) && n.level < maxLevel;
      out.push({ kind: 'tree', row: n.row, level: n.level, expandable });
      if (!n.expanded) continue;
      if (n.children) walk(n.children);
      else if (n.loading) out.push({ kind: 'group-loading', level: n.level + 1, groupId: String(getId(n.row)) });
    }
  };
  walk(nodes);
  return out;
}
