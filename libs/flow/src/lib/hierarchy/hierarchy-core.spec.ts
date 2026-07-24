/**
 * Pure unit tests for the hierarchy layout core — no DOM. Covers box placement,
 * midpoint alignment, edge generation, all four directions, collapse, the
 * bracket helper, and degenerate inputs.
 */
import {
  type HierarchyLayoutOptions,
  bracketTree,
  connectorPath,
  layoutHierarchy,
  presetDefaults,
} from './hierarchy-core';
import type { HierarchyBox } from './hierarchy-core';
import type { HierarchyNode } from './hierarchy.types';

const OPTS: HierarchyLayoutOptions = {
  direction: 'tb',
  connector: 'elbow',
  nodeWidth: 100,
  nodeHeight: 40,
  levelGap: 60,
  siblingGap: 20,
};

/** A balanced depth-2 binary tree: root → (a,b) → (a1,a2,b1,b2). */
function balancedTree(): HierarchyNode[] {
  return [
    {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b', children: [{ id: 'b1' }, { id: 'b2' }] },
      ],
    },
  ];
}

const boxById = (boxes: HierarchyBox[], id: string): HierarchyBox =>
  boxes.find((b) => b.id === id)!;

describe('layoutHierarchy', () => {
  it('produces one box per node', () => {
    const { boxes } = layoutHierarchy(balancedTree(), OPTS);
    expect(boxes.map((b) => b.id).sort()).toEqual(['a', 'a1', 'a2', 'b', 'b1', 'b2', 'root']);
  });

  it('tags depth from the root', () => {
    const { boxes } = layoutHierarchy(balancedTree(), OPTS);
    expect(boxById(boxes, 'root').depth).toBe(0);
    expect(boxById(boxes, 'a').depth).toBe(1);
    expect(boxById(boxes, 'a1').depth).toBe(2);
  });

  it('centres a parent over its children (midpoint alignment)', () => {
    const { boxes } = layoutHierarchy(balancedTree(), OPTS);
    const root = boxById(boxes, 'root');
    const a = boxById(boxes, 'a');
    const b = boxById(boxes, 'b');
    // tb: secondary axis is x — root centred between its two children.
    expect(root.x).toBeCloseTo((a.x + b.x) / 2);
    const a1 = boxById(boxes, 'a1');
    const a2 = boxById(boxes, 'a2');
    expect(a.x).toBeCloseTo((a1.x + a2.x) / 2);
  });

  it('places deeper levels further down for direction tb', () => {
    const { boxes } = layoutHierarchy(balancedTree(), OPTS);
    expect(boxById(boxes, 'root').y).toBe(0);
    // one level down = nodeHeight + levelGap.
    expect(boxById(boxes, 'a').y).toBe(40 + 60);
    expect(boxById(boxes, 'a1').y).toBe((40 + 60) * 2);
  });

  it('emits an edge for every parent→child link', () => {
    const { edges } = layoutHierarchy(balancedTree(), OPTS);
    expect(edges).toHaveLength(6);
    expect(edges).toContainEqual(expect.objectContaining({ from: 'root', to: 'a' }));
    expect(edges).toContainEqual(expect.objectContaining({ from: 'a', to: 'a1' }));
    expect(edges.every((e) => e.path.startsWith('M'))).toBe(true);
  });

  it('sizes the canvas to fit all boxes', () => {
    const { boxes, width, height } = layoutHierarchy(balancedTree(), OPTS);
    expect(width).toBe(Math.max(...boxes.map((b) => b.x + b.w)));
    expect(height).toBe(Math.max(...boxes.map((b) => b.y + b.h)));
  });

  describe('directions', () => {
    it('rl puts the root at the right edge (bracket orientation)', () => {
      const { boxes, width } = layoutHierarchy(balancedTree(), { ...OPTS, direction: 'rl' });
      const root = boxById(boxes, 'root');
      const leaf = boxById(boxes, 'a1');
      expect(root.x + root.w).toBe(width); // root flush right
      expect(leaf.x).toBe(0); // leaves flush left
    });

    it('bt puts the root at the bottom', () => {
      const { boxes, height } = layoutHierarchy(balancedTree(), { ...OPTS, direction: 'bt' });
      expect(boxById(boxes, 'root').y + 40).toBe(height);
      expect(boxById(boxes, 'a1').y).toBe(0);
    });

    it('lr grows along x with the root on the left', () => {
      const { boxes } = layoutHierarchy(balancedTree(), { ...OPTS, direction: 'lr' });
      expect(boxById(boxes, 'root').x).toBe(0);
      expect(boxById(boxes, 'a').x).toBe(100 + 60); // nodeWidth + levelGap
    });
  });

  describe('collapse', () => {
    it('omits children of a collapsed node and their edges', () => {
      const tree: HierarchyNode[] = [
        {
          id: 'root',
          children: [
            { id: 'a', collapsed: true, children: [{ id: 'a1' }, { id: 'a2' }] },
            { id: 'b' },
          ],
        },
      ];
      const { boxes, edges } = layoutHierarchy(tree, OPTS);
      expect(boxes.map((b) => b.id).sort()).toEqual(['a', 'b', 'root']);
      expect(edges).toHaveLength(2); // root→a, root→b only
      const a = boxById(boxes, 'a');
      expect(a.hasChildren).toBe(true);
      expect(a.expanded).toBe(false);
    });
  });

  describe('degenerate inputs', () => {
    it('returns an empty layout for no nodes', () => {
      expect(layoutHierarchy([], OPTS)).toEqual({ boxes: [], edges: [], width: 0, height: 0 });
    });

    it('lays out a single node with no edges', () => {
      const { boxes, edges, width, height } = layoutHierarchy([{ id: 'solo' }], OPTS);
      expect(boxes).toHaveLength(1);
      expect(edges).toHaveLength(0);
      expect(width).toBe(100);
      expect(height).toBe(40);
    });

    it('lays out an unbalanced tree without overlap on the secondary axis', () => {
      const tree: HierarchyNode[] = [
        {
          id: 'root',
          children: [{ id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] }, { id: 'b' }],
        },
      ];
      const { boxes } = layoutHierarchy(tree, OPTS);
      const xs = boxes.map((b) => b.x);
      // leaves a1, a2, b each occupy a distinct slot.
      expect(new Set(xs).size).toBeGreaterThan(1);
    });
  });
});

