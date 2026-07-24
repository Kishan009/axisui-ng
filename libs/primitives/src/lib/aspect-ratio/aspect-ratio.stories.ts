import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxAspectRatioDirective } from './aspect-ratio.directive';

const meta: Meta = {
  title: 'Primitives/AspectRatio',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxAspectRatioDirective] })],
};
export default meta;
type Story = StoryObj;

export const Widescreen: Story = {
  render: () => ({
    template: `<div [axAspectRatio]="16 / 9" class="w-80 rounded-[var(--radius-md)] border border-border bg-muted">
      <div class="flex h-full w-full items-center justify-center text-sm text-muted-foreground">16 / 9</div>
    </div>`,
  }),
};

export const Square: Story = {
  render: () => ({
    template: `<div [axAspectRatio]="1" class="w-48 rounded-[var(--radius-md)] border border-border bg-muted">
      <div class="flex h-full w-full items-center justify-center text-sm text-muted-foreground">1 / 1</div>
    </div>`,
  }),
};
