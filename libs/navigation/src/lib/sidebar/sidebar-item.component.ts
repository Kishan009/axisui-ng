import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { AxSidebarComponent } from './sidebar.component';

/**
 * SidebarItem — a nav row. Project an icon then a label; the label hides when
 * the sidebar is collapsed.
 */
@Component({
  selector: 'ax-sidebar-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-current]': 'active() ? "page" : null',
    '[class]': 'classes()',
  },
  template: `<ng-content />`,
})
export class AxSidebarItemComponent {
  /** Active route indicator (aria-current="page"). @default false */
  readonly active = input<boolean>(false);

  private readonly sidebar = inject(AxSidebarComponent);

  protected readonly classes = computed(() =>
    cn(
      'flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm',
      'transition-colors duration-[var(--duration-fast)] ease-out-quart',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      this.active() ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground',
      this.sidebar.collapsed() ? 'justify-center [&>:not(ax-icon):not(svg)]:hidden' : '',
    ),
  );
}
