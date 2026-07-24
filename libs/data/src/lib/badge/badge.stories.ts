import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxBadgeComponent } from './badge.component';

const meta: Meta<AxBadgeComponent> = {
  title: 'Data/Badge',
  component: AxBadgeComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxBadgeComponent] })],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'destructive', 'info', 'outline'] },
    appearance: { control: 'inline-radio', options: ['solid', 'soft'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;
type Story = StoryObj<AxBadgeComponent>;

export const Default: Story = {
  args: { variant: 'default', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ax-badge [variant]="variant" [size]="size">Badge</ax-badge>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <ax-badge variant="default">Default</ax-badge>
        <ax-badge variant="success">Success</ax-badge>
        <ax-badge variant="warning">Warning</ax-badge>
        <ax-badge variant="destructive">Destructive</ax-badge>
        <ax-badge variant="info">Info</ax-badge>
        <ax-badge variant="outline">Outline</ax-badge>
      </div>
    `,
  }),
};

export const Soft: Story = {
  name: 'Soft (tinted)',
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <ax-badge variant="default" appearance="soft">Default</ax-badge>
        <ax-badge variant="success" appearance="soft">Success</ax-badge>
        <ax-badge variant="warning" appearance="soft">Warning</ax-badge>
        <ax-badge variant="destructive" appearance="soft">Destructive</ax-badge>
        <ax-badge variant="info" appearance="soft">Info</ax-badge>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <ax-badge size="sm">Small</ax-badge>
        <ax-badge size="md">Medium</ax-badge>
      </div>
    `,
  }),
};