describe('connectorPath', () => {
  const parent: HierarchyBox = {
    id: 'p', node: { id: 'p' }, depth: 0, x: 0, y: 0, w: 100, h: 40,
    hasChildren: true, expanded: true,
  };
  const child: HierarchyBox = {
    id: 'c', node: { id: 'c' }, depth: 1, x: 0, y: 100, w: 100, h: 40,
    hasChildren: false, expanded: false,
  };

  it('draws a straight line as a single segment', () => {
    expect(connectorPath(parent, child, 'straight', 'tb')).toBe('M50,40 L50,100');
  });

  it('draws an elbow with two right-angle bends (vertical)', () => {
    expect(connectorPath(parent, child, 'elbow', 'tb')).toBe('M50,40 L50,70 L50,70 L50,100');
  });

  it('uses a cubic bezier for curved', () => {
    expect(connectorPath(parent, child, 'curved', 'tb')).toContain('C');
  });
});

describe('presetDefaults', () => {
  it('maps bracket to a right-to-left elbow layout', () => {
    expect(presetDefaults('bracket')).toEqual({ direction: 'rl', connector: 'elbow' });
  });
  it('maps org to a top-down layout', () => {
    expect(presetDefaults('org').direction).toBe('tb');
  });
  it('maps tree to a left-right curved layout', () => {
    expect(presetDefaults('tree')).toEqual({ direction: 'lr', connector: 'curved' });
  });
});

describe('bracketTree', () => {
  it('nests flat rounds into a tree rooted at the final', () => {
    const rounds = [
      [{ id: 'qf1' }, { id: 'qf2' }, { id: 'qf3' }, { id: 'qf4' }],
      [{ id: 'sf1' }, { id: 'sf2' }],
      [{ id: 'final' }],
    ];
    const [root] = bracketTree(rounds);
    expect(root!.id).toBe('final');
    expect(root!.children!.map((c) => c.id)).toEqual(['sf1', 'sf2']);
    expect(root!.children![0]!.children!.map((c) => c.id)).toEqual(['qf1', 'qf2']);
  });

  it('returns an empty forest for no rounds', () => {
    expect(bracketTree([])).toEqual([]);
  });

  it('lays out via layoutHierarchy with the bracket preset', () => {
    const rounds = [[{ id: 'a' }, { id: 'b' }], [{ id: 'final' }]];
    const data = bracketTree(rounds);
    const { boxes, edges } = layoutHierarchy(data, { ...OPTS, ...presetDefaults('bracket') });
    expect(boxes).toHaveLength(3);
    expect(edges).toHaveLength(2);
  });
});
