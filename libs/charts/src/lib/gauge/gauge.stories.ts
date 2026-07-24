import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxGaugeComponent } from './gauge.component';

const meta: Meta<AxGaugeComponent> = {
  title: 'Charts/Gauge',
  component: AxGaugeComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxGaugeComponent] })],
};
export default meta;

type Story = StoryObj<AxGaugeComponent>;

// Bottom semicircle (0 → 180).
export const Semicircle: Story = {
  render: () => ({
    template: `<ax-gauge [value]="72" [startAngle]="0" [endAngle]="180" label="Score" ariaLabel="Score" />`,
  }),
};

// Speedometer three-quarter arc (135 → 405).
export const Speedometer: Story = {
  render: () => ({
    template: `<ax-gauge [value]="48" [startAngle]="135" [endAngle]="405" [colorIndex]="2" label="Load" ariaLabel="Load" />`,
  }),
};
