import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTreeSelectComponent } from './tree-select.component';
import type { TreeNode } from '@axisui-ng/tree';

const NODES: TreeNode[] = [
  {
    id: 'fruit',
    label: 'Fruit',
    icon: 'folder',
    children: [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' },
      { id: 'citrus', label: 'Citrus', children: [{ id: 'orange', label: 'Orange' }, { id: 'lemon', label: 'Lemon' }] },
    ],
  },
  {
    id: 'veg',
    label: 'Vegetables',
    icon: 'folder',
    children: [
      { id: 'carrot', label: 'Carrot' },
      { id: 'potato', label: 'Potato' },
    ],
  },
];

const meta: Meta<AxTreeSelectComponent> = {
  title: 'Forms/TreeSelect',
  component: AxTreeSelectComponent,
  tags: ['autodocs'],
  argTypes: {
    selection: { control: 'inline-radio', options: ['single', 'multiple'] },
    searchable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { selection: 'single', searchable: true, disabled: false },
  decorators: [moduleMetadata({ imports: [AxTreeSelectComponent] })],
  render: (args) => ({
    props: { ...args, nodes: NODES },
    template: `
      <div class="w-72">
        <ax-tree-select
          [nodes]="nodes"
          [selection]="selection"
          [searchable]="searchable"
          [disabled]="disabled"
          placeholder="Choose…"
          ariaLabel="Category"
        />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxTreeSelectComponent>;

export const Single: Story = {};

export const Multiple: Story = { args: { selection: 'multiple' } };

export const NoSearch: Story = { args: { searchable: false } };

export const Disabled: Story = { args: { disabled: true } };
