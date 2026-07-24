import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSkeletonComponent } from './skeleton.component';

const meta: Meta<AxSkeletonComponent> = {
  title: 'Feedback/Skeleton',
  component: AxSkeletonComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSkeletonComponent] })],
  argTypes: {
    variant: { control: 'select', options: ['text', 'circle', 'rect'] },
    width: { control: 'text' },
    height: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<AxSkeletonComponent>;

export const Text: Story = { args: { variant: 'text', width: '12rem' } };

export const Circle: Story = { args: { variant: 'circle', width: '3rem', height: '3rem' } };

export const Rect: Story = { args: { variant: 'rect', width: '16rem', height: '8rem' } };

/** Compose multiple skeletons to mirror the layout you're loading. */
export const CardPlaceholder: Story = {
  render: () => ({
    template: `
      <div class="flex w-72 items-center gap-3">
        <ax-skeleton variant="circle" width="3rem" height="3rem" />
        <div class="flex flex-1 flex-col gap-2">
          <ax-skeleton variant="text" width="80%" />
          <ax-skeleton variant="text" width="60%" />
        </div>
      </div>
    `,
  }),
};
