import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxHeadingDirective } from './heading.directive';

const meta: Meta = {
  title: 'Primitives/Heading',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxHeadingDirective] })],
};
export default meta;
type Story = StoryObj;

export const Levels: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-3 text-foreground">
        <h1 axHeading size="3xl">Page title (3xl)</h1>
        <h2 axHeading size="2xl">Section heading (2xl)</h2>
        <h3 axHeading size="xl">Subsection (xl)</h3>
        <h4 axHeading size="lg">Group label (lg)</h4>
      </div>`,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-2 text-foreground">
        <h2 axHeading size="2xl">Default tone</h2>
        <h2 axHeading size="2xl" tone="muted">Muted tone</h2>
        <h2 axHeading size="2xl" tone="primary">Primary tone</h2>
      </div>`,
  }),
};
