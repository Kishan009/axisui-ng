import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxEmptyComponent } from './empty.component';

const meta: Meta<AxEmptyComponent> = {
  title: 'Feedback/Empty',
  component: AxEmptyComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxEmptyComponent] })],
  argTypes: { icon: { control: 'text' } },
};
export default meta;
type Story = StoryObj<AxEmptyComponent>;

export const Default: Story = {
  args: { icon: 'search', title: 'No results', description: 'Try a different search term.' },
};

export const WithAction: Story = {
  render: () => ({
    template: `<ax-empty icon="file" title="No documents" description="Upload your first file to get started.">
      <button class="rounded-[var(--radius-field)] bg-primary px-3 py-1.5 text-sm text-primary-foreground">Upload</button>
    </ax-empty>`,
  }),
};
