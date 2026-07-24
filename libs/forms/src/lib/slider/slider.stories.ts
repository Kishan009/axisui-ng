import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSliderComponent } from './slider.component';

const meta: Meta<AxSliderComponent> = {
  title: 'Forms/Slider',
  component: AxSliderComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSliderComponent] })],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    value: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  args: { min: 0, max: 100, step: 1, value: 50, disabled: false },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-64">
        <ax-slider [min]="min" [max]="max" [step]="step" [value]="value" [disabled]="disabled" ariaLabel="Value" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<AxSliderComponent>;

export const Default: Story = {};

export const Stepped: Story = { args: { step: 10, value: 40 } };

export const Disabled: Story = { args: { disabled: true } };
