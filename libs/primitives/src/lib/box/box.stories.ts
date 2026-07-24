import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxBoxDirective } from './box.directive';

const meta: Meta = {
  title: 'Primitives/Box',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxBoxDirective] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `<div axBox p="6" rounded="lg" border class="bg-card text-card-foreground">Box content</div>`,
  }),
};
