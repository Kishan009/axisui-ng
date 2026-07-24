import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxAvatarComponent } from './avatar.component';
import { AxAvatarGroupComponent } from './avatar-group.component';

const meta: Meta<AxAvatarComponent> = {
  title: 'Data/Avatar',
  component: AxAvatarComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxAvatarComponent, AxAvatarGroupComponent] })],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    src: { control: 'text' },
    initials: { control: 'text' },
    alt: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<AxAvatarComponent>;

/** Image source — falls back to initials, then a user icon, if it fails to load. */
export const Image: Story = {
  args: { src: 'https://i.pravatar.cc/150?img=12', alt: 'Jane Doe', size: 'md' },
};

export const Initials: Story = {
  args: { initials: 'JD', size: 'md' },
};

/** No src or initials — the user icon is the final fallback. */
export const IconFallback: Story = {
  args: { size: 'md' },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-3">
        <ax-avatar initials="SM" size="sm" />
        <ax-avatar initials="MD" size="md" />
        <ax-avatar initials="LG" size="lg" />
      </div>
    `,
  }),
};

/** Overlapping stack; `max` collapses the extras into a trailing "+N" chip. */
export const Group: Story = {
  render: () => ({
    template: `
      <ax-avatar-group [max]="3" size="md">
        <ax-avatar initials="AB" />
        <ax-avatar initials="CD" />
        <ax-avatar initials="EF" />
        <ax-avatar initials="GH" />
        <ax-avatar initials="IJ" />
      </ax-avatar-group>
    `,
  }),
};
