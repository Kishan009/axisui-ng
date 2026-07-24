/**
 * Popover stories. A non-modal floating panel anchored to its trigger via
 * `[axPopoverTriggerFor]`. Light-dismisses on outside-click and Escape.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxPopoverComponent } from './popover.component';
import { AxPopoverTriggerDirective } from './popover-trigger.directive';

const triggerClass =
  'inline-flex items-center rounded-[var(--radius-md)] border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

const meta: Meta = {
  title: 'Overlays/Popover',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxPopoverComponent, AxPopoverTriggerDirective] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <button class="${triggerClass}" [axPopoverTriggerFor]="p">Open popover</button>
      <ax-popover #p placement="bottom-start">
        <p class="text-sm font-medium">Dimensions</p>
        <p class="mt-1 text-sm text-muted-foreground">Set the width and height of the selected element.</p>
      </ax-popover>
    `,
  }),
};

export const Placement: Story = {
  render: () => ({
    template: `
      <div class="flex justify-center p-16">
        <button class="${triggerClass}" [axPopoverTriggerFor]="p">Open above</button>
        <ax-popover #p placement="top">
          <p class="text-sm text-muted-foreground">This popover opens above its trigger.</p>
        </ax-popover>
      </div>
    `,
  }),
};
