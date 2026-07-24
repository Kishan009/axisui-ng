/**
 * ButtonGroup stories.
 */

import type { Meta, StoryObj } from '@storybook/angular';

import { AxButtonComponent } from '../button/button.component';
import { AxButtonGroupComponent } from './button-group.component';

const meta: Meta<AxButtonGroupComponent> = {
  title: 'Buttons/ButtonGroup',
  component: AxButtonGroupComponent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<AxButtonGroupComponent>;

export const Default: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxButtonGroupComponent, AxButtonComponent] },
    template: `
      <div axButtonGroup ariaLabel="Text alignment">
        <ax-button variant="outline">Left</ax-button>
        <ax-button variant="outline">Center</ax-button>
        <ax-button variant="outline">Right</ax-button>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxButtonGroupComponent, AxButtonComponent] },
    template: `
      <div axButtonGroup orientation="vertical" ariaLabel="Sort">
        <ax-button variant="outline">Asc</ax-button>
        <ax-button variant="outline">Desc</ax-button>
      </div>
    `,
  }),
};
