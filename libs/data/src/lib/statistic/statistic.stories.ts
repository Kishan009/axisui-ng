import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxStatisticComponent } from './statistic.component';

const meta: Meta<AxStatisticComponent> = {
  title: 'Data/Statistic',
  component: AxStatisticComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxStatisticComponent] })],
};
export default meta;
type Story = StoryObj<AxStatisticComponent>;

export const Default: Story = { args: { label: 'Revenue', value: 42500, prefix: '$', locale: 'en-US', trend: 12 } };
export const Negative: Story = { args: { label: 'Churn', value: 3.2, suffix: '%', trend: -1.4 } };
export const PlainNumber: Story = { args: { label: 'Active users', value: 1284, locale: 'en-US' } };
