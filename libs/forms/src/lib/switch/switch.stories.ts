import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSwitchComponent } from './switch.component';

const meta: Meta<AxSwitchComponent> = {
  title: 'Forms/Switch',
  component: AxSwitchComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSwitchComponent] })],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<AxSwitchComponent>;

export const Default: Story = {
  args: { checked: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ax-switch [checked]="checked" [disabled]="disabled">Airplane mode</ax-switch>`,
  }),
};

export const On: Story = {
  ...Default,
  args: { checked: true, disabled: false },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-2">
        <ax-switch [disabled]="true">Off, disabled</ax-switch>
        <ax-switch [checked]="true" [disabled]="true">On, disabled</ax-switch>
      </div>
    `,
  }),
};

/** Standalone switches (no projected label) paired with their own text rows. */
export const SettingsList: Story = {
  render: () => ({
    template: `
      <div class="flex w-64 flex-col gap-3 text-sm">
        <div class="flex items-center justify-between"><span>Wi-Fi</span><ax-switch [checked]="true" ariaLabel="Wi-Fi" /></div>
        <div class="flex items-center justify-between"><span>Bluetooth</span><ax-switch ariaLabel="Bluetooth" /></div>
        <div class="flex items-center justify-between"><span>Do not disturb</span><ax-switch ariaLabel="Do not disturb" /></div>
      </div>
    `,
  }),
};
