import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxChipComponent } from './chip.component';

const meta: Meta<AxChipComponent> = {
  title: 'Forms/Chip',
  component: AxChipComponent,
  tags: ['autodocs'],
  argTypes: {
    removable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { removable: true, disabled: false },
  decorators: [moduleMetadata({ imports: [AxChipComponent] })],
  render: (args) => ({
    props: args,
    template: `<ax-chip [removable]="removable" [disabled]="disabled" removeAriaLabel="Remove Design">Design</ax-chip>`,
  }),
};
export default meta;

type Story = StoryObj<AxChipComponent>;

export const Default: Story = {};

export const NotRemovable: Story = { args: { removable: false } };

export const Disabled: Story = { args: { disabled: true } };

export const Group: Story = {
  render: () => ({
    props: { tags: ['Design', 'Engineering', 'Product', 'Marketing'] },
    template: `
      <div class="flex flex-wrap gap-2">
        @for (t of tags; track t) {
          <ax-chip removable [removeAriaLabel]="'Remove ' + t">{{ t }}</ax-chip>
        }
      </div>
    `,
  }),
};
