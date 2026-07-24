import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxProgressComponent } from './progress.component';

const meta: Meta<AxProgressComponent> = {
  title: 'Feedback/Progress',
  component: AxProgressComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxProgressComponent] })],
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 100 } },
    max: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    ariaLabel: { control: 'text' },
  },
  args: { value: 60, max: 100, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<div class="w-64"><ax-progress [value]="value" [max]="max" [size]="size" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<AxProgressComponent>;

export const Default: Story = {};

/** Pass `value="null"` for an indeterminate (animated) bar. */
export const Indeterminate: Story = {
  render: () => ({ template: `<div class="w-64"><ax-progress [value]="null" /></div>` }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex w-64 flex-col gap-3">
        <ax-progress [value]="40" size="sm" />
        <ax-progress [value]="60" size="md" />
        <ax-progress [value]="80" size="lg" />
      </div>
    `,
  }),
};
