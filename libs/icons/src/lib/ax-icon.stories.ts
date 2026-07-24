/**
 * Icon stories.
 *
 * `ax-icon` renders a first-party icon from the registry. The Playground
 * exposes the inputs as controls; Gallery shows the full first-party set.
 *
 * Icons use `currentColor`, so they inherit the surrounding text color —
 * see the `Colors` story. The theme switcher toolbar previews every story
 * against all presets in light and dark mode.
 */

import type { Meta, StoryObj } from '@storybook/angular';

import { ICON_REGISTRY, type AxIconName } from './registry';
import { AxIconComponent } from './ax-icon.component';

const ICON_NAMES = Object.keys(ICON_REGISTRY) as AxIconName[];

const meta: Meta<AxIconComponent> = {
  title: 'Icons/Icon',
  component: AxIconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: { type: 'number', min: 12, max: 64, step: 2 } },
    strokeWidth: { control: { type: 'number', min: 1, max: 3, step: 0.5 } },
  },
};
export default meta;

type Story = StoryObj<AxIconComponent>;

/** Interactive playground — pick any icon and tweak size/stroke via controls. */
export const Playground: Story = {
  args: { name: 'check', size: 24, strokeWidth: 2 },
  render: (args) => ({
    moduleMetadata: { imports: [AxIconComponent] },
    template: `<ax-icon name="${args.name}" [size]="${args.size}" [strokeWidth]="${args.strokeWidth}" />`,
  }),
};

/** The same icon across a range of sizes. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxIconComponent] },
    template: `
      <div class="flex items-end gap-4">
        <ax-icon name="settings" [size]="16" />
        <ax-icon name="settings" [size]="24" />
        <ax-icon name="settings" [size]="32" />
        <ax-icon name="settings" [size]="48" />
      </div>
    `,
  }),
};

/** Stroke width from hairline to bold. */
export const StrokeWidths: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxIconComponent] },
    template: `
      <div class="flex items-center gap-4">
        <ax-icon name="check-circle" [size]="32" [strokeWidth]="1" />
        <ax-icon name="check-circle" [size]="32" [strokeWidth]="1.5" />
        <ax-icon name="check-circle" [size]="32" [strokeWidth]="2" />
        <ax-icon name="check-circle" [size]="32" [strokeWidth]="2.5" />
      </div>
    `,
  }),
};

/** Icons inherit `currentColor` from their parent text color. */
export const Colors: Story = {
  render: () => ({
    moduleMetadata: { imports: [AxIconComponent] },
    template: `
      <div class="flex items-center gap-4">
        <span class="text-foreground"><ax-icon name="info" [size]="28" /></span>
        <span class="text-primary"><ax-icon name="check-circle" [size]="28" /></span>
        <span class="text-success"><ax-icon name="check" [size]="28" /></span>
        <span class="text-warning"><ax-icon name="alert-triangle" [size]="28" /></span>
        <span class="text-destructive"><ax-icon name="x-circle" [size]="28" /></span>
        <span class="text-muted-foreground"><ax-icon name="help-circle" [size]="28" /></span>
      </div>
    `,
  }),
};

/** Every first-party icon in the registry, labelled with its name. */
export const Gallery: Story = {
  name: 'Gallery (all icons)',
  render: () => ({
    moduleMetadata: { imports: [AxIconComponent] },
    template: `
      <div class="grid grid-cols-6 gap-2">
        ${ICON_NAMES.map(
          (n) => `
        <div class="flex flex-col items-center gap-2 rounded-md border border-border p-3 text-center">
          <ax-icon name="${n}" [size]="24" />
          <span class="text-xs text-muted-foreground">${n}</span>
        </div>`,
        ).join('')}
      </div>
    `,
  }),
};
