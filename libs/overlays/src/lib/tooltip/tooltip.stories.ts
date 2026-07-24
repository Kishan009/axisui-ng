/**
 * Tooltip stories. `[axTooltip]` is a directive applied to any focusable element;
 * it shows a small text panel on hover/focus and hides on blur/Escape.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTooltipDirective } from './tooltip.directive';

const triggerClass =
  'inline-flex items-center rounded-[var(--radius-md)] border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

const meta: Meta = {
  title: 'Overlays/Tooltip',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTooltipDirective] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `<button class="${triggerClass}" [axTooltip]="'Save changes'">Hover or focus me</button>`,
  }),
};

/** Placement uses logical sides — `start`/`end` flip under RTL. */
export const Placements: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-3 p-12">
        <button class="${triggerClass}" [axTooltip]="'Top'" axTooltipPlacement="top">Top</button>
        <button class="${triggerClass}" [axTooltip]="'Bottom'" axTooltipPlacement="bottom">Bottom</button>
        <button class="${triggerClass}" [axTooltip]="'Start'" axTooltipPlacement="start">Start</button>
        <button class="${triggerClass}" [axTooltip]="'End'" axTooltipPlacement="end">End</button>
      </div>
    `,
  }),
};

export const NoDelay: Story = {
  render: () => ({
    template: `<button class="${triggerClass}" [axTooltip]="'Instant'" [showDelay]="0">Instant tooltip</button>`,
  }),
};
