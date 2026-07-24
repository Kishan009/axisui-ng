import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCardComponent } from './card.component';

const meta: Meta = {
  title: 'Data/Card',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxCardComponent] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ax-card class="max-w-sm">
        <div axCardHeader><strong>Card title</strong></div>
        <div axCardContent>Card body content goes here.</div>
        <div axCardFooter>Footer</div>
      </ax-card>
    `,
  }),
};
