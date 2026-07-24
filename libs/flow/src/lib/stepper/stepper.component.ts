/**
 * Stepper — a multi-step / wizard control. Renders an ordered, interactive rail
 * of step indicators (drawn from its projected `ax-step` children's metadata)
 * plus the active step's content. Supports horizontal/vertical orientation,
 * linear gating, and an optional (possibly async) transition guard.
 *
 * Every transition funnels through `request()`, so linear rules + the guard are
 * enforced on a single path whether triggered by `next()/previous()/goTo()`, an
 * indicator click, or the keyboard.
 *
 * A11y: ordered-list rail with `aria-current="step"` (not a tablist); roving
 * arrow-key focus among enabled step buttons; the active step's content is a
 * labelled `region`.
 *
 * @example
 * <ax-stepper [(currentStep)]="step" [guard]="validateStep">
 *   <ax-step label="Account">…</ax-step>
 *   <ax-step label="Profile">…</ax-step>
 *   <ax-step label="Review">…</ax-step>
 * </ax-stepper>
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import { AxStepComponent } from './step.component';
import {
  STEPPER_CONTEXT,
  type StepDirection,
  type StepperContext,
  type StepperGuard,
  type StepperOrientation,
} from './stepper.types';

@Component({
  selector: 'ax-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  providers: [{ provide: STEPPER_CONTEXT, useExisting: forwardRef(() => AxStepperComponent) }],
  host: {
    '[class]': 'classes()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-busy]': "pending() ? 'true' : null",
  },
  template: `
    <ol role="list" [class]="railClasses()" (keydown)="onKeydown($event)">
      @for (step of steps(); track step; let i = $index) {
        <li [class]="itemClasses(i)">
          <button
            type="button"
            [class]="buttonClasses()"
            [attr.data-step-index]="i"
            [attr.aria-current]="i === currentStep() ? 'step' : null"
            [attr.aria-label]="stepAriaLabel(step)"
            [attr.tabindex]="i === focusIndex() ? 0 : -1"
            [disabled]="step.disabled()"
            (click)="onIndicatorClick(i)"
          >
            <span [class]="indicatorClasses(step)">
              @if (isPending(i)) {
                <ax-icon name="loader" class="animate-spin" [size]="16" />
              } @else if (step.state() === 'completed') {
                <ax-icon name="check" [size]="16" />
              } @else if (step.state() === 'error') {
                <ax-icon name="alert-circle" [size]="16" />
              } @else if (step.icon()) {
                <ax-icon [name]="step.icon()!" [size]="16" />
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span class="flex min-w-0 flex-col items-start text-start">
              <span [class]="labelClasses(step)">{{ step.label() }}</span>
              @if (step.description()) {
                <span class="text-xs text-muted-foreground">{{ step.description() }}</span>
              } @else if (step.optional()) {
                <span class="text-xs italic text-muted-foreground">Optional</span>
              }
            </span>
          </button>
          @if (!isLast(i)) {
            <span aria-hidden="true" [class]="connectorClasses(step)"></span>
          }
        </li>
      }
    </ol>
    <div class="min-w-0 flex-1"><ng-content /></div>
  `,
})
export class AxStepperComponent implements StepperContext {
  /** Active step index (two-way, 0-based). @default 0 */
  readonly currentStep = model<number>(0);

  /** Rail orientation. @default 'horizontal' */
  readonly orientation = input<StepperOrientation>('horizontal');

  /** Enforce linear gating (no skipping ahead past the frontier). @default true */
  readonly linear = input<boolean>(true);

  /** Optional transition guard; return/resolve `false` to cancel. @default null */
  readonly guard = input<StepperGuard | null>(null);

  private readonly stepList = contentChildren(AxStepComponent);
  /** Projected steps, exposed to the template. */
  readonly steps = this.stepList;
  readonly count = computed(() => this.stepList().length);

  /** True while an async guard is settling. */
  readonly pending = signal<boolean>(false);
  private readonly pendingTo = signal<number | null>(null);

  /** Roving-focus index within the rail. */
  protected readonly focusIndex = signal<number>(0);

  /** Furthest step reached — governs linear forward navigation. */
  private readonly maxReached = signal<number>(0);

  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Assign each step its 0-based index.
    effect(() => {
      this.stepList().forEach((s, i) => s.index.set(i));
    });
    // Clamp currentStep within bounds and track the frontier + roving focus.
    effect(() => {
      const n = this.count();
      if (n === 0) return;
      const cur = this.currentStep();
      const clamped = Math.min(n - 1, Math.max(0, cur));
      if (clamped !== cur) {
        this.currentStep.set(clamped);
        return;
      }
      if (cur > this.maxReached()) this.maxReached.set(cur);
      this.focusIndex.set(cur);
    });
  }

  // --- StepperContext / public API ---------------------------------------

  next(): void {
    this.request(this.currentStep() + 1, 'next');
  }

  previous(): void {
    this.request(this.currentStep() - 1, 'previous');
  }

  goTo(index: number): void {
    this.request(index, this.directionTo(index));
  }

  /** Single guarded transition path. */
  request(to: number, direction: StepDirection): void {
    if (this.pending()) return;
    const from = this.currentStep();
    if (to === from || to < 0 || to >= this.count()) return;
    const target = this.stepList()[to];
    if (!target || target.disabled()) return;
    // Linear: cannot jump beyond one past the furthest reached step.
    if (this.linear() && to > from && to > this.maxReached() + 1) return;

    const guard = this.guard();
    if (!guard) {
      this.commit(to);
      return;
    }
    const result = guard({ from, to, direction });
    if (typeof result === 'boolean') {
      if (result) this.commit(to);
      return;
    }
    this.pending.set(true);
    this.pendingTo.set(to);
    void Promise.resolve(result)
      .then((ok) => {
        if (ok) this.commit(to);
      })
      .finally(() => {
        this.pending.set(false);
        this.pendingTo.set(null);
      });
  }

  private commit(to: number): void {
    if (to > this.maxReached()) this.maxReached.set(to);
    this.currentStep.set(to);
  }

  private directionTo(index: number): StepDirection {
    const cur = this.currentStep();
    return index > cur ? 'next' : index < cur ? 'previous' : 'jump';
  }

  // --- Interaction -------------------------------------------------------

  protected onIndicatorClick(index: number): void {
    this.request(index, this.directionTo(index));
  }

  protected onKeydown(event: KeyboardEvent): void {
    const horizontal = this.orientation() === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';

    let target: number;
    switch (event.key) {
      case nextKey:
        target = this.nextEnabled(this.focusIndex(), 1);
        break;
      case prevKey:
        target = this.nextEnabled(this.focusIndex(), -1);
        break;
      case 'Home':
        target = this.nextEnabled(-1, 1);
        break;
      case 'End':
        target = this.nextEnabled(this.count(), -1);
        break;
      default:
        return; // Enter/Space activate via the native button click.
    }
    if (target < 0) return;
    event.preventDefault();
    this.focusIndex.set(target);
    const btn = this.host.nativeElement.querySelector(`[data-step-index="${target}"]`);
    (btn as HTMLElement | null)?.focus();
  }

  /** Next non-disabled index from `from` in `dir`, without wrapping. */
  private nextEnabled(from: number, dir: 1 | -1): number {
    const list = this.stepList();
    for (let i = from + dir; i >= 0 && i < list.length; i += dir) {
      const s = list[i];
      if (s && !s.disabled()) return i;
    }
    return -1;
  }

  protected isLast(i: number): boolean {
    return i === this.count() - 1;
  }

  protected isPending(i: number): boolean {
    return this.pending() && this.pendingTo() === i;
  }

  protected stepAriaLabel(step: AxStepComponent): string {
    const parts: string[] = [step.label()];
    if (step.optional()) parts.push('optional');
    switch (step.state()) {
      case 'completed':
        parts.push('completed');
        break;
      case 'active':
        parts.push('current step');
        break;
      case 'error':
        parts.push('error');
        break;
      case 'disabled':
        parts.push('disabled');
        break;
    }
    return parts.join(', ');
  }

  // --- Classes -----------------------------------------------------------

  protected readonly classes = computed(() =>
    cn(
      'flex gap-6 text-foreground',
      this.orientation() === 'horizontal' ? 'flex-col' : 'flex-row items-start'
    )
  );

  protected readonly railClasses = computed(() =>
    cn(this.orientation() === 'horizontal' ? 'flex w-full items-center' : 'flex flex-col')
  );

  protected itemClasses(i: number): string {
    if (this.orientation() === 'horizontal') {
      return cn('flex items-center', !this.isLast(i) && 'flex-1');
    }
    return 'flex flex-col';
  }

  protected readonly buttonClasses = computed(() =>
    cn(
      'group inline-flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] p-1',
      'transition-colors duration-[var(--duration-fast)] ease-out-quart',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed enabled:cursor-pointer'
    )
  );

  protected indicatorClasses(step: AxStepComponent): string {
    const base =
      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-[var(--duration)] ease-out-quart';
    switch (step.state()) {
      case 'active':
      case 'completed':
        return cn(base, 'border-primary bg-primary text-primary-foreground');
      case 'error':
        return cn(base, 'border-destructive bg-destructive text-destructive-foreground');
      case 'disabled':
        return cn(base, 'border-input bg-muted text-muted-foreground opacity-50');
      default:
        return cn(base, 'border-input bg-background text-muted-foreground');
    }
  }

  protected labelClasses(step: AxStepComponent): string {
    const base = 'truncate text-sm font-medium';
    switch (step.state()) {
      case 'active':
      case 'completed':
        return cn(base, 'text-foreground');
      case 'error':
        return cn(base, 'text-destructive');
      default:
        return cn(base, 'text-muted-foreground');
    }
  }

  protected connectorClasses(step: AxStepComponent): string {
    const reached = step.state() === 'completed';
    const tint = reached ? 'bg-primary' : 'bg-border';
    // Smoothly "fill" the connector as a step completes.
    const motion = 'transition-colors duration-[var(--duration)] ease-out-quart';
    return this.orientation() === 'horizontal'
      ? cn('mx-2 h-px flex-1', motion, tint)
      : cn('my-1 ms-4 h-6 w-px', motion, tint);
  }
}
