/**
 * Command stories.
 *
 * A searchable command list (the body of a ⌘K palette). Phase 2: full keyboard
 * roving — ArrowUp/Down move the active option, Home/End jump to the ends,
 * PageUp/PageDown jump by `pageSize`, Enter selects, Escape closes; disabled
 * options are skipped and the list never wraps. Every binding is customizable
 * via `keyBindings` (the `VimKeys` story remaps Up/Down to k/j). The active
 * option is mirrored to the input via `aria-activedescendant`.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCommandComponent } from './command.component';
import type { CommandItem, CommandKeyBindings } from './command.types';

const ITEMS: CommandItem[] = [
  { id: 'new-file', label: 'New File', icon: 'file', group: '⌘N' },
  { id: 'new-folder', label: 'New Folder', icon: 'folder' },
  { id: 'search', label: 'Search Files', icon: 'search', group: '⌘P' },
  { id: 'settings', label: 'Open Settings', icon: 'settings', group: '⌘,' },
  { id: 'profile', label: 'View Profile', icon: 'user' },
  { id: 'copy', label: 'Copy Path', icon: 'copy' },
  { id: 'download', label: 'Download', icon: 'download', disabled: true },
  { id: 'trash', label: 'Move to Trash', icon: 'trash' },
];

const meta: Meta<AxCommandComponent> = {
  title: 'Navigation/Command',
  component: AxCommandComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxCommandComponent] })],
};
export default meta;
type Story = StoryObj<AxCommandComponent>;

const panel = (inner: string): string =>
  `<div class="w-80 rounded-[var(--radius-md)] border border-border bg-popover p-3 text-popover-foreground shadow-md">${inner}</div>`;

/**
 * Default roving. Click the input, then ArrowUp/Down to move, Home/End to jump to
 * the ends, PageUp/PageDown to page, Enter to select. The disabled "Download" row
 * is skipped and navigation clamps at the ends (no wrap).
 */
export const Default: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: panel(`<ax-command [items]="items" placeholder="Type a command…" />`),
  }),
};

/**
 * Custom `keyBindings`: navigate with **j** (down) and **k** (up) instead of the
 * arrow keys. Any subset of bindings can be overridden — the rest keep their
 * defaults (Home/End, Enter, Escape still work).
 */
export const VimKeys: Story = {
  render: () => ({
    props: {
      items: ITEMS,
      keyBindings: { next: 'j', prev: 'k' } satisfies Partial<CommandKeyBindings>,
    },
    template: panel(
      `<ax-command [items]="items" [keyBindings]="keyBindings" placeholder="Type… (j / k to move)" />`,
    ),
  }),
};
