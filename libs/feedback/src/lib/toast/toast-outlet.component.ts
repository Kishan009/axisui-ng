import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { ToastService } from './toast.service';
import type { ToastPosition, ToastVariant } from './toast.types';

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-start': 'top-4 start-4 items-start',
  'top-center': 'top-4 start-1/2 -translate-x-1/2 items-center',
  'top-end': 'top-4 end-4 items-end',
  'bottom-start': 'bottom-4 start-4 items-start',
  'bottom-center': 'bottom-4 start-1/2 -translate-x-1/2 items-center',
  'bottom-end': 'bottom-4 end-4 items-end',
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: 'border-border bg-popover text-popover-foreground',
  success: 'border-success/30 bg-success/10 text-foreground',
  warning: 'border-warning/30 bg-warning/10 text-foreground',
  destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
};

/**
 * ToastOutlet — fixed container that renders active toasts. Place once in the
 * app shell: <ax-toast-outlet position="bottom-end" />.
 */
@Component({
  selector: 'ax-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    '[class]': 'hostClasses()',
    role: 'region',
    'aria-label': 'Notifications',
    '(mouseenter)': 'service.pause()',
    '(mouseleave)': 'service.resume()',
    '(focusin)': 'service.pause()',
    '(focusout)': 'service.resume()',
  },
  template: `
    @for (toast of toasts(); track toast.id) {
      <div
        [attr.role]="roleFor(toast.variant)"
        [attr.aria-live]="ariaLiveFor(toast.variant)"
        aria-atomic="true"
        [class]="toastClasses(toast.variant)"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ toast.title }}</p>
          @if (toast.description) {
            <p class="text-sm text-muted-foreground">{{ toast.description }}</p>
          }
        </div>
        @if (toast.dismissible) {
          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-[var(--radius-sm)] p-1 text-muted-foreground outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/60 hover:text-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Dismiss"
            (click)="dismiss(toast.id)"
          >
            <ax-icon name="x" [size]="16" />
          </button>
        }
      </div>
    }
  `,
})
export class AxToastOutletComponent {
  // Non-private so the host listeners (pause/resume on hover/focus) can reach it.
  protected readonly service = inject(ToastService);

  /** Where toasts stack. @default 'bottom-end' */
  position = input<ToastPosition>('bottom-end');

  protected readonly toasts = this.service.toasts;

  protected readonly hostClasses = computed(() =>
    cn('pointer-events-none fixed z-[100] flex flex-col gap-2', POSITION_CLASSES[this.position()])
  );

  protected toastClasses(variant: ToastVariant): string {
    return cn(
      // Clamp so a toast never overflows narrow viewports (<340px).
      'pointer-events-auto flex w-[min(20rem,calc(100vw-2rem))] items-start gap-3 rounded-[var(--radius-card)] border p-4 shadow-lg',
      '[animation:ax-toast-in_var(--duration)_var(--ease-out-expo)]',
      VARIANT_CLASSES[variant]
    );
  }

  /**
   * Errors/warnings interrupt (`alert` → assertive); default/success wait their
   * turn (`status` → polite). The role + aria-live sit on each persistent toast
   * node inside the always-mounted region so screen readers announce reliably.
   */
  protected roleFor(variant: ToastVariant): 'alert' | 'status' {
    return variant === 'destructive' || variant === 'warning' ? 'alert' : 'status';
  }

  protected ariaLiveFor(variant: ToastVariant): 'assertive' | 'polite' {
    return variant === 'destructive' || variant === 'warning' ? 'assertive' : 'polite';
  }

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
