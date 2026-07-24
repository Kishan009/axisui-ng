import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxRadioComponent } from './radio.component';

const meta: Meta<AxRadioComponent> = {
  title: 'Forms/Radio',
  component: AxRadioComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxRadioComponent] })],
};
export default meta;
type Story = StoryObj<AxRadioComponent>;

export const Default: Story = {
  render: () => ({
    template: `<ax-radio name="demo" value="a" [checked]="true">Option A</ax-radio>`,
  }),
};

/** A radio group: children share a `name` and the parent tracks the selected value. */
export const Group: Story = {
  render: () => ({
    props: { selected: signal('standard') },
    template: `
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-medium">Shipping</legend>
        <ax-radio name="ship" value="standard" [checked]="selected() === 'standard'" (changed)="selected.set($event)">Standard</ax-radio>
        <ax-radio name="ship" value="express" [checked]="selected() === 'express'" (changed)="selected.set($event)">Express</ax-radio>
        <ax-radio name="ship" value="overnight" [checked]="selected() === 'overnight'" (changed)="selected.set($event)">Overnight</ax-radio>
      </fieldset>
      <p class="mt-2 text-sm text-muted-foreground">Selected: {{ selected() }}</p>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-2">
        <ax-radio name="d" value="on" [disabled]="true">Disabled</ax-radio>
        <ax-radio name="d" value="off" [checked]="true" [disabled]="true">Disabled, selected</ax-radio>
      </div>
    `,
  }),
};
