import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxResultComponent } from './result.component';

const meta: Meta<AxResultComponent> = {
  title: 'Feedback/Result',
  component: AxResultComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxResultComponent] })],
  argTypes: { status: { control: 'select', options: ['success', 'info', 'warning', 'error'] } },
};
export default meta;
type Story = StoryObj<AxResultComponent>;

export const Success: Story = { args: { status: 'success', title: 'Payment complete', description: 'Your order is confirmed.' } };
export const Warning: Story = { args: { status: 'warning', title: 'Almost there', description: 'Verify your email to continue.' } };
export const Error: Story = { args: { status: 'error', title: '404', description: 'This page could not be found.' } };
