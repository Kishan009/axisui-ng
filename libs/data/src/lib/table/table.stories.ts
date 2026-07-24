import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxTableComponent } from './table.component';
import type { ColDef } from './table.types';

interface Person extends Record<string, unknown> {
  name: string;
  role: string;
  age: number;
}

const columns: ColDef<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'end' },
];

const data: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer', age: 36 },
  { name: 'Alan Turing', role: 'Researcher', age: 41 },
  { name: 'Grace Hopper', role: 'Admiral', age: 79 },
  { name: 'Katherine Johnson', role: 'Mathematician', age: 60 },
];

const meta: Meta = {
  title: 'Data/Table',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxTableComponent] })],
};
export default meta;
type Story = StoryObj;

/** Sortable columns (click a header to cycle asc → desc → none), no pagination. */
export const Default: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-table class="block w-[32rem]" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

export const Searchable: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-table class="block w-[32rem]" [columns]="columns" [data]="data" [searchable]="true" [pageSize]="0" />`,
  }),
};

/** Pagination kicks in once rows exceed `pageSize`. */
export const Paginated: Story = {
  render: () => ({
    props: {
      columns,
      data: [...data, ...data, ...data].map((r, i) => ({ ...r, name: `${r.name} #${i + 1}` })),
    },
    template: `<ax-table class="block w-[32rem]" [columns]="columns" [data]="data" [pageSize]="5" [searchable]="true" />`,
  }),
};
