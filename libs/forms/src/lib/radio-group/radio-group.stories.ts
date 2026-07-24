import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxRadioComponent } from '../radio/radio.component';
import { AxRadioGroupComponent } from './radio-group.component';

const meta: Meta<AxRadioGroupComponent> = {
  title: 'Forms/RadioGroup',
  component: AxRadioGroupComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxRadioGroupComponent, AxRadioComponent] })],
};
export default meta;

type Story = StoryObj<AxRadioGroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <ax-radio-group [value]="'pro'" ariaLabel="Plan">
        <ax-radio value="free">Free</ax-radio>
        <ax-radio value="pro">Pro</ax-radio>
        <ax-radio value="team">Team</ax-radio>
      </ax-radio-group>
    `,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    template: `
      <ax-radio-group [value]="'md'" orientation="horizontal" ariaLabel="Size" class="flex-row gap-4">
        <ax-radio value="sm">Small</ax-radio>
        <ax-radio value="md">Medium</ax-radio>
        <ax-radio value="lg">Large</ax-radio>
      </ax-radio-group>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <ax-radio-group [value]="'free'" [disabled]="true" ariaLabel="Plan">
        <ax-radio value="free">Free</ax-radio>
        <ax-radio value="pro">Pro</ax-radio>
      </ax-radio-group>
    `,
  }),
};
