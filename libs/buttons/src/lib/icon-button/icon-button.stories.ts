/**
 * IconButton stories.
 * One Default + one per variant + the shape variant + a few sizes.
 */

import type { Meta, StoryObj } from '@storybook/angular';

import { AxIconButtonComponent } from './icon-button.component';

const meta: Meta<AxIconButtonComponent> = {
  title: 'Buttons/IconButton',
  component: AxIconButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    shape: { control: 'select', options: ['square', 'circle'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<AxIconButtonComponent>;

export const Default: Story = {
  args: { variant: 'ghost', size: 'md', shape: 'square', ariaLabel: 'Add' },
  render: (args) => ({
    moduleMetadata: { imports: [AxIconButtonComponent] },
    template: `<ax-icon-button variant="${args.variant}" size="${args.size}" shape="${args.shape}" ariaLabel="${args.ariaLabel}">+</ax-icon-button>`,
  }),
};

export const Circle: Story = {
  args: { variant: 'primary', size: 'md', shape: 'circle', ariaLabel: 'Add' },
};

export const AllVariants: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxIconButtonComponent] },
    template: `
      <div class="flex items-center gap-2">
        <ax-icon-button variant="primary" ariaLabel="Add">+</ax-icon-button>
        <ax-icon-button variant="secondary" ariaLabel="Edit">~</ax-icon-button>
        <ax-icon-button variant="ghost" ariaLabel="More">…</ax-icon-button>
        <ax-icon-button variant="outline" ariaLabel="Settings">⚙</ax-icon-button>
        <ax-icon-button variant="destructive" ariaLabel="Delete">×</ax-icon-button>
      </div>
    `,
  }),
};

export const AllSizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxIconButtonComponent] },
    template: `
      <div class="flex items-center gap-2">
        <ax-icon-button size="sm" ariaLabel="Small">+</ax-icon-button>
        <ax-icon-button size="md" ariaLabel="Medium">+</ax-icon-button>
        <ax-icon-button size="lg" ariaLabel="Large">+</ax-icon-button>
      </div>
    `,
  }),
};
