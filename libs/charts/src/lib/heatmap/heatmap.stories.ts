import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxHeatmapComponent } from './heatmap.component';

const MATRIX = [
  [2, 5, 8, 3, 0],
  [4, 9, 6, 1, 2],
  [7, 3, 5, 8, 4],
];

const meta: Meta<AxHeatmapComponent> = {
  title: 'Charts/Heatmap',
  component: AxHeatmapComponent,
  tags: ['autodocs'],
  argTypes: { scale: { control: 'inline-radio', options: ['sequential', 'bins'] } },
  args: { scale: 'sequential', colorIndex: 1 },
  decorators: [moduleMetadata({ imports: [AxHeatmapComponent] })],
  render: (args) => ({
    props: { ...args, matrix: MATRIX, rows: ['Mon', 'Tue', 'Wed'], cols: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'] },
    template: `<ax-heatmap [matrix]="matrix" [rows]="rows" [cols]="cols" [scale]="scale" [colorIndex]="colorIndex" ariaLabel="Weekly activity" />`,
  }),
};
export default meta;

type Story = StoryObj<AxHeatmapComponent>;

export const Sequential: Story = {};

export const Bins: Story = { args: { scale: 'bins' } };
