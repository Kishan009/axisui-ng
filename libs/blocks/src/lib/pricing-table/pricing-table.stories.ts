import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxPricingTableComponent } from './pricing-table.component';
import type { PricingTier } from '../blocks.types';

const TIERS: PricingTier[] = [
  { name: 'Starter', price: '$0', period: '/mo', features: ['1 project', 'Community support'] },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    features: ['Unlimited projects', 'Email support', 'Analytics'],
    highlighted: true,
    cta: 'Upgrade',
  },
  { name: 'Enterprise', price: 'Custom', features: ['SSO', 'Dedicated support', 'SLA'], cta: 'Contact us' },
];

const meta: Meta<AxPricingTableComponent> = {
  title: 'Blocks/PricingTable',
  component: AxPricingTableComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxPricingTableComponent] })],
  render: () => ({
    props: { tiers: TIERS },
    template: `<ax-pricing-table [tiers]="tiers" ariaLabel="Pricing" />`,
  }),
};
export default meta;

type Story = StoryObj<AxPricingTableComponent>;

export const Default: Story = {};
