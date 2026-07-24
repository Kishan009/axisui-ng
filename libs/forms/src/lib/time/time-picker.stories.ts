import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTimePickerComponent } from './time-picker.component';
import type { TimeValue } from './time-core';

const meta: Meta<AxTimePickerComponent> = {
  title: 'Forms/Time Picker',
  component: AxTimePickerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTimePickerComponent] })],
  argTypes: {
    use24: { control: 'boolean' },
    withSeconds: { control: 'boolean' },
    minuteStep: { control: { type: 'number', min: 1, max: 30 } },
  },
};
export default meta;
type Story = StoryObj<AxTimePickerComponent>;

/** Focus a segment and use ↑/↓ to spin the value. */
export const Default: Story = {
  render: () => ({
    props: { value: signal<TimeValue>({ hours: 9, minutes: 30 }) },
    template: `<ax-time-picker [(value)]="value" />`,
  }),
};

export const TwelveHour: Story = {
  render: () => ({
    props: { value: signal<TimeValue>({ hours: 14, minutes: 15 }) },
    template: `<ax-time-picker [(value)]="value" [use24]="false" />`,
  }),
};

export const WithSeconds: Story = {
  render: () => ({
    props: { value: signal<TimeValue>({ hours: 9, minutes: 30, seconds: 0 }) },
    template: `<ax-time-picker [(value)]="value" [withSeconds]="true" />`,
  }),
};
