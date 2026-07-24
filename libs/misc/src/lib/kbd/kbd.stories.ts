import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxKbdComponent } from './kbd.component';

const meta: Meta<AxKbdComponent> = {
  title: 'Misc/Kbd',
  component: AxKbdComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxKbdComponent] })],
  argTypes: { keys: { control: 'text' } },
};
export default meta;
type Story = StoryObj<AxKbdComponent>;

/** `mod` resolves to ⌘ on macOS and Ctrl elsewhere. */
export const Default: Story = {
  args: { keys: 'mod+k' },
  render: (args) => ({ props: args, template: `<ax-kbd [keys]="keys" />` }),
};

/** Omit `keys` and project content for a single ad-hoc keycap. */
export const SingleKey: Story = {
  render: () => ({ template: `<ax-kbd>Esc</ax-kbd>` }),
};

export const Combos: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col items-start gap-3 text-sm">
        <div class="flex items-center gap-2"><ax-kbd keys="mod+k" /><span class="text-muted-foreground">Command palette</span></div>
        <div class="flex items-center gap-2"><ax-kbd keys="mod+shift+p" /><span class="text-muted-foreground">Command menu</span></div>
        <div class="flex items-center gap-2"><ax-kbd [keys]="['ctrl','alt','del']" /><span class="text-muted-foreground">Force quit</span></div>
        <div class="flex items-center gap-2"><ax-kbd keys="up" /><ax-kbd keys="down" /><span class="text-muted-foreground">Navigate</span></div>
      </div>
    `,
  }),
};
