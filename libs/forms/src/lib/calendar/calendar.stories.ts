import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCalendarComponent } from './calendar.component';
import { type CalendarValue } from './date-core';

const meta: Meta = {
  title: 'Forms/Calendar',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxCalendarComponent] })],
};
export default meta;
type Story = StoryObj;

export const Single: Story = {
  render: () => ({ props: { value: signal<CalendarValue>(null) }, template: `<ax-calendar [(value)]="value" />` }),
};

export const Range: Story = {
  render: () => ({ props: { value: signal<CalendarValue>(null) }, template: `<ax-calendar mode="range" [(value)]="value" />` }),
};
