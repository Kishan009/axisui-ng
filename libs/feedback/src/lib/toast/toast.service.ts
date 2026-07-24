import { Injectable, signal } from '@angular/core';

import type { Toast, ToastConfig, ToastRef } from './toast.types';

const DEFAULT_DURATION = 5000;

/**
 * ToastService — root-provided store of active toasts.
 * Consumers call show(); an <ax-toast-outlet> renders them.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  /** Read-only view of active toasts. */
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;

  /** Live auto-dismiss timers, tracked so they can be paused on hover/focus. */
  private readonly timers = new Map<
    number,
    { handle: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }
  >();

  show(config: ToastConfig): ToastRef {
    const id = this.nextId++;
    const toast: Toast = {
      id,
      title: config.title,
      variant: config.variant ?? 'default',
      dismissible: config.dismissible ?? true,
      // Only include description when defined (exactOptionalPropertyTypes).
      ...(config.description !== undefined ? { description: config.description } : {}),
    };
    this._toasts.update((list) => [...list, toast]);

    const duration = config.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      this.schedule(id, duration);
    }

    return { dismiss: () => this.dismiss(id) };
  }

  /**
   * Pause every running auto-dismiss timer, banking the time already elapsed.
   * Called while the outlet is hovered or focused so users get time to read/act
   * (WCAG 2.2.1). {@link resume} restarts them with the remaining time.
   */
  pause(): void {
    const now = Date.now();
    for (const timer of this.timers.values()) {
      clearTimeout(timer.handle);
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
  }

  /** Resume paused timers with their remaining time. */
  resume(): void {
    const now = Date.now();
    for (const [id, timer] of this.timers) {
      timer.startedAt = now;
      timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
    }
  }

  private schedule(id: number, duration: number): void {
    this.timers.set(id, {
      handle: setTimeout(() => this.dismiss(id), duration),
      remaining: duration,
      startedAt: Date.now(),
    });
  }

  /** Remove a toast by id (used by the outlet's close button and ToastRef). */
  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.handle);
      this.timers.delete(id);
    }
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
