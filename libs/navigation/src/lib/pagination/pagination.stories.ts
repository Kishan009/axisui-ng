import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxPaginationComponent } from './pagination.component';

const meta: Meta<AxPaginationComponent> = {
  title: 'Navigation/Pagination',
  component: AxPaginationComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxPaginationComponent] })],
  argTypes: {
    total: { control: 'number' },
    pageSize: { control: 'number' },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
  },
};
export default meta;
type Story = StoryObj<AxPaginationComponent>;

export const Default: Story = {
  render: () => ({
    props: { page: signal(1) },
    template: `<ax-pagination [(page)]="page" [total]="200" [pageSize]="10" />`,
  }),
};

/** Mid-range — ellipses appear on both sides of the current page. */
export const MiddlePage: Story = {
  render: () => ({
    props: { page: signal(8) },
    template: `<ax-pagination [(page)]="page" [total]="200" [pageSize]="10" />`,
  }),
};

/** Few pages — every page is shown, no ellipsis. */
export const FewPages: Story = {
  render: () => ({
    props: { page: signal(1) },
    template: `<ax-pagination [(page)]="page" [total]="30" [pageSize]="10" />`,
  }),
};
