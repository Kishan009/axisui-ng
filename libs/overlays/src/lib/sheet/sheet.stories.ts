/**
 * Sheet stories. A modal drawer that slides in from an edge, sharing Dialog's
 * content slots (`axDialogTitle` / `axDialogBody` / `axDialogFooter`).
 */

import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSheetComponent, type SheetSide } from './sheet.component';

const triggerClass =
  'inline-flex items-center rounded-[var(--radius-md)] border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

const meta: Meta = {
  title: 'Overlays/Sheet',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSheetComponent] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    props: { open: signal(false) },
    template: `
      <button class="${triggerClass}" (click)="open.set(true)">Open sheet</button>
      <ax-sheet [(open)]="open" side="end">
        <h2 axDialogTitle class="text-lg font-semibold">Edit profile</h2>
        <p axDialogBody class="mt-1 text-sm text-muted-foreground">Make changes to your profile here. Press Escape or click the backdrop to close.</p>
      </ax-sheet>
    `,
  }),
};

/** The same sheet entering from each edge — `side` accepts logical `start`/`end` plus `top`/`bottom`. */
export const Sides: Story = {
  render: () => ({
    props: { open: signal(false), side: signal<SheetSide>('end') },
    template: `
      <div class="flex gap-2">
        <button class="${triggerClass}" (click)="side.set('start'); open.set(true)">Start</button>
        <button class="${triggerClass}" (click)="side.set('end'); open.set(true)">End</button>
        <button class="${triggerClass}" (click)="side.set('top'); open.set(true)">Top</button>
        <button class="${triggerClass}" (click)="side.set('bottom'); open.set(true)">Bottom</button>
      </div>
      <ax-sheet [(open)]="open" [side]="side()">
        <h2 axDialogTitle class="text-lg font-semibold">{{ side() }} sheet</h2>
        <p axDialogBody class="mt-1 text-sm text-muted-foreground">This drawer slides in from the {{ side() }} edge.</p>
      </ax-sheet>
    `,
  }),
};
