/**
 * Chip — a small token displaying projected content with an optional remove
 * (`×`) button. Shared by `ax-tag-input` and the Combobox chips trigger, and
 * usable on its own.
 *
 * The remove button stops event propagation before emitting `(remove)`, so a
 * chip placed inside a clickable container (e.g. a combobox trigger) never
 * toggles it.
 *
 * @example
 * <ax-chip removable (remove)="drop(tag)">{{ tag }}</ax-chip>
 */
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';

@Component({
  selector: 'ax-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    '[class]': 'classes()',
    '[attr.data-disabled]': "disabled() ? 'true' : null",
  },
  template: `
    <span class="truncate"><ng-content /></span>
    @if (removable()) {
      <!-- Touch target (S3): icon stays ~16px; ::before expands pressable area to ≥44px. -->
      <button
        type="button"
        class="-me-0.5 relative inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 before:absolute before:inset-[-14px] before:content-[''] transition-[background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-foreground/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed"
        [attr.aria-label]="removeAriaLabel()"
        [disabled]="disabled()"
        (click)="onRemove($event)"
      >
        <ax-icon name="x" [size]="12" />
      </button>
    }
  `,
})
export class AxChipComponent {
  /** Show a remove (`×`) button. @default false */
  readonly removable = input(false, { transform: booleanAttribute });

  /** Disable the chip (hides interaction, dims the token). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Accessible label for the remove button. @default 'Remove' */
  readonly removeAriaLabel = input<string>('Remove');

  /** Emitted when the remove button is activated. */
  readonly remove = output<void>();

  protected readonly classes = computed(() =>
    cn(
      'inline-flex max-w-full items-center gap-1 rounded-[var(--radius-sm)] bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground',
      this.disabled() && 'opacity-50'
    )
  );

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled()) this.remove.emit();
  }
}
