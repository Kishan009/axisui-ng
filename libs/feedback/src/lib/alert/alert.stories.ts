import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxAlertComponent } from './alert.component';

const meta: Meta<AxAlertComponent> = {
  title: 'Feedback/Alert',
  component: AxAlertComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxAlertComponent] })],
  argTypes: { variant: { control: 'select', options: ['info', 'success', 'warning', 'destructive'] } },
  render: (args) => ({
    props: args,
    template: `<ax-alert [variant]="variant" [title]="title">Alert message body.</ax-alert>`,
  }),
};
export default meta;
type Story = StoryObj<AxAlertComponent>;

export const Info: Story = { args: { variant: 'info', title: 'Info' } };
export const Success: Story = { args: { variant: 'success', title: 'Success' } };
export const Warning: Story = { args: { variant: 'warning', title: 'Warning' } };
export const Error: Story = { args: { variant: 'destructive', title: 'Error' } };
