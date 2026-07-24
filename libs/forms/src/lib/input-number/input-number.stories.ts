import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxInputNumberComponent } from './input-number.component';

const meta: Meta<AxInputNumberComponent> = {
  title: 'Forms/InputNumber',
  component: AxInputNumberComponent,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    prefix: { control: 'text' },
    suffix: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { value: 3, step: 1, size: 'md', disabled: false },
  decorators: [moduleMetadata({ imports: [AxInputNumberComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <div class="w-48">
        <ax-input-number
          [value]="value" [min]="min" [max]="max" [step]="step" [precision]="precision"
          [prefix]="prefix" [suffix]="suffix" [size]="size" [disabled]="disabled" ariaLabel="Number"
        />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxInputNumberComponent>;

export const Default: Story = {};
export const Bounded: Story = { args: { value: 5, min: 0, max: 10 } };
export const Currency: Story = { args: { value: 9.99, precision: 2, step: 0.5, prefix: '$' } };
export const Percent: Story = { args: { value: 50, min: 0, max: 100, step: 5, suffix: '%' } };
export const Disabled: Story = { args: { disabled: true } };
