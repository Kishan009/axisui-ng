/**
 * Toggle stories.
 */

import type { Meta, StoryObj } from '@storybook/angular';

import { AxToggleComponent } from './toggle.component';

const meta: Meta<AxToggleComponent> = {
  title: 'Buttons/Toggle',
  component: AxToggleComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    pressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<AxToggleComponent>;

export const Default: Story = {
  args: { variant: 'default', size: 'md', pressed: false },
  render: (args) => ({
    moduleMetadata: { imports: [AxToggleComponent] },
    template: `<ax-toggle [variant]="${args.variant}" [size]="${args.size}" [pressed]="${args.pressed}">Bold</ax-toggle>`,
  }),
};

export const Pressed: Story = {
  args: { variant: 'default', size: 'md', pressed: true },
};
