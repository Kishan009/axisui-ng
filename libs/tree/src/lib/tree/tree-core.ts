/**
 * Pure tree model helpers — flattening the visible nodes and computing the
 * cascading checkbox selection state. No DOM; table-tested.
 */
import type { AxIconName } from '@axisui-ng/icons';

export type TreeId = string | number;

export interface TreeNode {
  id: TreeId;
  label?: string;
  children?: TreeNode[];
  disabled?: boolean;
  icon?: AxIconName;
  /** Lazy hint: children exist but aren't loaded yet. */
  hasChildren?: boolean;
  data?: unknown;
}

/** A node projected into the flat, depth-tagged visible list. */
export interface FlatNode {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  expandable: boolean;
  /** 1-based position among its siblings under the same parent (aria-posinset). */
  posinset: number;
  /** Number of siblings at this level under the same parent (aria-setsize). */
  setsize: number;
}

export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

type LoadedMap = ReadonlyMap<TreeId, TreeNode[]>;

function childrenOf(node: TreeNode, loaded?: LoadedMap): TreeNode[] {
  return node.children ?? loaded?.get(node.id) ?? [];
}

/** Whether a node can expand (has loaded children or a lazy hint). */
export function isExpandable(node: TreeNode, loaded?: LoadedMap): boolean {
  return childrenOf(node, loaded).length > 0 || !!node.hasChildren;
}

/** Flatten the tree into the rows currently visible given `expanded`. */
export function flatten(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<TreeId>,
  loaded?: LoadedMap
): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (list: readonly TreeNode[], depth: number): void => {
    const setsize = list.length;
    list.forEach((node, i) => {
      const expandable = isExpandable(node, loaded);
      const isOpen = expandable && expanded.has(node.id);
      out.push({ node, depth, expanded: isOpen, expandable, posinset: i + 1, setsize });
      if (isOpen) walk(childrenOf(node, loaded), depth + 1);
    });
  };
  walk(nodes, 0);
  return out;
}

/** A node's id plus all of its (loaded) descendant ids. */
export function collectIds(node: TreeNode, loaded?: LoadedMap): TreeId[] {
  const ids: TreeId[] = [node.id];
  for (const child of childrenOf(node, loaded)) ids.push(...collectIds(child, loaded));
  return ids;
}

/** Toggle `node` (and cascade to descendants) in the checked set; returns a new set. */
export function setChecked(
  node: TreeNode,
  on: boolean,
  checked: ReadonlySet<TreeId>,
  loaded?: LoadedMap
): Set<TreeId> {
  const next = new Set(checked);
  for (const id of collectIds(node, loaded)) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}

/** Tri-state checkbox state for a node, derived from its descendants. */
export function checkState(
  node: TreeNode,
  checked: ReadonlySet<TreeId>,
  loaded?: LoadedMap
): CheckState {
  const kids = childrenOf(node, loaded);
  if (kids.length === 0) return checked.has(node.id) ? 'checked' : 'unchecked';
  let all = true;
  let none = true;
  for (const child of kids) {
    const state = checkState(child, checked, loaded);
    if (state !== 'checked') all = false;
    if (state !== 'unchecked') none = false;
  }
  return all ? 'checked' : none ? 'unchecked' : 'indeterminate';
}

/** Depth-first lookup of a node by id (searches loaded lazy children too). */
export function findNode(nodes: readonly TreeNode[], id: TreeId, loaded?: LoadedMap): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(childrenOf(node, loaded), id, loaded);
    if (found) return found;
  }
  return undefined;
}

/**
 * Prune the tree to nodes whose label matches `query` (case-insensitive) or have
 * a matching descendant. A self-matching node keeps its full subtree; a node kept
 * only for descendants keeps the pruned subtree. Returns the pruned tree plus the
 * ids that should be auto-expanded to reveal matches. Empty query → a passthrough.
 */
export function filterTree(
  nodes: readonly TreeNode[],
  query: string
): { nodes: TreeNode[]; expandedIds: TreeId[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { nodes: [...nodes], expandedIds: [] };
  const expandedIds: TreeId[] = [];
  const prune = (list: readonly TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = [];
    for (const node of list) {
      const selfMatch = (node.label ?? '').toLowerCase().includes(q);
      const prunedKids = prune(node.children ?? []);
      if (selfMatch) {
        out.push(node);
        if (prunedKids.length > 0) expandedIds.push(node.id);
      } else if (prunedKids.length > 0) {
        out.push({ ...node, children: prunedKids });
        expandedIds.push(node.id);
      }
    }
    return out;
  };
  return { nodes: prune(nodes), expandedIds };
}
