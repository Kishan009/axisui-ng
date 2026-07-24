import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxFeatureGridComponent } from './feature-grid.component';
import type { FeatureItem } from '../blocks.types';

const FEATURES: FeatureItem[] = [
  { icon: 'check', title: 'Signals-first', description: 'Zoneless-ready, OnPush everywhere.' },
  { icon: 'star', title: 'OKLCH tokens', description: 'Perceptual color, preset-reactive.' },
  { icon: 'check', title: 'Accessible', description: 'jest-axe tested in 3 modes.' },
];

const meta: Meta<AxFeatureGridComponent> = {
  title: 'Blocks/FeatureGrid',
  component: AxFeatureGridComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxFeatureGridComponent] })],
  render: () => ({
    props: { features: FEATURES },
    template: `<ax-feature-grid [features]="features" ariaLabel="Features" />`,
  }),
};
export default meta;

type Story = StoryObj<AxFeatureGridComponent>;

export const Default: Story = {};
