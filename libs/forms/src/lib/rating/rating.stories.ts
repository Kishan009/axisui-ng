import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxRatingComponent } from './rating.component';

const meta: Meta<AxRatingComponent> = {
  title: 'Forms/Rating',
  component: AxRatingComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'warning', 'muted'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    max: { control: { type: 'number', min: 1, max: 10 } },
    value: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    allowHalf: { control: 'boolean' },
    readonly: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [moduleMetadata({ imports: [AxRatingComponent] })],
  args: { variant: 'default', size: 'md', max: 5, value: 3, allowHalf: false, readonly: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `
      <ax-rating
        [variant]="variant"
        [size]="size"
        [max]="max"
        [value]="value"
        [allowHalf]="allowHalf"
        [readonly]="readonly"
        [disabled]="disabled"
        ariaLabel="Rating"
      ></ax-rating>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxRatingComponent>;

export const Default: Story = {};

export const Warning: Story = { args: { variant: 'warning', value: 4 } };

export const Sizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex flex-col gap-3">
        <ax-rating size="sm" [value]="3" variant="warning" ariaLabel="Small" />
        <ax-rating size="md" [value]="3" variant="warning" ariaLabel="Medium" />
        <ax-rating size="lg" [value]="3" variant="warning" ariaLabel="Large" />
      </div>
    `,
  }),
};

export const HalfSteps: Story = {
  args: { allowHalf: true, value: 3.5, variant: 'warning' },
};

export const Readonly: Story = {
  args: { readonly: true, value: 4, variant: 'warning' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 2 },
};
