/**
 * HoverCard stories. A non-modal rich preview opened on hover/focus of its
 * trigger via `[axHoverCardFor]`, after a short delay.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxHoverCardComponent } from './hover-card.component';
import { AxHoverCardTriggerDirective } from './hover-card-trigger.directive';

const meta: Meta = {
  title: 'Overlays/Hover Card',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxHoverCardComponent, AxHoverCardTriggerDirective] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="p-8">
        <a class="cursor-pointer text-sm font-medium text-primary underline" [axHoverCardFor]="h" tabindex="0">@ada</a>
        <ax-hover-card #h placement="bottom-start">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">AL</span>
            <div>
              <p class="text-sm font-medium">Ada Lovelace</p>
              <p class="text-xs text-muted-foreground">First computer programmer</p>
            </div>
          </div>
          <p class="mt-3 text-sm text-muted-foreground">Wrote the first algorithm intended for a machine.</p>
        </ax-hover-card>
      </div>
    `,
  }),
};
