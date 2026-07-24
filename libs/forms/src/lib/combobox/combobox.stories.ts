import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxComboboxComponent } from './combobox.component';
import type { ComboboxOption } from './combobox.types';

const OPTIONS: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'br', label: 'Brazil' },
  { value: 'ar', label: 'Argentina' },
];

const meta: Meta<AxComboboxComponent> = {
  title: 'Forms/Combobox',
  component: AxComboboxComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxComboboxComponent] })],
};
export default meta;

type Story = StoryObj<AxComboboxComponent>;

export const Single: Story = {
  render: () => ({
    props: { options: OPTIONS },
    template: `<div class="w-72"><ax-combobox [options]="options" placeholder="Country" /></div>`,
  }),
};

export const MultipleText: Story = {
  render: () => ({
    props: { options: OPTIONS, value: ['us', 'ca'] },
    template: `<div class="w-72"><ax-combobox [options]="options" [value]="value" [multiple]="true" placeholder="Countries" /></div>`,
  }),
};

export const MultiSelectChips: Story = {
  render: () => ({
    props: { options: OPTIONS, value: ['us', 'ca'] },
    template: `<div class="w-72"><ax-combobox [options]="options" [value]="value" [multiple]="true" [chips]="true" placeholder="Countries" ariaLabel="Countries" /></div>`,
  }),
};
