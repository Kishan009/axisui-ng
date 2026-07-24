/**
 * Pure layout math for `ax-hierarchy` — no DOM, no Angular. Positions a
 * single-parent tree of fixed-size node boxes using a tidy-tree pass (each
 * parent is centred over its children), then maps the result into pixel space
 * for one of four directions and builds the SVG connector paths. Table-tested.
 */
import type {
  HierarchyConnector,
  HierarchyDirection,
  HierarchyId,
  HierarchyNode,
  HierarchyPreset,
} from './hierarchy.types';

export interface HierarchyLayoutOptions {
  direction: HierarchyDirection;
  connector: HierarchyConnector;
  nodeWidth: number;
  nodeHeight: number;
  /** Gap between adjacent depth levels (primary axis). */
  levelGap: number;
  /** Gap between adjacent siblings (secondary axis). */
  siblingGap: number;
}

/** A positioned node box in pixel space. */
export interface HierarchyBox<T = unknown> {
  id: HierarchyId;
  node: HierarchyNode<T>;
  depth: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hasChildren: boolean;
  /** Whether this node currently lays out its children. */
  expanded: boolean;
}

/** A parent→child connector, with its precomputed SVG path. */
export interface HierarchyEdge {
  from: HierarchyId;
  to: HierarchyId;
  path: string;
}

export interface HierarchyLayout<T = unknown> {
  boxes: HierarchyBox<T>[];
  edges: HierarchyEdge[];
  width: number;
  height: number;
}

/** Default direction + connector for each preset. Explicit inputs still win. */
export function presetDefaults(preset: HierarchyPreset): {
  direction: HierarchyDirection;
  connector: HierarchyConnector;
} {
  switch (preset) {
    case 'bracket':
      return { direction: 'rl', connector: 'elbow' };
    case 'org':
      return { direction: 'tb', connector: 'elbow' };
    case 'tree':
      return { direction: 'lr', connector: 'curved' };
  }
}

const isVertical = (d: HierarchyDirection): boolean => d === 'tb' || d === 'bt';

/** Whether a node renders its children (has some, and is not collapsed). */
function expandsChildren(node: HierarchyNode): boolean {
  return !!node.children && node.children.length > 0 && !node.collapsed;
}

/** Round to 2 decimals so coordinates and paths stay tidy. */
const r = (n: number): number => Math.round(n * 100) / 100;

interface Placed<T> {
  node: HierarchyNode<T>;
  depth: number;
  /** Secondary-axis centre, in "slot" units. */
  slot: number;
}

/**
 * Assign each node a depth and a secondary-axis slot. Leaves take sequential
 * slots; a parent's slot is the midpoint of its first and last child.
 */
function place<T>(nodes: readonly HierarchyNode<T>[]): Placed<T>[] {
  const placed: Placed<T>[] = [];
  let nextLeafSlot = 0;
  const walk = (node: HierarchyNode<T>, depth: number): number => {
    let slot: number;
    if (expandsChildren(node)) {
      const childSlots = node.children!.map((c) => walk(c, depth + 1));
      slot = (childSlots[0]! + childSlots[childSlots.length - 1]!) / 2;
    } else {
      slot = nextLeafSlot;
      nextLeafSlot += 1;
    }
    placed.push({ node, depth, slot });
    return slot;
  };
  for (const root of nodes) walk(root, 0);
  return placed;
}

type Side = 'top' | 'bottom' | 'left' | 'right';

/** Centre point of one side of a box. */
function anchor(b: HierarchyBox, side: Side): [number, number] {
  switch (side) {
    case 'top':
      return [b.x + b.w / 2, b.y];
    case 'bottom':
      return [b.x + b.w / 2, b.y + b.h];
    case 'left':
      return [b.x, b.y + b.h / 2];
    case 'right':
      return [b.x + b.w, b.y + b.h / 2];
  }
}

/** Which side connectors leave the parent from and enter the child at. */
const SIDES: Record<HierarchyDirection, readonly [Side, Side]> = {
  tb: ['bottom', 'top'],
  bt: ['top', 'bottom'],
  lr: ['right', 'left'],
  rl: ['left', 'right'],
};

