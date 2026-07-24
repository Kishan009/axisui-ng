import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSelectComponent, type AxSelectOption } from './select.component';

const options: AxSelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

const meta: Meta<AxSelectComponent> = {
  title: 'Forms/Select',
  component: AxSelectComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxSelectComponent] })],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: { size: 'md', placeholder: 'Select a country', disabled: false, invalid: false, required: false },
  render: (args) => ({
    props: { ...args, options },
    template: `
      <div class="w-64">
        <ax-select
          [options]="options"
          [size]="size"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [invalid]="invalid"
          [required]="required"
          ariaLabel="Country"
        ></ax-select>
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<AxSelectComponent>;

export const Default: Story = {};

export const Preselected: Story = {
  render: () => ({
    props: { options },
    template: `<div class="w-64"><ax-select [options]="options" [value]="'de'" ariaLabel="Country" /></div>`,
  }),
};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  render: () => ({
    props: { options },
    template: `
      <div class="flex w-64 flex-col gap-3">
        <ax-select [options]="options" size="sm" placeholder="Small" ariaLabel="Small" />
        <ax-select [options]="options" size="md" placeholder="Medium" ariaLabel="Medium" />
        <ax-select [options]="options" size="lg" placeholder="Large" ariaLabel="Large" />
      </div>
    `,
  }),
};
