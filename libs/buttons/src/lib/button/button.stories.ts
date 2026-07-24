/**
 * Button stories — the canonical Storybook story pattern.
 * One Default + one per variant + one per size + a few compositions.
 *
 * The Preset/Theme/Density toolbar (configured in apps/storybook/.storybook/preview.ts)
 * previews the same story against all consumer + industry presets in light/dark.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxButtonComponent } from './button.component';

const meta: Meta<AxButtonComponent & { label: string }> = {
  title: 'Buttons/Button',
  component: AxButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'destructive', 'link'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  decorators: [moduleMetadata({ imports: [AxButtonComponent] })],
  args: { label: 'Button', variant: 'primary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ax-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading">{{ label }}</ax-button>`,
  }),
};
export default meta;

type Story = StoryObj<AxButtonComponent & { label: string }>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: 'primary', size: 'md' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md' },
};

export const Outline: Story = {
  args: { variant: 'outline', size: 'md' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', size: 'md' },
};

export const Link: Story = {
  args: { variant: 'link', size: 'md' },
};

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', disabled: true },
};

export const Loading: Story = {
  args: { variant: 'primary', size: 'md', loading: true },
};

export const AllSizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxButtonComponent] },
    template: `
      <div class="flex items-center gap-2">
        <ax-button size="sm">Small</ax-button>
        <ax-button size="md">Medium</ax-button>
        <ax-button size="lg">Large</ax-button>
      </div>
    `,
  }),
};
