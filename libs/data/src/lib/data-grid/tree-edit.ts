import type { FilterCombinator, FilterCondition, FilterGroup, FilterNode } from './filter-model';

/** Path of child indices from the root group to a node. `[]` is the root group itself. */
export type NodePath = number[];

function mapGroupAt<T>(
  root: FilterGroup<T>,
  path: NodePath,
  fn: (group: FilterGroup<T>) => FilterGroup<T>
): FilterGroup<T> {
  if (path.length === 0) return fn(root);
  const [head, ...rest] = path;
  const child = head === undefined ? undefined : root.children[head];
  if (head === undefined || !child || child.kind !== 'group') return root;
  const updated = mapGroupAt(child, rest, fn);
  const children = root.children.slice();
  children[head] = updated;
  return { ...root, children };
}

export function addChild<T>(root: FilterGroup<T>, groupPath: NodePath, node: FilterNode<T>): FilterGroup<T> {
  return mapGroupAt(root, groupPath, (g) => ({ ...g, children: [...g.children, node] }));
}

export function removeNode<T>(root: FilterGroup<T>, path: NodePath): FilterGroup<T> {
  if (path.length === 0) return root; // cannot remove the root
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  if (index === undefined) return root;
  return mapGroupAt(root, parentPath, (g) => ({
    ...g,
    children: g.children.filter((_, i) => i !== index),
  }));
}

export function updateCondition<T>(
  root: FilterGroup<T>,
  path: NodePath,
  patch: Partial<Omit<FilterCondition<T>, 'kind'>>
): FilterGroup<T> {
  if (path.length === 0) return root;
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  if (index === undefined) return root;
  return mapGroupAt(root, parentPath, (g) => {
    const children = g.children.slice();
    const target = children[index];
    if (target && target.kind === 'condition') children[index] = { ...target, ...patch };
    return { ...g, children };
  });
}

export function setCombinator<T>(root: FilterGroup<T>, groupPath: NodePath, combinator: FilterCombinator): FilterGroup<T> {
  return mapGroupAt(root, groupPath, (g) => ({ ...g, combinator }));
}
