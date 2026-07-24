import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTabsComponent } from './tabs.component';
import { AxTabsListComponent } from './tabs-list.component';
import { AxTabTriggerComponent } from './tab-trigger.component';
import { AxTabPanelComponent } from './tab-panel.component';

const meta: Meta = {
  title: 'Data/Tabs',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AxTabsComponent, AxTabsListComponent, AxTabTriggerComponent, AxTabPanelComponent],
    }),
  ],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    props: { active: signal('account') },
    template: `
      <ax-tabs [(value)]="active" class="block w-80">
        <ax-tabs-list>
          <ax-tab-trigger value="account">Account</ax-tab-trigger>
          <ax-tab-trigger value="password">Password</ax-tab-trigger>
          <ax-tab-trigger value="team">Team</ax-tab-trigger>
        </ax-tabs-list>
        <ax-tab-panel value="account" class="text-sm text-muted-foreground">Manage your account settings.</ax-tab-panel>
        <ax-tab-panel value="password" class="text-sm text-muted-foreground">Change your password here.</ax-tab-panel>
        <ax-tab-panel value="team" class="text-sm text-muted-foreground">Invite and manage teammates.</ax-tab-panel>
      </ax-tabs>
    `,
  }),
};

/** A disabled trigger is skipped by arrow-key roving focus. */
export const WithDisabled: Story = {
  render: () => ({
    props: { active: signal('one') },
    template: `
      <ax-tabs [(value)]="active" class="block w-80">
        <ax-tabs-list>
          <ax-tab-trigger value="one">One</ax-tab-trigger>
          <ax-tab-trigger value="two" [disabled]="true">Two</ax-tab-trigger>
          <ax-tab-trigger value="three">Three</ax-tab-trigger>
        </ax-tabs-list>
        <ax-tab-panel value="one" class="text-sm text-muted-foreground">First panel.</ax-tab-panel>
        <ax-tab-panel value="two" class="text-sm text-muted-foreground">Second panel.</ax-tab-panel>
        <ax-tab-panel value="three" class="text-sm text-muted-foreground">Third panel.</ax-tab-panel>
      </ax-tabs>
    `,
  }),
};
