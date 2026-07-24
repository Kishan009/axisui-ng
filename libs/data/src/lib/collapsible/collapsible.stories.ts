import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCollapsibleComponent } from './collapsible.component';
import { AxCollapsibleTriggerDirective } from './collapsible-trigger.directive';

const meta: Meta = {
  title: 'Data/Collapsible',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxCollapsibleComponent, AxCollapsibleTriggerDirective] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ax-collapsible class="w-72">
        <button axCollapsibleTrigger class="flex w-full items-center justify-between rounded-[var(--radius-field)] border border-border px-3 py-2 text-sm font-medium">
          Show details
        </button>
        <div class="px-3 py-2 text-sm text-muted-foreground">Collapsible content revealed on toggle.</div>
      </ax-collapsible>
    `,
  }),
};
