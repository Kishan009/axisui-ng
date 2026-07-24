import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTreeComponent } from './ax-tree.component';
import type { TreeNode } from './tree-core';

const FILES: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: 'folder',
    children: [
      {
        id: 'app',
        label: 'app',
        icon: 'folder',
        children: [
          { id: 'main', label: 'main.ts', icon: 'file' },
          { id: 'appcmp', label: 'app.component.ts', icon: 'file' },
        ],
      },
      { id: 'styles', label: 'styles.css', icon: 'file' },
    ],
  },
  { id: 'pkg', label: 'package.json', icon: 'file' },
  { id: 'readme', label: 'README.md', icon: 'file' },
];

const BIG: TreeNode[] = Array.from({ length: 100 }, (_, i) => ({
  id: `g${i}`,
  label: `Group ${i + 1}`,
  children: Array.from({ length: 50 }, (_, j) => ({ id: `g${i}-${j}`, label: `Item ${i + 1}.${j + 1}` })),
}));

const meta: Meta<AxTreeComponent> = {
  title: 'Tree/Tree',
  component: AxTreeComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTreeComponent] })],
};
export default meta;

type Story = StoryObj<AxTreeComponent>;

export const FileExplorer: Story = {
  render: () => ({
    props: { nodes: FILES, expanded: ['src', 'app'] },
    template: `
      <div class="w-72 rounded-md border border-border p-2">
        <ax-tree [nodes]="nodes" selection="single" [expandedIds]="expanded" ariaLabel="Files" />
      </div>
    `,
  }),
};

export const Checkboxes: Story = {
  render: () => ({
    props: { nodes: FILES, expanded: ['src', 'app'] },
    template: `
      <div class="w-72 rounded-md border border-border p-2">
        <ax-tree [nodes]="nodes" selection="multiple" [expandedIds]="expanded" ariaLabel="Select files" />
      </div>
    `,
  }),
};

export const Virtual5kNodes: Story = {
  render: () => ({
    props: { nodes: BIG, expanded: ['g0', 'g1', 'g2'] },
    template: `
      <ax-tree
        class="block h-80 w-72 rounded-md border border-border p-1"
        [nodes]="nodes"
        selection="single"
        [expandedIds]="expanded"
        [virtual]="true"
        [itemSize]="28"
        ariaLabel="Large tree"
      />
    `,
  }),
};
