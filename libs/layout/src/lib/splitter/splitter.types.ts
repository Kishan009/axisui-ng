import { InjectionToken, Signal } from '@angular/core';

export type SplitterOrientation = 'horizontal' | 'vertical';

/** A panel registered with the splitter root. */
export interface SplitterPanelRef {
  readonly element: HTMLElement;
  readonly size: Signal<number | undefined>;
  readonly minSize: Signal<number>;
  readonly maxSize: Signal<number>;
  readonly collapsible: Signal<boolean>;
  readonly collapsedSize: Signal<number>;
}

/** Provided by ax-splitter; consumed by its panels and handles. */
export interface SplitterContext {
  readonly orientation: Signal<SplitterOrientation>;
  readonly autoGutters: Signal<boolean>;
  readonly gutterSize: Signal<number>;
  readonly ariaLabel: Signal<string>;
  /** Effective sizes actually rendered (the model when controlled, else the normalized seed). */
  readonly effectiveSizes: Signal<number[]>;
  readonly mins: Signal<number[]>;
  readonly maxes: Signal<number[]>;
  readonly panels: Signal<readonly SplitterPanelRef[]>;

  indexOf(panel: SplitterPanelRef): number;
  isLast(panel: SplitterPanelRef): boolean;
  /** Position of an explicit (manual-mode) handle among the root's direct-child handles. */
  handleIndex(handle: unknown): number;

  /** Drag: move boundary `b` by `deltaPx` along the main axis (converted px → %). */
  resizeBoundary(b: number, deltaPx: number): void;
  /** Pointer release on boundary `b`: snap a collapsible neighbour shrunk past its min to collapsedSize. */
  endResize(b: number): void;
  /** Keyboard arrow: nudge boundary `b` by ±step%. */
  nudgeBoundary(b: number, dir: -1 | 1): void;
  /** Home/End: drive boundary `b` to the left panel's min / max. */
  extendBoundary(b: number, to: 'min' | 'max'): void;
  /** Toggle collapse of the collapsible panel adjacent to boundary `b`. */
  toggleBoundaryCollapse(b: number): void;
}

export const SPLITTER_CONTEXT = new InjectionToken<SplitterContext>('SPLITTER_CONTEXT');
