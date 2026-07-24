import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCheckboxComponent } from './checkbox.component';

const meta: Meta<AxCheckboxComponent> = {
  title: 'Forms/Checkbox',
  component: AxCheckboxComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxCheckboxComponent] })],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<AxCheckboxComponent>;

export const Default: Story = {
  args: { checked: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ax-checkbox [checked]="checked" [disabled]="disabled">Accept terms and conditions</ax-checkbox>`,
  }),
};

export const Checked: Story = {
  ...Default,
  args: { checked: true, disabled: false },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-2">
        <ax-checkbox [disabled]="true">Disabled, unchecked</ax-checkbox>
        <ax-checkbox [checked]="true" [disabled]="true">Disabled, checked</ax-checkbox>
      </div>
    `,
  }),
};

export const Group: Story = {
  render: () => ({
    template: `
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-medium">Notifications</legend>
        <ax-checkbox [checked]="true">Email</ax-checkbox>
        <ax-checkbox>SMS</ax-checkbox>
        <ax-checkbox>Push</ax-checkbox>
      </fieldset>
    `,
  }),
};
