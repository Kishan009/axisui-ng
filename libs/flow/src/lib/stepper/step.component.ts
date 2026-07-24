/**
 * Step — one step of a `ax-stepper`. Declares its rail metadata (label,
 * description, icon, state flags) as inputs and projects the **content** shown
 * only while it is the active step. The parent `ax-stepper` reads this metadata
 * to draw the interactive rail; the step itself renders just its content region.
 *
 * @example
 * <ax-step label="Shipping" description="Where to?">
 *   …shipping form…
 * </ax-step>
 */
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { AxIconName } from '@axisui-ng/icons';

import { STEPPER_CONTEXT, type StepState } from './stepper.types';

@Component({
  selector: 'ax-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "'region'",
    '[attr.aria-label]': 'label()',
    '[hidden]': '!active()',
    '[attr.tabindex]': 'active() ? 0 : null',
    '[attr.data-state]': 'state()',
    class: 'block focus-visible:outline-none data-[state=active]:[animation:ax-step-in_var(--duration)_var(--ease-out-quart)]',
  },
  template: '<ng-content />',
})
export class AxStepComponent {
  /** Visible label in the rail. */
  readonly label = input.required<string>();
  /** Secondary line under the label. */
  readonly description = input<string | null>(null);
  /** Custom indicator icon (overrides the number for upcoming/active states). */
  readonly icon = input<AxIconName | null>(null);
  /** Mark this step complete explicitly (independent of position). @default false */
  readonly completed = input<boolean>(false);
  /** Disable navigation to this step. @default false */
  readonly disabled = input<boolean>(false);
  /** Show this step as optional. @default false */
  readonly optional = input<boolean>(false);
  /** Show this step in an error state. @default false */
  readonly error = input<boolean>(false);

  /** 0-based position, assigned by the parent stepper. */
  readonly index = signal<number>(-1);

  private readonly ctx = inject(STEPPER_CONTEXT);

  /** Whether this is the currently-active step. */
  readonly active = computed(() => this.index() === this.ctx.currentStep());

  /** Derived state (precedence: disabled → error → active → completed → upcoming). */
  readonly state = computed<StepState>(() => {
    if (this.disabled()) return 'disabled';
    if (this.error()) return 'error';
    const i = this.index();
    const cur = this.ctx.currentStep();
    if (i === cur) return 'active';
    if (this.completed() || (this.ctx.linear() && i >= 0 && i < cur)) return 'completed';
    return 'upcoming';
  });
}
