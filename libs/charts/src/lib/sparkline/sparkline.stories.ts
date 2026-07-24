import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSparklineComponent } from './sparkline.component';

const DATA = [3, 7, 4, 9, 6, 10, 8, 12];

const meta: Meta<AxSparklineComponent> = {
  title: 'Charts/Sparkline',
  component: AxSparklineComponent,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'inline-radio', options: ['line', 'area'] },
    colorIndex: { control: { type: 'number', min: 1, max: 5 } },
  },
  args: { type: 'line', colorIndex: 1, showDot: false },
  decorators: [moduleMetadata({ imports: [AxSparklineComponent] })],
  render: (args) => ({
    props: { ...args, data: DATA },
    template: `<ax-sparkline [data]="data" [type]="type" [colorIndex]="colorIndex" [showDot]="showDot" ariaLabel="Trend" />`,
  }),
};
export default meta;

type Story = StoryObj<AxSparklineComponent>;

export const Line: Story = {};

export const Area: Story = { args: { type: 'area', showDot: true } };
