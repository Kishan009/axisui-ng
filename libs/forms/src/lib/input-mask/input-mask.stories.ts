import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxInputMaskComponent } from './input-mask.component';

const meta: Meta<AxInputMaskComponent> = {
  title: 'Forms/InputMask',
  component: AxInputMaskComponent,
  tags: ['autodocs'],
  argTypes: {
    mask: { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { mask: '(999) 999-9999', placeholder: '(___) ___-____', size: 'md', disabled: false },
  decorators: [moduleMetadata({ imports: [AxInputMaskComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <div class="w-64">
        <ax-input-mask [mask]="mask" [placeholder]="placeholder" [size]="size" [disabled]="disabled" ariaLabel="Masked input" />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxInputMaskComponent>;

export const Phone: Story = {};
export const Date: Story = { args: { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' } };
export const CreditCard: Story = { args: { mask: '9999 9999 9999 9999', placeholder: '•••• •••• •••• ••••' } };
export const LicensePlate: Story = { args: { mask: 'AAA-9999', placeholder: 'ABC-1234' } };
export const Disabled: Story = { args: { disabled: true } };
