import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTextDirective } from './text.directive';

const meta: Meta = {
  title: 'Primitives/Text',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTextDirective] })],
};
export default meta;
type Story = StoryObj;

export const Scale: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-2 text-foreground">
        <p axText size="xl">xl — lead paragraph</p>
        <p axText size="lg">lg — card title</p>
        <p axText size="base">base — long-form body copy</p>
        <p axText size="sm">sm — default UI body</p>
        <p axText size="xs" tone="muted">xs — muted caption</p>
      </div>`,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-1 text-foreground">
        <p axText>Default tone</p>
        <p axText tone="muted">Muted tone</p>
        <p axText tone="primary">Primary tone</p>
        <p axText tone="destructive">Destructive tone</p>
      </div>`,
  }),
};

export const SectionLabel: Story = {
  render: () => ({
    template: `<span axText size="xs" tone="muted" transform="upper" tracking="wide">Section label</span>`,
  }),
};

export const Truncated: Story = {
  render: () => ({
    template: `
      <p axText truncate class="max-w-[16rem] text-foreground">
        This is a very long line of text that should be truncated with an ellipsis when it exceeds the container width.
      </p>`,
  }),
};
