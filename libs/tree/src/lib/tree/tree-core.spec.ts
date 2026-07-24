import {
  checkState,
  collectIds,
  filterTree,
  findNode,
  flatten,
  isExpandable,
  setChecked,
  type TreeNode,
} from './tree-core';

const TREE: TreeNode[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      { id: 'a2', label: 'A2', children: [{ id: 'a2x', label: 'A2x' }] },
    ],
  },
  { id: 'b', label: 'B' },
];

describe('tree-core', () => {
  describe('flatten', () => {
    it('shows only roots when nothing is expanded', () => {
      const flat = flatten(TREE, new Set());
      expect(flat.map((f) => f.node.id)).toEqual(['a', 'b']);
      expect(flat[0].expandable).toBe(true);
      expect(flat[1].expandable).toBe(false);
    });

    it('reveals children of expanded nodes with depth', () => {
      const flat = flatten(TREE, new Set(['a']));
      expect(flat.map((f) => f.node.id)).toEqual(['a', 'a1', 'a2', 'b']);
      expect(flat.find((f) => f.node.id === 'a1')?.depth).toBe(1);
    });

    it('recurses into nested expanded nodes', () => {
      const flat = flatten(TREE, new Set(['a', 'a2']));
      expect(flat.map((f) => f.node.id)).toEqual(['a', 'a1', 'a2', 'a2x', 'b']);
      expect(flat.find((f) => f.node.id === 'a2x')?.depth).toBe(2);
    });

    it('computes aria posinset/setsize per sibling group', () => {
      const flat = flatten(TREE, new Set(['a']));
      // roots a, b → setsize 2
      const a = flat.find((f) => f.node.id === 'a')!;
      const b = flat.find((f) => f.node.id === 'b')!;
      expect([a.posinset, a.setsize]).toEqual([1, 2]);
      expect([b.posinset, b.setsize]).toEqual([2, 2]);
      // children a1, a2 → setsize 2 under parent a
      const a1 = flat.find((f) => f.node.id === 'a1')!;
      const a2 = flat.find((f) => f.node.id === 'a2')!;
      expect([a1.posinset, a1.setsize]).toEqual([1, 2]);
      expect([a2.posinset, a2.setsize]).toEqual([2, 2]);
    });

    it('treats a lazy node (hasChildren) as expandable; loaded map supplies children', () => {
      const lazy: TreeNode[] = [{ id: 'r', label: 'R', hasChildren: true }];
      expect(isExpandable(lazy[0])).toBe(true);
      const loaded = new Map([['r', [{ id: 'r1', label: 'R1' }]]]);
      const flat = flatten(lazy, new Set(['r']), loaded);
      expect(flat.map((f) => f.node.id)).toEqual(['r', 'r1']);
    });
  });

  describe('collectIds', () => {
    it('returns the node and all descendants', () => {
      expect(collectIds(TREE[0]).sort()).toEqual(['a', 'a1', 'a2', 'a2x']);
    });
  });

  describe('setChecked / checkState cascade', () => {
    it('checking a parent cascades to all descendants', () => {
      const checked = setChecked(TREE[0], true, new Set());
      expect([...checked].sort()).toEqual(['a', 'a1', 'a2', 'a2x']);
      expect(checkState(TREE[0], checked)).toBe('checked');
    });

    it('a partially-checked parent is indeterminate', () => {
      const checked = setChecked({ id: 'a1' } as TreeNode, true, new Set());
      expect(checkState(TREE[0], checked)).toBe('indeterminate');
    });

    it('unchecked parent when no descendants are checked', () => {
      expect(checkState(TREE[0], new Set())).toBe('unchecked');
    });

    it('unchecking a parent clears its descendants', () => {
      const all = setChecked(TREE[0], true, new Set());
      const cleared = setChecked(TREE[0], false, all);
      expect(cleared.size).toBe(0);
    });

    it('leaf state reflects membership', () => {
      expect(checkState({ id: 'b' } as TreeNode, new Set(['b']))).toBe('checked');
      expect(checkState({ id: 'b' } as TreeNode, new Set())).toBe('unchecked');
    });
  });

  describe('findNode', () => {
    it('finds a nested node by id', () => {
      expect(findNode(TREE, 'a2x')?.label).toBe('A2x');
      expect(findNode(TREE, 'b')?.label).toBe('B');
    });
    it('returns undefined for a missing id', () => {
      expect(findNode(TREE, 'nope')).toBeUndefined();
    });
  });

  describe('filterTree', () => {
    it('passes through on an empty query', () => {
      const r = filterTree(TREE, '  ');
      expect(r.nodes.map((n) => n.id)).toEqual(['a', 'b']);
      expect(r.expandedIds).toEqual([]);
    });

    it('keeps a deep match + its ancestors and auto-expands them', () => {
      const r = filterTree(TREE, 'a2x');
      expect(r.nodes.map((n) => n.id)).toEqual(['a']);
      expect(r.nodes[0].children?.map((n) => n.id)).toEqual(['a2']);
      expect([...r.expandedIds].sort()).toEqual(['a', 'a2']);
    });

    it('a self-matching node keeps its full subtree', () => {
      const r = filterTree(TREE, 'A2'); // matches A2 (and A2x)
      const a = r.nodes.find((n) => n.id === 'a');
      const a2 = a?.children?.find((n) => n.id === 'a2');
      expect(a2?.children?.map((n) => n.id)).toEqual(['a2x']);
    });

    it('returns nothing when no node matches', () => {
      expect(filterTree(TREE, 'zzz').nodes).toEqual([]);
    });
  });
});
