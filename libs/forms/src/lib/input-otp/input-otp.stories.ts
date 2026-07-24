import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxInputOtpComponent } from './input-otp.component';

const meta: Meta<AxInputOtpComponent> = {
  title: 'Forms/InputOTP',
  component: AxInputOtpComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxInputOtpComponent] })],
  argTypes: {
    length: { control: { type: 'number', min: 4, max: 8 } },
    separator: { control: 'number' },
    mask: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { length: 6, separator: null, mask: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ax-input-otp [length]="length" [separator]="separator" [mask]="mask" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<AxInputOtpComponent>;

export const Default: Story = {};

export const Prefilled: Story = {
  render: () => ({ template: `<ax-input-otp [length]="6" [value]="'123'" />` }),
};

export const WithSeparator: Story = { args: { separator: 3 } };

export const Masked: Story = {
  render: () => ({ template: `<ax-input-otp [length]="6" [value]="'1234'" [mask]="true" />` }),
};

export const Disabled: Story = { args: { disabled: true } };
