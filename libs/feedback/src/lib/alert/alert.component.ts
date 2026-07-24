import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { ALERT_ICON } from './alert.types';
import { alertVariants, type AlertVariant } from './alert.variants';

/**
 * Alert — inline contextual message with a variant-driven icon + tinted surface.
 * Override the icon via the [axAlertIcon] slot (set hasCustomIcon to suppress the default).
 *
 * A11y: the ARIA role follows severity — `info`/`success` announce politely
 * (`role="status"`), `warning`/`destructive` announce assertively (`role="alert"`).
 *
 * @example <ax-alert variant="warning" title="Careful" dismissible>…</ax-alert>
 */
@Component({
  selector: 'ax-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { '[attr.role]': 'role()', '[attr.data-variant]': 'variant()' },
  template: `
    <div [class]="classes()">
      <span class="ax-alert__icon mt-0.5 shrink-0">
        <ng-content select="[axAlertIcon]" />
        @if (!hasCustomIcon()) {
          <ax-icon [name]="defaultIcon()" [size]="18" />
        }
      </span>
      <div class="ax-alert__body min-w-0 flex-1">
        @if (title()) {
          <p class="font-medium leading-none mb-1">{{ title() }}</p>
        }
        <div class="text-sm text-foreground/80"><ng-content /></div>
      </div>
      @if (dismissible()) {
        <button
          type="button"
          class="ax-alert__close shrink-0 cursor-pointer rounded-[var(--radius-sm)] p-1 text-muted-foreground outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/60 hover:text-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Dismiss"
          (click)="dismiss.emit()"
        >
          <ax-icon name="x" [size]="16" />
        </button>
      }
    </div>
  `,
})
export class AxAlertComponent {
  /** Visual style + default icon. @default 'info' */
  variant = input<AlertVariant>('info');
  /** Optional bold title line. @default null */
  title = input<string | null>(null);
  /** Show a close button that emits `dismiss`. @default false */
  dismissible = input<boolean>(false);
  /** Set true when projecting a [axAlertIcon]; suppresses the default icon. @default false */
  hasCustomIcon = input<boolean>(false);

  /** Emitted when the dismiss button is clicked. */
  readonly dismiss = output<void>();

  protected readonly classes = computed(() => cn(alertVariants({ variant: this.variant() })));
  protected readonly defaultIcon = computed(() => ALERT_ICON[this.variant()]);

  /**
   * Politeness by severity: warnings/errors interrupt (`alert`); info/success
   * wait their turn (`status`). Avoids assertive announcements for non-urgent messages.
   */
  protected readonly role = computed<'alert' | 'status'>(() =>
    this.variant() === 'warning' || this.variant() === 'destructive' ? 'alert' : 'status',
  );
}
