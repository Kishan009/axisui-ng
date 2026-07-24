import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CheckState, FlatNode, TreeId, TreeNode } from './tree-core';

/** Selection behaviour of a `ax-tree`. */
export type TreeSelection = 'none' | 'single' | 'multiple';

/** Context for a consumer-provided node template. */
export interface TreeNodeTemplateContext {
  $implicit: TreeNode;
  flat: FlatNode;
}

/** Shared state a `ax-tree` provides to its `ax-tree-node` rows. */
export interface TreeContext {
  readonly selection: Signal<TreeSelection>;
  readonly focusedId: Signal<TreeId | null>;
  readonly nodeTemplate: Signal<TemplateRef<TreeNodeTemplateContext> | null>;
  /** Whether a lazy node is currently loading its children. */
  isLoading(id: TreeId): boolean;
  /** Tri-state checkbox state for a node (multiple selection). */
  stateOf(node: TreeNode): CheckState;
  /** Whether a node is the single-selected one. */
  isSelected(id: TreeId): boolean;
  /** Expand/collapse a node (triggers lazy load when needed). */
  toggleExpand(flat: FlatNode): void;
  /** Select a node (single selection). */
  select(flat: FlatNode): void;
  /** Toggle a node's checkbox (multiple selection, cascades). */
  toggleCheck(flat: FlatNode): void;
  /** Mark a node as the roving-focus target. */
  focus(id: TreeId): void;
}

export const TREE_CONTEXT = new InjectionToken<TreeContext>('TREE_CONTEXT');
