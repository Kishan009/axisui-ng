import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxSplitterComponent } from './splitter.component';
import { AxSplitterPanelComponent } from './splitter-panel.component';
import { AxSplitterHandleComponent } from './splitter-handle.component';

const meta: Meta<AxSplitterComponent> = {
  title: 'Layout/Splitter',
  component: AxSplitterComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [AxSplitterComponent, AxSplitterPanelComponent, AxSplitterHandleComponent] }),
  ],
};
export default meta;

type Story = StoryObj<AxSplitterComponent>;

const box = (label: string) => `<div class="flex h-full items-center justify-center p-4 text-sm">${label}</div>`;

export const Horizontal: Story = {
  render: () => ({
    template: `
      <div class="h-64 rounded-md border border-border">
        <ax-splitter ariaLabel="Horizontal">
          <ax-splitter-panel [size]="30" [minSize]="15">${box('Sidebar')}</ax-splitter-panel>
          <ax-splitter-panel [size]="70">${box('Content')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <div class="h-80 rounded-md border border-border">
        <ax-splitter orientation="vertical" ariaLabel="Vertical">
          <ax-splitter-panel [size]="60">${box('Editor')}</ax-splitter-panel>
          <ax-splitter-panel [size]="40" [minSize]="15">${box('Terminal')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};

export const ThreePanel: Story = {
  render: () => ({
    template: `
      <div class="h-64 rounded-md border border-border">
        <ax-splitter ariaLabel="Three panel">
          <ax-splitter-panel [size]="25" [minSize]="10">${box('Files')}</ax-splitter-panel>
          <ax-splitter-panel [size]="50">${box('Editor')}</ax-splitter-panel>
          <ax-splitter-panel [size]="25" [minSize]="10">${box('Preview')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};

export const Collapsible: Story = {
  render: () => ({
    template: `
      <div class="h-64 rounded-md border border-border">
        <ax-splitter ariaLabel="Collapsible">
          <ax-splitter-panel [size]="30" [minSize]="12" [collapsible]="true">${box('Double-click the gutter →')}</ax-splitter-panel>
          <ax-splitter-panel [size]="70">${box('Content')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};

export const ExplicitHandles: Story = {
  render: () => ({
    template: `
      <div class="h-64 rounded-md border border-border">
        <ax-splitter [autoGutters]="false" ariaLabel="Explicit handles">
          <ax-splitter-panel [size]="50">${box('Left')}</ax-splitter-panel>
          <ax-splitter-handle class="flex items-center justify-center"><span class="text-xs">⋮</span></ax-splitter-handle>
          <ax-splitter-panel [size]="50">${box('Right')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};

export const Persisted: Story = {
  render: () => ({
    template: `
      <div class="h-64 rounded-md border border-border">
        <ax-splitter storeKey="sb-splitter-demo" ariaLabel="Persisted">
          <ax-splitter-panel [size]="40">${box('Resize me — reload to see it stick')}</ax-splitter-panel>
          <ax-splitter-panel [size]="60">${box('Content')}</ax-splitter-panel>
        </ax-splitter>
      </div>`,
  }),
};
