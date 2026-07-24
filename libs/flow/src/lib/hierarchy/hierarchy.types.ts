/**
 * Public data + configuration types for `ax-hierarchy`. Kept free of Angular and
 * DOM imports so the pure layout core (`hierarchy-core`) can share them.
 */

/** Stable identity for a node. */
export type HierarchyId = string | number;

/** Layout direction: which way the tree grows from its root(s). */
export type HierarchyDirection = 'tb' | 'bt' | 'lr' | 'rl';

/** A bundled set of sensible defaults for a common shape. */
export type HierarchyPreset = 'bracket' | 'org' | 'tree';

/** How parent→child connectors are drawn. */
export type HierarchyConnector = 'elbow' | 'curved' | 'straight';

/**
 * One node of the (single-parent) tree. `data` is the consumer payload the node
 * template renders — a match, a person, a step, etc.
 */
export interface HierarchyNode<T = unknown> {
  id: HierarchyId;
  /** Child nodes whose subtrees fan out from this one. */
  children?: HierarchyNode<T>[];
  /** Arbitrary payload handed to the node template as `$implicit`. */
  data?: T;
  /** Start collapsed — children exist but are not laid out until expanded. */
  collapsed?: boolean;
}

/** Context object passed to the consumer's node template. */
export interface HierarchyNodeContext<T = unknown> {
  /** The node being rendered. */
  $implicit: HierarchyNode<T>;
  /** 0-based depth from the root. */
  depth: number;
  /** Whether this node is currently showing its children. */
  expanded: boolean;
  /** Whether this node has any children at all. */
  hasChildren: boolean;
}

/** Payload emitted when a node is activated. */
export interface HierarchyNodeClick<T = unknown> {
  node: HierarchyNode<T>;
  depth: number;
}
