import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxInputComponent } from './input.component';

const meta: Meta<AxInputComponent> = {
  title: 'Forms/Input',
  component: AxInputComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxInputComponent] })],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'],
    },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<AxInputComponent>;

export const Default: Story = { args: { placeholder: 'Type here', size: 'md' } };
export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
export const Invalid: Story = { args: { placeholder: 'Invalid', invalid: true } };
export const Date: Story = { args: { type: 'date', size: 'md' } };
export const Time: Story = { args: { type: 'time', size: 'md' } };
export const DateTimeLocal: Story = { args: { type: 'datetime-local', size: 'md' } };
