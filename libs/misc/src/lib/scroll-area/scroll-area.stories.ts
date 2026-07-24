import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxScrollAreaComponent } from './scroll-area.component';

const ROWS = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);
const TAGS = Array.from({ length: 24 }, (_, i) => `Tag ${i + 1}`);

const meta: Meta<AxScrollAreaComponent> = {
  title: 'Misc/ScrollArea',
  component: AxScrollAreaComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
  },
  args: { orientation: 'vertical' },
  decorators: [moduleMetadata({ imports: [AxScrollAreaComponent] })],
};
export default meta;

type Story = StoryObj<AxScrollAreaComponent>;

export const Vertical: Story = {
  render: () => ({
    props: { rows: ROWS },
    template: `
      <ax-scroll-area class="h-60 w-56 rounded-md border border-border p-3" ariaLabel="Items">
        @for (row of rows; track row) {
          <div class="py-1 text-sm">{{ row }}</div>
        }
      </ax-scroll-area>
    `,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    props: { tags: TAGS },
    template: `
      <ax-scroll-area orientation="horizontal" class="w-80 rounded-md border border-border p-3" ariaLabel="Tags">
        <div class="flex gap-2">
          @for (tag of tags; track tag) {
            <span class="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm">{{ tag }}</span>
          }
        </div>
      </ax-scroll-area>
    `,
  }),
};
