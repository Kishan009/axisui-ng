import { asText } from './grid-core';
import type { DisplayRow, GroupNode } from './group-core';
import type { ServerGroupRow } from './grid-data-source';

export interface ServerNode<T> {
  row: ServerGroupRow;
  level: number;
  groupId: string;
  path: unknown[];
  expanded: boolean;
  loading: boolean;
  children?: ServerNode<T>[];
  leaves?: T[];
}

/** Stable id for a group value path, e.g. ['US','NYC'] -> "0=US|1=NYC". */
export function groupIdOf(path: unknown[]): string {
  return path.map((v, i) => `${i}=${asText(v)}`).join('|');
}

export function buildNodes<T>(groups: ServerGroupRow[], parentPath: unknown[], level: number): ServerNode<T>[] {
  return groups.map((row) => {
    const path = [...parentPath, row.value];
    return { row, level, groupId: groupIdOf(path), path, expanded: false, loading: false };
  });
}

export function findNode<T>(nodes: ServerNode<T>[], path: unknown[]): ServerNode<T> | undefined {
  const targetId = groupIdOf(path);
  const search = (list: ServerNode<T>[]): ServerNode<T> | undefined => {
    for (const n of list) {
      if (n.groupId === targetId) return n;
      if (n.children) {
        const found = search(n.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return search(nodes);
}

export function setNodeAt<T>(
  nodes: ServerNode<T>[],
  path: unknown[],
  patch: Partial<Omit<ServerNode<T>, 'groupId' | 'path' | 'level'>>
): ServerNode<T>[] {
  const targetId = groupIdOf(path);
  const map = (list: ServerNode<T>[]): ServerNode<T>[] =>
    list.map((n) => {
      if (n.groupId === targetId) return { ...n, ...patch };
      if (n.children) return { ...n, children: map(n.children) };
      return n;
    });
  return map(nodes);
}

function toGroupNode<T>(n: ServerNode<T>): GroupNode<T> {
  return {
    kind: 'group',
    level: n.level,
    key: n.row.field as keyof T,
    value: n.row.value,
    groupId: n.groupId,
    count: n.row.count,
    aggregates: n.row.aggregates,
    children: [],
    leaves: [],
  };
}

/** Depth-first display rows for the lazy server tree (group rows + loaded children/leaves). */
export function flattenServer<T>(nodes: ServerNode<T>[]): DisplayRow<T>[] {
  const out: DisplayRow<T>[] = [];
  const walk = (list: ServerNode<T>[]): void => {
    for (const n of list) {
      out.push({ kind: 'group', node: toGroupNode(n) });
      if (!n.expanded) continue;
      if (n.children) walk(n.children);
      else if (n.leaves) for (const row of n.leaves) out.push({ kind: 'leaf', row });
      else if (n.loading) out.push({ kind: 'group-loading', level: n.level + 1, groupId: n.groupId });
    }
  };
  walk(nodes);
  return out;
}
