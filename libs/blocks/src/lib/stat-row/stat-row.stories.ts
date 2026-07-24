import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxStatRowComponent } from './stat-row.component';
import type { StatItem } from '../blocks.types';

const STATS: StatItem[] = [
  { label: 'Users', value: 12480, trend: 8 },
  { label: 'MRR', value: 42, prefix: '$', suffix: 'k', trend: 12 },
  { label: 'Churn', value: 2.1, suffix: '%', trend: -3 },
  { label: 'NPS', value: 64, trend: 5 },
];

const meta: Meta<AxStatRowComponent> = {
  title: 'Blocks/StatRow',
  component: AxStatRowComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxStatRowComponent] })],
  render: () => ({
    props: { stats: STATS },
    template: `<ax-stat-row [stats]="stats" ariaLabel="Key metrics" />`,
  }),
};
export default meta;

type Story = StoryObj<AxStatRowComponent>;

export const Default: Story = {};

export const Banking: Story = {
  render: () => ({
    props: { stats: STATS },
    template: `<div data-industry="banking"><ax-stat-row [stats]="stats" ariaLabel="Key metrics" /></div>`,
  }),
};
