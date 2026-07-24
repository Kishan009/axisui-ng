import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxBreadcrumbComponent } from './breadcrumb.component';
import { AxBreadcrumbItemComponent } from './breadcrumb-item.component';

const meta: Meta = {
  title: 'Navigation/Breadcrumb',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxBreadcrumbComponent, AxBreadcrumbItemComponent] })],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ax-breadcrumb>
        <ax-breadcrumb-item><a href="#">Home</a></ax-breadcrumb-item>
        <ax-breadcrumb-item><a href="#">Library</a></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Components</ax-breadcrumb-item>
      </ax-breadcrumb>
    `,
  }),
};
