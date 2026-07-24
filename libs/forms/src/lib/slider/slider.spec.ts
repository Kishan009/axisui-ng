import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSliderComponent } from './slider.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSliderComponent],
  template: `<ax-slider [(value)]="value" [min]="0" [max]="100" [ariaLabel]="'Volume'" [format]="format" />`,
})
class HostComponent {
  value = 30;
  format: ((v: number) => string) | null = null;
}

describe('AxSliderComponent', () => {
  it('reflects the value on the range input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe('30');
  });

  it('writes back to the model on input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    input.value = '55';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(55);
  });

  it('announces a formatted value via aria-valuetext when format is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const input = () => fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    fixture.detectChanges();
    // No formatter → no aria-valuetext (falls back to aria-valuenow).
    expect(input().hasAttribute('aria-valuetext')).toBe(false);
    fixture.componentInstance.format = (v) => `${v}%`;
    fixture.detectChanges();
    expect(input().getAttribute('aria-valuetext')).toBe('30%');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [AxSliderComponent, ReactiveFormsModule],
  template: `<ax-slider [formControl]="ctrl" [min]="0" [max]="100" [ariaLabel]="'Volume'" />`,
})
class ReactiveHostComponent {
  ctrl = new FormControl<number>(20, { nonNullable: true });
}

describe('AxSliderComponent — ControlValueAccessor', () => {
  it('writes the FormControl value into the range input', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe('20');
  });

  it('propagates user input back to the FormControl', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe(75);
  });

  it('disables the input when the FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
