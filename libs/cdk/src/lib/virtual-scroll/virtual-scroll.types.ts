import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

/** Template context exposed by `*axVirtualFor` (mirrors `*ngFor`). */
export interface VirtualForContext<T> {
  $implicit: T;
  index: number;
  count: number;
  first: boolean;
  last: boolean;
}

/** Shared state a `[axVirtualViewport]` provides to its `*axVirtualFor`. */
export interface VirtualViewportContext {
  /** The scroll-container element. */
  readonly element: HTMLElement;
  /** Current scroll offset (px). */
  readonly scrollTop: Signal<number>;
  /** Measured viewport height (px); 0 until measured. */
  readonly viewportSize: Signal<number>;
  /** Row height (px) — written by `*axVirtualFor`, read by `scrollToIndex`. */
  readonly itemSize: WritableSignal<number>;
}

export const VIRTUAL_VIEWPORT = new InjectionToken<VirtualViewportContext>('VIRTUAL_VIEWPORT');
