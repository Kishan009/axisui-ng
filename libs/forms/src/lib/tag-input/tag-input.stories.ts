import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTagInputComponent } from './tag-input.component';

const meta: Meta<AxTagInputComponent> = {
  title: 'Forms/TagInput',
  component: AxTagInputComponent,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    max: { control: 'number' },
    allowDuplicates: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { placeholder: 'Add a tag…', allowDuplicates: false, disabled: false },
  decorators: [moduleMetadata({ imports: [AxTagInputComponent] })],
  render: (args) => ({
    props: { ...args, value: ['design', 'a11y'] },
    template: `
      <div class="w-80">
        <ax-tag-input
          [value]="value"
          [placeholder]="placeholder"
          [max]="max"
          [allowDuplicates]="allowDuplicates"
          [disabled]="disabled"
          ariaLabel="Tags"
        />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxTagInputComponent>;

export const Default: Story = {};

export const Empty: Story = {
  render: (args) => ({
    props: args,
    template: `<div class="w-80"><ax-tag-input placeholder="Type and press Enter…" ariaLabel="Tags" /></div>`,
  }),
};

export const Capped: Story = { args: { max: 3 } };

export const Disabled: Story = { args: { disabled: true } };
