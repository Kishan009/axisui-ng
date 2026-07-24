import type { AxIconName } from '@axisui-ng/icons';

export interface CommandItem {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  icon?: AxIconName;
  disabled?: boolean;
}

/**
 * Customizable keyboard bindings for `<ax-command>`. Each value is a
 * `KeyboardEvent.key` string; omitted actions fall back to the defaults shown.
 */
export interface CommandKeyBindings {
  /** Move to the next option. @default 'ArrowDown' */
  next?: string;
  /** Move to the previous option. @default 'ArrowUp' */
  prev?: string;
  /** Jump forward by one page (`pageSize` enabled options). @default 'PageDown' */
  pageDown?: string;
  /** Jump backward by one page (`pageSize` enabled options). @default 'PageUp' */
  pageUp?: string;
  /** Jump to the first enabled option. @default 'Home' */
  first?: string;
  /** Jump to the last enabled option. @default 'End' */
  last?: string;
  /** Select the active option. @default 'Enter' */
  select?: string;
  /** Request close (composes with a wrapping dialog's Escape). @default 'Escape' */
  close?: string;
}
