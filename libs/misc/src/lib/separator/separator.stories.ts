import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSeparatorComponent } from './separator.component';

const meta: Meta<AxSeparatorComponent> = {
  title: 'Misc/Separator',
  component: AxSeparatorComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSeparatorComponent] })],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<AxSeparatorComponent>;

export const Horizontal: Story = {
  render: () => ({
    template: `<div class="w-64 text-sm"><p>Above the rule.</p><ax-separator class="my-3" /><p>Below the rule.</p></div>`,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `<div class="flex h-5 items-stretch gap-3 text-sm"><span>Docs</span><ax-separator orientation="vertical" /><span>About</span></div>`,
  }),
};
