/**
 * AxStepperComponent + AxStepComponent — unit + a11y tests. a11y is asserted in
 * three modes (LTR / RTL / dark) by toggling the rendered host element (not the
 * global document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxStepComponent } from './step.component';
import { AxStepperComponent } from './stepper.component';
import type { StepperGuard, StepperOrientation } from './stepper.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxStepperComponent, AxStepComponent],
  template: `
    <ax-stepper
      [currentStep]="current()"
      (currentStepChange)="current.set($event)"
      [orientation]="orientation()"
      [linear]="linear()"
      [guard]="guard()"
    >
      <ax-step label="One">Content one</ax-step>
      <ax-step label="Two">Content two</ax-step>
      <ax-step label="Three" [disabled]="thirdDisabled()">Content three</ax-step>
    </ax-stepper>
  `,
})
class HostComponent {
  current = signal(0);
  orientation = signal<StepperOrientation>('horizontal');
  linear = signal(true);
  guard = signal<StepperGuard | null>(null);
  thirdDisabled = signal(false);
}

interface Harness {
  fixture: ComponentFixture<HostComponent>;
  host: HostComponent;
  el: HTMLElement;
  stepper: AxStepperComponent;
}

function setup(configure?: (h: HostComponent) => void): Harness {
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  const stepper = fixture.debugElement.query(By.directive(AxStepperComponent))
    .componentInstance as AxStepperComponent;
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement, stepper };
}

const railButtons = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLButtonElement>('button[data-step-index]'));
const stepEls = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('ax-step'));
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('AxStepper', () => {
  it('renders one rail button per step and assigns indices', () => {
    const { el, stepper } = setup();
    expect(railButtons(el).length).toBe(3);
    expect(stepper.steps().map((s) => s.index())).toEqual([0, 1, 2]);
  });

  it('shows only the active step content', () => {
    const { el } = setup();
    const steps = stepEls(el);
    expect(steps[0].hidden).toBe(false);
    expect(steps[1].hidden).toBe(true);
    expect(steps[2].hidden).toBe(true);
  });

  it('marks the active step with aria-current="step"', () => {
    const { el } = setup();
    const [b0, b1] = railButtons(el);
    expect(b0.getAttribute('aria-current')).toBe('step');
    expect(b1.getAttribute('aria-current')).toBeNull();
  });

  it('advances when the next indicator is clicked', () => {
    const { fixture, el, stepper } = setup();
    railButtons(el)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(stepper.currentStep()).toBe(1);
    expect(stepEls(el)[1].hidden).toBe(false);
  });

  it('completed steps render a check indicator', () => {
    const { fixture, el, stepper } = setup();
    stepper.next();
    fixture.detectChanges();
    const firstBtn = railButtons(el)[0];
    expect(firstBtn.querySelector('[data-ax-icon="check"]')).toBeTruthy();
  });

  describe('linear gating', () => {
    it('blocks skipping ahead past the frontier', () => {
      const { fixture, stepper } = setup();
      stepper.goTo(2); // from 0, 2 > maxReached(0)+1 → blocked
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(0);
    });

    it('allows one-at-a-time advance and free back-nav to reached steps', () => {
      const { fixture, stepper } = setup();
      stepper.next();
      stepper.next();
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(2);
      stepper.goTo(0);
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(0);
      stepper.goTo(2); // already reached → allowed
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(2);
    });

    it('non-linear allows jumping to any enabled step', () => {
      const { fixture, stepper } = setup((h) => h.linear.set(false));
      stepper.goTo(2);
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(2);
    });
  });

  it('clamps next()/previous() at the bounds', () => {
    const { fixture, stepper } = setup((h) => h.linear.set(false));
    stepper.previous();
    fixture.detectChanges();
    expect(stepper.currentStep()).toBe(0);
    stepper.goTo(2);
    stepper.next();
    fixture.detectChanges();
    expect(stepper.currentStep()).toBe(2);
  });

  it('never navigates to a disabled step', () => {
    const { fixture, stepper } = setup((h) => {
      h.linear.set(false);
      h.thirdDisabled.set(true);
    });
    stepper.goTo(2);
    fixture.detectChanges();
    expect(stepper.currentStep()).toBe(0);
  });

  describe('guard', () => {
    it('cancels the transition when the guard returns false', () => {
      const { fixture, stepper } = setup((h) => h.guard.set(() => false));
      stepper.next();
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(0);
    });

    it('passes from/to/direction to the guard', () => {
      const calls: unknown[] = [];
      const { fixture, stepper } = setup((h) =>
        h.guard.set((change) => {
          calls.push(change);
          return true;
        })
      );
      stepper.next();
      fixture.detectChanges();
      expect(calls).toEqual([{ from: 0, to: 1, direction: 'next' }]);
      expect(stepper.currentStep()).toBe(1);
    });

    it('enters pending during an async guard, then commits on resolve(true)', async () => {
      const { fixture, stepper } = setup((h) => h.guard.set(() => Promise.resolve(true)));
      stepper.next();
      expect(stepper.pending()).toBe(true);
      expect(stepper.currentStep()).toBe(0);
      await flush();
      fixture.detectChanges();
      expect(stepper.pending()).toBe(false);
      expect(stepper.currentStep()).toBe(1);
    });

    it('ignores further requests while an async guard is pending', async () => {
      const { fixture, stepper } = setup((h) => h.guard.set(() => Promise.resolve(false)));
      stepper.next();
      stepper.next(); // ignored — still pending
      await flush();
      fixture.detectChanges();
      expect(stepper.currentStep()).toBe(0);
    });
  });

  describe('keyboard (roving)', () => {
    it('moves roving focus with arrow keys, skipping disabled', () => {
      const { fixture, el } = setup((h) => {
        h.linear.set(false);
        h.thirdDisabled.set(true);
      });
      const ol = el.querySelector('ol') as HTMLElement;
      ol.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      const buttons = railButtons(el);
      expect(buttons[1].getAttribute('tabindex')).toBe('0');
      expect(buttons[0].getAttribute('tabindex')).toBe('-1');
      // ArrowRight again should skip the disabled 3rd step and stay put.
      ol.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(railButtons(el)[1].getAttribute('tabindex')).toBe('0');
    });

    it('Home/End move focus to the ends', () => {
      const { fixture, el } = setup((h) => h.linear.set(false));
      const ol = el.querySelector('ol') as HTMLElement;
      ol.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();
      expect(railButtons(el)[2].getAttribute('tabindex')).toBe('0');
      ol.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();
      expect(railButtons(el)[0].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().el)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const { el } = setup((h) => h.orientation.set('vertical'));
      const stepperEl = el.querySelector('ax-stepper') as HTMLElement;
      stepperEl.setAttribute('dir', 'rtl');
      expect(await axe(el)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const { el } = setup();
      (el.querySelector('ax-stepper') as HTMLElement).classList.add('dark');
      expect(await axe(el)).toHaveNoViolations();
    });
  });
});
