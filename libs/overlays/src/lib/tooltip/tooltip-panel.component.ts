import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Internal tooltip panel rendered into the overlay. Not exported publicly. */
@Component({
  selector: 'ax-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'tooltip', 'data-ax-overlay': '', '[attr.data-state]': '"open"' },
  template: `
    <div class="rounded-[var(--radius-sm)] bg-foreground px-2 py-1 text-xs text-background shadow-md">
      {{ text() }}
    </div>
  `,
})
export class AxTooltipPanelComponent {
  /** Tooltip text. */
  text = input<string>('');
}
