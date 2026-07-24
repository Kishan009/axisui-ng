import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxColorPickerComponent } from './color-picker.component';

const meta: Meta<AxColorPickerComponent> = {
  title: 'Forms/ColorPicker',
  component: AxColorPickerComponent,
  tags: ['autodocs'],
  argTypes: {
    format: { control: 'inline-radio', options: ['oklch', 'hex', 'rgb'] },
    alpha: { control: 'boolean' },
    showTokens: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { format: 'oklch', alpha: false, showTokens: true, disabled: false },
  decorators: [moduleMetadata({ imports: [AxColorPickerComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <div class="w-72">
        <ax-color-picker
          [format]="format"
          [alpha]="alpha"
          [showTokens]="showTokens"
          [disabled]="disabled"
          ariaLabel="Brand color"
        />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxColorPickerComponent>;

export const Default: Story = {};

export const Hex: Story = { args: { format: 'hex' } };

export const WithAlpha: Story = { args: { alpha: true } };

export const NoTokens: Story = { args: { showTokens: false } };

export const Disabled: Story = { args: { disabled: true } };
