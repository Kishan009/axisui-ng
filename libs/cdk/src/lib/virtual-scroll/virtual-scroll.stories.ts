import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxVirtualForDirective } from './ax-virtual-for.directive';
import { AxVirtualViewportDirective } from './ax-virtual-viewport.directive';

const ROWS = Array.from({ length: 10000 }, (_, i) => `Row ${i + 1}`);

const ROW_CLASS = 'flex h-9 items-center border-b border-border px-3';
const BTN = 'rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted';

const meta: Meta = {
  title: 'CDK/VirtualScroll',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxVirtualViewportDirective, AxVirtualForDirective] })],
};
export default meta;

type Story = StoryObj;

export const TenThousandRows: Story = {
  render: () => ({
    props: { rows: ROWS },
    template: `
      <div class="w-80">
        <div axVirtualViewport class="h-80 rounded-md border border-border text-sm">
          <div *axVirtualFor="let row of rows; itemSize: 36" class="${ROW_CLASS}">{{ row }}</div>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">10,000 rows — only the visible slice is in the DOM.</p>
      </div>
    `,
  }),
};

export const JumpToIndex: Story = {
  render: () => ({
    props: { rows: ROWS },
    template: `
      <div class="w-80">
        <div axVirtualViewport #vp="axVirtualViewport" class="h-80 rounded-md border border-border text-sm">
          <div *axVirtualFor="let row of rows; itemSize: 36" class="${ROW_CLASS}">{{ row }}</div>
        </div>
        <div class="mt-2 flex gap-2">
          <button type="button" class="${BTN}" (click)="vp.scrollToIndex(0)">Top</button>
          <button type="button" class="${BTN}" (click)="vp.scrollToIndex(5000)">Jump to 5000</button>
          <button type="button" class="${BTN}" (click)="vp.scrollToIndex(9999)">Bottom</button>
        </div>
      </div>
    `,
  }),
};