/** Build the SVG `d` string for a parent→child connector. */
export function connectorPath(
  parent: HierarchyBox,
  child: HierarchyBox,
  connector: HierarchyConnector,
  direction: HierarchyDirection
): string {
  const [pSide, cSide] = SIDES[direction];
  const [sx, sy] = anchor(parent, pSide);
  const [tx, ty] = anchor(child, cSide);
  if (connector === 'straight') {
    return `M${r(sx)},${r(sy)} L${r(tx)},${r(ty)}`;
  }
  if (isVertical(direction)) {
    const my = (sy + ty) / 2;
    if (connector === 'curved') {
      return `M${r(sx)},${r(sy)} C${r(sx)},${r(my)} ${r(tx)},${r(my)} ${r(tx)},${r(ty)}`;
    }
    return `M${r(sx)},${r(sy)} L${r(sx)},${r(my)} L${r(tx)},${r(my)} L${r(tx)},${r(ty)}`;
  }
  const mx = (sx + tx) / 2;
  if (connector === 'curved') {
    return `M${r(sx)},${r(sy)} C${r(mx)},${r(sy)} ${r(mx)},${r(ty)} ${r(tx)},${r(ty)}`;
  }
  return `M${r(sx)},${r(sy)} L${r(mx)},${r(sy)} L${r(mx)},${r(ty)} L${r(tx)},${r(ty)}`;
}

/**
 * Lay out a forest of single-parent trees into positioned boxes plus connector
 * paths, sized to fit the content.
 */
export function layoutHierarchy<T>(
  nodes: readonly HierarchyNode<T>[],
  opts: HierarchyLayoutOptions
): HierarchyLayout<T> {
  const placed = place(nodes);
  if (placed.length === 0) return { boxes: [], edges: [], width: 0, height: 0 };

  const vertical = isVertical(opts.direction);
  const secondaryStep = (vertical ? opts.nodeWidth : opts.nodeHeight) + opts.siblingGap;
  const primaryStep = (vertical ? opts.nodeHeight : opts.nodeWidth) + opts.levelGap;
  const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);

  const boxes: HierarchyBox<T>[] = placed.map((p) => {
    const primary = p.depth * primaryStep;
    const flipped = (maxDepth - p.depth) * primaryStep;
    const secondary = p.slot * secondaryStep;
    let x = 0;
    let y = 0;
    switch (opts.direction) {
      case 'tb':
        x = secondary;
        y = primary;
        break;
      case 'bt':
        x = secondary;
        y = flipped;
        break;
      case 'lr':
        x = primary;
        y = secondary;
        break;
      case 'rl':
        x = flipped;
        y = secondary;
        break;
    }
    return {
      id: p.node.id,
      node: p.node,
      depth: p.depth,
      x: r(x),
      y: r(y),
      w: opts.nodeWidth,
      h: opts.nodeHeight,
      hasChildren: !!p.node.children && p.node.children.length > 0,
      expanded: expandsChildren(p.node),
    };
  });

  const byId = new Map(boxes.map((b) => [b.id, b]));
  const edges: HierarchyEdge[] = [];
  for (const b of boxes) {
    if (!b.expanded) continue;
    for (const child of b.node.children!) {
      const cb = byId.get(child.id);
      if (!cb) continue;
      edges.push({
        from: b.id,
        to: child.id,
        path: connectorPath(b, cb, opts.connector, opts.direction),
      });
    }
  }

  const width = r(boxes.reduce((m, b) => Math.max(m, b.x + b.w), 0));
  const height = r(boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0));
  return { boxes, edges, width, height };
}

/** One participant slot in a flat bracket round. */
export interface BracketSlot<T = unknown> {
  id: HierarchyId;
  data?: T;
}

/**
 * Map a tournament's natural "rounds, each with matches" shape into the nested
 * tree `ax-hierarchy` consumes. `rounds[0]` is the first round (the leaves);
 * the last round holds the single final (the root). Assumes a perfect binary
 * bracket — each round has half as many matches as the previous.
 */
export function bracketTree<T>(rounds: readonly (readonly BracketSlot<T>[])[]): HierarchyNode<T>[] {
  if (rounds.length === 0) return [];
  const build = (roundIdx: number, indexInRound: number): HierarchyNode<T> => {
    const slot = rounds[roundIdx]![indexInRound]!;
    const node: HierarchyNode<T> = { id: slot.id };
    if (slot.data !== undefined) node.data = slot.data;
    if (roundIdx > 0) {
      node.children = [
        build(roundIdx - 1, indexInRound * 2),
        build(roundIdx - 1, indexInRound * 2 + 1),
      ];
    }
    return node;
  };
  return [build(rounds.length - 1, 0)];
}
