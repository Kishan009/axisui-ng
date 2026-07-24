import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxIconComponent } from '@axisui-ng/icons';
import { AxSidebarComponent } from './sidebar.component';
import { AxSidebarItemComponent } from './sidebar-item.component';

const meta: Meta = {
  title: 'Navigation/Sidebar',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [AxSidebarComponent, AxSidebarItemComponent, AxIconComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

/** Collapsible rail — the header button toggles between the full and icon-only widths. */
export const Default: Story = {
  render: () => ({
    props: { collapsed: signal(false) },
    template: `
      <div class="h-80 w-fit overflow-hidden rounded-[var(--radius-md)] border border-border">
        <ax-sidebar [(collapsed)]="collapsed">
          <button axSidebarHeader type="button" class="flex w-full items-center justify-center rounded-[var(--radius-sm)] p-1 hover:bg-accent" aria-label="Toggle sidebar" (click)="collapsed.set(!collapsed())">
            <ax-icon name="menu" [size]="18" />
          </button>
          <ax-sidebar-item [active]="true"><ax-icon name="folder" [size]="18" /><span>Projects</span></ax-sidebar-item>
          <ax-sidebar-item><ax-icon name="user" [size]="18" /><span>Team</span></ax-sidebar-item>
          <ax-sidebar-item><ax-icon name="file-text" [size]="18" /><span>Documents</span></ax-sidebar-item>
          <ax-sidebar-item><ax-icon name="image" [size]="18" /><span>Media</span></ax-sidebar-item>
          <ax-sidebar-item axSidebarFooter><ax-icon name="archive" [size]="18" /><span>Archive</span></ax-sidebar-item>
        </ax-sidebar>
      </div>
    `,
  }),
};

/** Collapsed (icon-rail) — projected labels are hidden, leaving only the icons. */
export const Collapsed: Story = {
  render: () => ({
    template: `
      <div class="h-80 w-fit overflow-hidden rounded-[var(--radius-md)] border border-border">
        <ax-sidebar [collapsed]="true">
          <ax-sidebar-item [active]="true"><ax-icon name="folder" [size]="18" /><span>Projects</span></ax-sidebar-item>
          <ax-sidebar-item><ax-icon name="user" [size]="18" /><span>Team</span></ax-sidebar-item>
          <ax-sidebar-item><ax-icon name="file-text" [size]="18" /><span>Documents</span></ax-sidebar-item>
        </ax-sidebar>
      </div>
    `,
  }),
};
