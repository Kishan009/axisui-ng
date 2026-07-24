import { InjectionToken, type Signal } from '@angular/core';
import type { AxIconName } from '@axisui-ng/icons';

export type TimelineOrientation = 'vertical' | 'horizontal';

/** `start` keeps all content on one side; `alternate` zig-zags (vertical only). */
export type TimelineAlign = 'start' | 'alternate';

/** Marker tint. */
export type TimelineColor = 'default' | 'primary' | 'success' | 'warning' | 'destructive';

/** One event in data-driven mode (`<ax-timeline [items]="…">`). */
export interface TimelineItem {
  title: string;
  time?: string;
  description?: string;
  icon?: AxIconName;
  color?: TimelineColor;
}

/** Context a `ax-timeline` provides to its items. */
export interface TimelineContext {
  readonly orientation: Signal<TimelineOrientation>;
  readonly align: Signal<TimelineAlign>;
}

export const TIMELINE_CONTEXT = new InjectionToken<TimelineContext>('TIMELINE_CONTEXT');
