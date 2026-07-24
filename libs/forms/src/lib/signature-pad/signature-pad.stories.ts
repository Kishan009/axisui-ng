import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSignaturePadComponent } from './signature-pad.component';

const meta: Meta<AxSignaturePadComponent> = {
  title: 'Forms/SignaturePad',
  component: AxSignaturePadComponent,
  tags: ['autodocs'],
  argTypes: {
    format: { control: 'inline-radio', options: ['svg', 'png'] },
    penWidth: { control: { type: 'number', min: 1, max: 8 } },
    disabled: { control: 'boolean' },
  },
  args: { format: 'svg', penWidth: 2, disabled: false },
  decorators: [moduleMetadata({ imports: [AxSignaturePadComponent] })],
  render: (args) => ({
    props: args,
    template: `<ax-signature-pad [format]="format" [penWidth]="penWidth" [disabled]="disabled" ariaLabel="Signature" />`,
  }),
};
export default meta;

type Story = StoryObj<AxSignaturePadComponent>;

export const Default: Story = {};

export const ThickPen: Story = { args: { penWidth: 4 } };

export const Disabled: Story = { args: { disabled: true } };
