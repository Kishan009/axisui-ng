import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { TABS_CONTEXT } from './tabs.types';

/**
 * TabTrigger — a single tab button. Clicking activates its value.
 */
@Component({
  selector: 'ax-tab-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      type="button"
      role="tab"
      [id]="ctx.tabId(value())"
      [attr.aria-controls]="ctx.panelId(value())"
      [class]="classes()"
      [attr.aria-selected]="active()"
      [attr.tabindex]="active() ? 0 : -1"
      [disabled]="disabled()"
      (click)="onSelect()"
    >
      <ng-content />
    </button>
  `,
})
export class AxTabTriggerComponent {
  // Non-private so the template can build the shared trigger/panel ids.
  protected readonly ctx = inject(TABS_CONTEXT);

  /** The value this trigger activates. */
  readonly value = input.required<string>();
  /** Disable this trigger. @default false */
  readonly disabled = input<boolean>(false);

  readonly active = computed(() => this.ctx.value() === this.value());

  protected readonly classes = computed(() =>
    cn(
      'relative z-10 inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium',
      'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      this.active() ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    )
  );

  protected onSelect(): void {
    if (!this.disabled()) this.ctx.select(this.value());
  }
}
