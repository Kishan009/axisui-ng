import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { cn } from '../_utils/cn';

/**
 * Sidebar — collapsible nav rail. Slots: [axSidebarHeader], default body, [axSidebarFooter].
 *
 * @example <ax-sidebar [(collapsed)]="collapsed">…</ax-sidebar>
 */
@Component({
  selector: 'ax-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <aside [attr.data-collapsed]="collapsed()" [attr.data-side]="side()" [class]="asideClasses()">
      <div class="px-3 py-2 [&:empty]:hidden"><ng-content select="[axSidebarHeader]" /></div>
      <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2"><ng-content /></nav>
      <div class="px-3 py-2 [&:empty]:hidden"><ng-content select="[axSidebarFooter]" /></div>
    </aside>
  `,
})
export class AxSidebarComponent {
  /** Collapsed (icon-rail) state (two-way). @default false */
  readonly collapsed = model<boolean>(false);
  /** Which edge the sidebar sits on. @default 'start' */
  readonly side = input<'start' | 'end'>('start');

  protected readonly asideClasses = computed(() =>
    cn(
      'flex h-full flex-col border-border bg-background transition-[width] duration-[var(--motion-duration)] ease-out-expo',
      this.side() === 'end' ? 'border-s' : 'border-e',
      this.collapsed() ? 'w-16' : 'w-64',
    ),
  );
}
