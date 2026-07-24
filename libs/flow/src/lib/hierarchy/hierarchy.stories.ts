import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxHierarchyComponent } from './hierarchy.component';
import { bracketTree } from './hierarchy-core';
import type { HierarchyNode } from './hierarchy.types';

interface Match {
  home: string;
  away: string;
  date?: string;
}
interface Person {
  name: string;
  role: string;
}

const meta: Meta<AxHierarchyComponent> = {
  title: 'Flow/Hierarchy',
  component: AxHierarchyComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxHierarchyComponent] })],
};
export default meta;

type Story = StoryObj<AxHierarchyComponent>;

/** The original use-case: a single-elimination bracket (root/final on the right). */
export const Bracket: Story = {
  render: () => ({
    props: {
      data: bracketTree<Match>([
        [
          { id: 'qf1', data: { home: 'South Africa', away: 'Canada', date: 'Mon 29 Jun' } },
          { id: 'qf2', data: { home: 'Netherlands', away: 'Morocco', date: 'Tue 30 Jun' } },
          { id: 'qf3', data: { home: 'Germany', away: 'Paraguay', date: 'Tue 30 Jun' } },
          { id: 'qf4', data: { home: 'France', away: 'Sweden', date: 'Wed 1 Jul' } },
        ],
        [
          { id: 'sf1', data: { home: 'TBD', away: 'TBD', date: 'Sat 4 Jul' } },
          { id: 'sf2', data: { home: 'TBD', away: 'TBD', date: 'Sun 5 Jul' } },
        ],
        [{ id: 'final', data: { home: 'TBD', away: 'TBD', date: 'Fri 10 Jul' } }],
      ]),
    },
    template: `
      <ax-hierarchy [data]="data" preset="bracket" ariaLabel="Tournament bracket"
                    [nodeWidth]="180" [nodeHeight]="68" class="max-w-full">
        <ng-template #node let-n>
          <div class="flex flex-col justify-center gap-1 py-1">
            @if (n.data?.date) {
              <span class="text-[11px] text-muted-foreground">{{ n.data.date }}</span>
            }
            <span class="text-sm font-medium">{{ n.data?.home }}</span>
            <span class="text-sm font-medium">{{ n.data?.away }}</span>
          </div>
        </ng-template>
      </ax-hierarchy>
    `,
  }),
};

/** An organisation chart (top-down). Same component, different direction + template. */
export const OrgChart: Story = {
  render: () => ({
    props: {
      data: [
        {
          id: 'ceo',
          data: { name: 'Ada Lovelace', role: 'CEO' },
          children: [
            {
              id: 'cto',
              data: { name: 'Alan Turing', role: 'CTO' },
              children: [
                { id: 'eng1', data: { name: 'Grace Hopper', role: 'Eng Lead' } },
                { id: 'eng2', data: { name: 'Ken Thompson', role: 'Eng Lead' } },
              ],
            },
            {
              id: 'cfo',
              data: { name: 'Katherine Johnson', role: 'CFO' },
              children: [{ id: 'fin1', data: { name: 'Dorothy Vaughan', role: 'Finance' } }],
            },
          ],
        },
      ] satisfies HierarchyNode<Person>[],
    },
    template: `
      <ax-hierarchy [data]="data" preset="org" ariaLabel="Org chart" [nodeHeight]="56">
        <ng-template #node let-n>
          <div class="flex flex-col justify-center py-1">
            <span class="text-sm font-medium">{{ n.data?.name }}</span>
            <span class="text-xs text-muted-foreground">{{ n.data?.role }}</span>
          </div>
        </ng-template>
      </ax-hierarchy>
    `,
  }),
};

/** A left-to-right decision tree with curved connectors. */
export const DecisionTree: Story = {
  render: () => ({
    props: {
      data: [
        {
          id: 'q1',
          data: { name: 'Logged in?' },
          children: [
            {
              id: 'q2',
              data: { name: 'Has subscription?' },
              children: [
                { id: 'a1', data: { name: 'Show dashboard' } },
                { id: 'a2', data: { name: 'Show paywall' } },
              ],
            },
            { id: 'a3', data: { name: 'Show login' } },
          ],
        },
      ] satisfies HierarchyNode<{ name: string }>[],
    },
    template: `
      <ax-hierarchy [data]="data" preset="tree" ariaLabel="Decision tree" [nodeHeight]="48">
        <ng-template #node let-n>
          <span class="flex h-full items-center text-sm">{{ n.data?.name }}</span>
        </ng-template>
      </ax-hierarchy>
    `,
  }),
};
