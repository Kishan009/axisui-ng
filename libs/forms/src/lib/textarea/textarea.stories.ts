import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTextareaComponent } from './textarea.component';

const meta: Meta<AxTextareaComponent> = {
  title: 'Forms/Textarea',
  component: AxTextareaComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTextareaComponent] })],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    rows: { control: { type: 'number', min: 2, max: 12 } },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    size: 'md',
    rows: 4,
    placeholder: 'Write a message…',
    disabled: false,
    readonly: false,
    invalid: false,
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-80">
        <ax-textarea
          [size]="size"
          [rows]="rows"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [invalid]="invalid"
          [required]="required"
        ></ax-textarea>
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<AxTextareaComponent>;

export const Default: Story = {};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true, placeholder: 'Disabled' } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="flex w-80 flex-col gap-3">
        <ax-textarea size="sm" [rows]="2" placeholder="Small" />
        <ax-textarea size="md" [rows]="3" placeholder="Medium" />
        <ax-textarea size="lg" [rows]="4" placeholder="Large" />
      </div>
    `,
  }),
};
