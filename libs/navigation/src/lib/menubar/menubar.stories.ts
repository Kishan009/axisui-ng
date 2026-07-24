/**
 * Menubar stories.
 *
 * An application menu bar of `ax-menubar-menu`s, each projecting a
 * `ax-dropdown-menu`. Phase 2 behaviour: choosing an item closes the dropdown
 * (the menu emits `closed`) and resets the menubar's open-state, so the next
 * trigger opens fresh — no lingering open menu. ArrowLeft/Right rove between the
 * top-level triggers.
 */

import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxDropdownMenuComponent, AxMenuItemComponent } from '@axisui-ng/overlays';
import { AxMenubarComponent } from './menubar.component';
import { AxMenubarMenuComponent } from './menubar-menu.component';

const meta: Meta = {
  title: 'Navigation/Menubar',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AxMenubarComponent, AxMenubarMenuComponent, AxDropdownMenuComponent, AxMenuItemComponent],
    }),
  ],
};
export default meta;
type Story = StoryObj;

/**
 * Open a menu and choose an item: the dropdown closes and the menubar resets, so
 * clicking another trigger (or the same one) opens a fresh menu rather than the
 * previous selection's state. The line below updates to confirm the `select`
 * fired as the menu closed.
 */
export const Default: Story = {
  render: () => ({
    props: { lastAction: signal<string | null>(null) },
    template: `
      <div class="flex flex-col gap-3">
        <ax-menubar>
          <ax-menubar-menu label="File">
            <ax-dropdown-menu>
              <ax-menu-item (select)="lastAction.set('File › New File')">New File</ax-menu-item>
              <ax-menu-item (select)="lastAction.set('File › Open…')">Open…</ax-menu-item>
              <ax-menu-item (select)="lastAction.set('File › Save')">Save</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
          <ax-menubar-menu label="Edit">
            <ax-dropdown-menu>
              <ax-menu-item (select)="lastAction.set('Edit › Undo')">Undo</ax-menu-item>
              <ax-menu-item (select)="lastAction.set('Edit › Redo')">Redo</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
          <ax-menubar-menu label="View">
            <ax-dropdown-menu>
              <ax-menu-item (select)="lastAction.set('View › Zoom In')">Zoom In</ax-menu-item>
              <ax-menu-item (select)="lastAction.set('View › Zoom Out')">Zoom Out</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
        </ax-menubar>

        @if (lastAction()) {
          <p class="text-sm text-muted-foreground">
            Selected: <code class="font-mono">{{ lastAction() }}</code>
          </p>
        }
      </div>
    `,
  }),
};
