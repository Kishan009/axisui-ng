/**
 * NavigationMenu stories.
 *
 * A horizontal nav whose items open mega-menu panels (one open at a time).
 * Phase 2: an animated highlight backdrop (a sliding/resizing pill) sits behind
 * the active trigger — the hovered item, falling back to the open item — and
 * smoothly animates as the active item changes via hover or keyboard.
 *
 * The backdrop is tunable through CSS variables (honoured on the host or an
 * ancestor): `--navigation-menu-animation-duration`,
 * `--navigation-menu-backdrop-color`, `--navigation-menu-animation-easing`.
 * The `CustomAnimation` story sets the first two via an inline `style`.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxNavigationMenuComponent } from './navigation-menu.component';
import { AxNavigationMenuItemComponent } from './navigation-menu-item.component';
import { AxNavigationMenuContentComponent } from './navigation-menu-content.component';

const meta: Meta = {
  title: 'Navigation/Navigation Menu',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AxNavigationMenuComponent,
        AxNavigationMenuItemComponent,
        AxNavigationMenuContentComponent,
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj;

const linkClass =
  'block rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground';

const items = `
  <ax-navigation-menu-item value="products" label="Products">
    <ax-navigation-menu-content>
      <div class="grid w-64 gap-1">
        <a class="${linkClass}" href="#">Analytics</a>
        <a class="${linkClass}" href="#">Automation</a>
        <a class="${linkClass}" href="#">Reports</a>
      </div>
    </ax-navigation-menu-content>
  </ax-navigation-menu-item>
  <ax-navigation-menu-item value="solutions" label="Solutions">
    <ax-navigation-menu-content>
      <div class="grid w-64 gap-1">
        <a class="${linkClass}" href="#">For Startups</a>
        <a class="${linkClass}" href="#">For Enterprise</a>
      </div>
    </ax-navigation-menu-content>
  </ax-navigation-menu-item>
  <ax-navigation-menu-item value="pricing" label="Pricing">
    <ax-navigation-menu-content>
      <div class="grid w-64 gap-1">
        <a class="${linkClass}" href="#">Plans</a>
        <a class="${linkClass}" href="#">Compare</a>
      </div>
    </ax-navigation-menu-content>
  </ax-navigation-menu-item>
`;

/**
 * Hover or Tab across the triggers: the highlight backdrop animates to the
 * active item and its mega-menu panel opens. Click the same trigger to toggle
 * the panel closed.
 */
export const Default: Story = {
  render: () => ({
    template: `<ax-navigation-menu>${items}</ax-navigation-menu>`,
  }),
};

/**
 * Customized backdrop via inline style: a slower 450ms transition and a
 * primary-tinted fill, overriding `--navigation-menu-animation-duration` and
 * `--navigation-menu-backdrop-color`.
 */
export const CustomAnimation: Story = {
  render: () => ({
    template: `
      <ax-navigation-menu
        style="--navigation-menu-animation-duration: 450ms; --navigation-menu-backdrop-color: color-mix(in oklch, var(--color-primary) 18%, transparent);"
      >${items}</ax-navigation-menu>
    `,
  }),
};
