import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTimelineComponent } from './timeline.component';
import { AxTimelineItemComponent } from './timeline-item.component';
import type { TimelineItem } from './timeline.types';

const EVENTS: TimelineItem[] = [
  { title: 'Order placed', time: 'Mon 09:00', description: 'We received your order.', color: 'primary' },
  { title: 'Shipped', time: 'Tue 14:20', description: 'Left the warehouse.', icon: 'check', color: 'success' },
  { title: 'Out for delivery', time: 'Wed 08:10', icon: 'clock' },
  { title: 'Delivered', time: 'Wed 17:45', icon: 'check', color: 'success' },
];

const meta: Meta<AxTimelineComponent> = {
  title: 'Data/Timeline',
  component: AxTimelineComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTimelineComponent, AxTimelineItemComponent] })],
};
export default meta;

type Story = StoryObj<AxTimelineComponent>;

export const Vertical: Story = {
  render: () => ({
    template: `
      <div class="w-96">
        <ax-timeline>
          <ax-timeline-item title="Created" time="09:00" color="primary">Order placed.</ax-timeline-item>
          <ax-timeline-item title="Shipped" time="14:20" icon="check" color="success">Left the warehouse.</ax-timeline-item>
          <ax-timeline-item title="Delivered" time="17:45" icon="check" color="success" />
        </ax-timeline>
      </div>
    `,
  }),
};

export const DataDriven: Story = {
  render: () => ({
    props: { events: EVENTS },
    template: `<div class="w-96"><ax-timeline [items]="events" /></div>`,
  }),
};

export const Alternating: Story = {
  render: () => ({
    props: { events: EVENTS },
    template: `<div class="w-[640px]"><ax-timeline [items]="events" align="alternate" /></div>`,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    props: { events: EVENTS },
    template: `<div class="w-full"><ax-timeline [items]="events" orientation="horizontal" /></div>`,
  }),
};
