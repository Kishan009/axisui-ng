import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSegmentedComponent } from './segmented.component';
import type { SegmentedOption } from './segmented.types';

const OPTIONS: SegmentedOption[] = [
  { label: 'Day', value: 'd' },
  { label: 'Week', value: 'w' },
  { label: 'Month', value: 'm' },
];

const meta: Meta<AxSegmentedComponent> = {
  title: 'Buttons/Segmented',
  component: AxSegmentedComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  decorators: [moduleMetadata({ imports: [AxSegmentedComponent] })],
  args: { size: 'md', value: 'w', disabled: false },
  render: (args) => ({
    props: { ...args, options: OPTIONS },
    template: `
      <ax-segmented
        [options]="options"
        [size]="size"
        [value]="value"
        [disabled]="disabled"
        ariaLabel="Date range"
      ></ax-segmented>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxSegmentedComponent>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => ({
    props: { ...args, options: OPTIONS },
    template: `
      <div class="flex flex-col items-start gap-3">
        <ax-segmented [options]="options" size="sm" value="w" ariaLabel="Small" />
        <ax-segmented [options]="options" size="md" value="w" ariaLabel="Medium" />
        <ax-segmented [options]="options" size="lg" value="w" ariaLabel="Large" />
      </div>
    `,
  }),
};

export const WithDisabledSegment: Story = {
  render: (args) => ({
    props: {
      ...args,
      options: [
        { label: 'Left', value: 'l' },
        { label: 'Center', value: 'c', disabled: true },
        { label: 'Right', value: 'r' },
      ] satisfies SegmentedOption[],
    },
    template: `<ax-segmented [options]="options" value="l" ariaLabel="Alignment" />`,
  }),
};

export const Disabled: Story = { args: { disabled: true } };
