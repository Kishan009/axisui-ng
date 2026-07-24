/**
 * ToggleGroup stories.
 */

import type { Meta, StoryObj } from '@storybook/angular';

import { AxToggleComponent } from '../toggle/toggle.component';
import { AxToggleGroupComponent } from './toggle-group.component';

const meta: Meta<AxToggleGroupComponent> = {
  title: 'Buttons/ToggleGroup',
  component: AxToggleGroupComponent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<AxToggleGroupComponent>;

export const Single: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxToggleGroupComponent, AxToggleComponent] },
    template: `
      <ax-toggle-group type="single" ariaLabel="Text alignment">
        <ax-toggle value="left">Left</ax-toggle>
        <ax-toggle value="center">Center</ax-toggle>
        <ax-toggle value="right">Right</ax-toggle>
      </ax-toggle-group>
    `,
  }),
};

export const Multiple: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxToggleGroupComponent, AxToggleComponent] },
    template: `
      <ax-toggle-group type="multiple" ariaLabel="Formatting">
        <ax-toggle value="bold"><b>B</b></ax-toggle>
        <ax-toggle value="italic"><i>I</i></ax-toggle>
        <ax-toggle value="underline"><u>U</u></ax-toggle>
      </ax-toggle-group>
    `,
  }),
};
