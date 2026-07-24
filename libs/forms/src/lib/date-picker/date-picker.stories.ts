import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxDatePickerComponent } from './date-picker.component';
import type { CalendarValue } from '../calendar/date-core';

const meta: Meta<AxDatePickerComponent> = {
  title: 'Forms/Date Picker',
  component: AxDatePickerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxDatePickerComponent] })],
};
export default meta;
type Story = StoryObj<AxDatePickerComponent>;

/** Click the input to open the calendar; free-text entry is parsed on blur/Enter. */
export const Default: Story = {
  render: () => ({
    props: { value: signal<CalendarValue>(null) },
    template: `<ax-date-picker [(value)]="value" placeholder="Pick a date" />`,
  }),
};

export const Preselected: Story = {
  render: () => ({
    props: { value: signal<CalendarValue>(new Date(2026, 5, 15)) },
    template: `<ax-date-picker [(value)]="value" />`,
  }),
};

/** Range mode selects a start and end date with a custom display format. */
export const Range: Story = {
  render: () => ({
    props: { value: signal<CalendarValue>({ start: new Date(2026, 5, 10), end: new Date(2026, 5, 17) }) },
    template: `<ax-date-picker mode="range" [(value)]="value" format="MM/dd/yyyy" placeholder="Start – End" />`,
  }),
};
