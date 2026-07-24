import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSpinnerComponent } from './spinner.component';

const meta: Meta<AxSpinnerComponent> = {
  title: 'Feedback/Spinner',
  component: AxSpinnerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSpinnerComponent] })],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    ariaLabel: { control: 'text' },
  },
  args: { size: 'md' },
  render: (args) => ({
    props: args,
    template: `<span class="text-primary"><ax-spinner [size]="size" ariaLabel="Loading" /></span>`,
  }),
};
export default meta;
type Story = StoryObj<AxSpinnerComponent>;

export const Default: Story = {};

/** Color inherits via `currentColor` — set text color on an ancestor. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-4 text-primary">
        <ax-spinner size="sm" ariaLabel="Small" />
        <ax-spinner size="md" ariaLabel="Medium" />
        <ax-spinner size="lg" ariaLabel="Large" />
      </div>
    `,
  }),
};
