import type { TemplateRef, TrackByFunction } from '@angular/core';

export interface ColDef<T> {
  /** Property key on the row object. */
  key: keyof T;
  /** Column header text. */
  header: string;
  /** Enable click-to-sort on this column. @default false */
  sortable?: boolean;
  /** Text alignment. @default 'start' */
  align?: 'start' | 'end';
  /** Include this column's value in the text search. @default true */
  searchable?: boolean;
  /** Custom cell renderer. Context: { $implicit: row, value }. */
  cellTemplate?: TemplateRef<{ $implicit: T; value: unknown }>;
}

export type SortDir = 'asc' | 'desc';

export interface SortState<T> {
  key: keyof T;
  dir: SortDir;
}

export function defaultTrackBy<T>(index: number, _item: T): number {
  return index;
}

export type { TrackByFunction };
