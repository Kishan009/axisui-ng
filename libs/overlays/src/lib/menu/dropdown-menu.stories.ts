/**
 * DropdownMenu stories.
 *
 * Demonstrates the Phase 2 menu enhancements:
 * - **Nested submenus** — an item with a `[submenu]` TemplateRef that holds a
 *   nested `<ax-dropdown-menu>`.
 * - **Keyboard navigation** — ArrowUp/Down move the active item, ArrowRight opens
 *   the focused item's submenu, ArrowLeft / Escape close it.
 * - **aria-activedescendant** — the panel points at the active item as you arrow
 *   through, so screen readers track the highlight.
 *
 * Per-component import (smallest bundle):
 * `import { AxDropdownMenuComponent } from '@axisui-ng/overlays/menu';`
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxDropdownMenuComponent } from './dropdown-menu.component';
import { AxMenuItemComponent } from './menu-item.component';
import { AxMenuTriggerDirective } from './menu-trigger.directive';

const meta: Meta = {
  title: 'Overlays/Dropdown Menu',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AxDropdownMenuComponent, AxMenuItemComponent, AxMenuTriggerDirective],
    }),
  ],
};
export default meta;
type Story = StoryObj;

const triggerClass =
  'inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

/** A flat menu of actions opened from a trigger via `[axMenuTriggerFor]`. */
export const Default: Story = {
  render: () => ({
    template: `
      <button class="${triggerClass}" [axMenuTriggerFor]="menu">Actions</button>
      <ax-dropdown-menu #menu>
        <ax-menu-item>New File</ax-menu-item>
        <ax-menu-item>New Window</ax-menu-item>
        <ax-menu-item [disabled]="true">New Incognito Window</ax-menu-item>
      </ax-dropdown-menu>
    `,
  }),
};

/**
 * Nested submenus. Open the menu, then hover or click **Share** / **More tools**
 * (chevron items) — or press **ArrowRight** — to open the submenu (which itself
 * nests another under **Send to…**). **ArrowLeft** or **Escape** closes the
 * innermost submenu first.
 */
export const NestedSubmenu: Story = {
  render: () => ({
    template: `
      <button class="${triggerClass}" [axMenuTriggerFor]="menu">Open menu</button>
      <ax-dropdown-menu #menu>
        <ax-menu-item>New File</ax-menu-item>
        <ax-menu-item [submenu]="shareTpl">Share</ax-menu-item>
        <ax-menu-item [submenu]="moreTpl">More tools</ax-menu-item>
        <ax-menu-item [disabled]="true">Print…</ax-menu-item>
      </ax-dropdown-menu>

      <ng-template #shareTpl>
        <ax-dropdown-menu>
          <ax-menu-item>Email link</ax-menu-item>
          <ax-menu-item>Copy link</ax-menu-item>
          <ax-menu-item [submenu]="channelsTpl">Send to…</ax-menu-item>
        </ax-dropdown-menu>
      </ng-template>

      <ng-template #channelsTpl>
        <ax-dropdown-menu>
          <ax-menu-item>Slack</ax-menu-item>
          <ax-menu-item>Notion</ax-menu-item>
        </ax-dropdown-menu>
      </ng-template>

      <ng-template #moreTpl>
        <ax-dropdown-menu>
          <ax-menu-item>Save page as…</ax-menu-item>
          <ax-menu-item>Create shortcut…</ax-menu-item>
        </ax-dropdown-menu>
      </ng-template>
    `,
  }),
};
