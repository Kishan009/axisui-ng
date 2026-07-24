import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxInputOtpComponent } from './input-otp.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxInputOtpComponent],
  template: `<ax-input-otp [length]="4" [(value)]="value" [invalid]="invalid" (complete)="onComplete($event)" />`,
})
class HostComponent {
  value = '';
  invalid = false;
  completed: string | null = null;
  onComplete(v: string) { this.completed = v; }
}

describe('AxInputOtpComponent', () => {
  it('renders `length` visible cells', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('.ax-otp__cell');
    expect(cells.length).toBe(4);
  });

  it('mirrors typed digits into cells and fires complete', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '1234';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('1234');
    expect(fixture.componentInstance.completed).toBe('1234');
  });

  it('strips non-digits and caps at length', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '12ab99999';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('1299');
  });

  it('shows a focus ring on the active cell only while focused', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const activeCell = () => fixture.nativeElement.querySelectorAll('.ax-otp__cell')[0] as HTMLElement;
    expect(activeCell().className).not.toContain('ring-2');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(activeCell().className).toContain('ring-2');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(activeCell().className).not.toContain('ring-2');
  });

  it('marks the input aria-invalid and cells destructive in the error state', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.invalid = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const cell = fixture.nativeElement.querySelector('.ax-otp__cell') as HTMLElement;
    expect(cell.className).toContain('border-destructive');
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
  imports: [AxInputOtpComponent, ReactiveFormsModule],
  template: `<ax-input-otp [length]="4" [formControl]="ctrl" />`,
})
class ReactiveHostComponent {
  ctrl = new FormControl<string>('', { nonNullable: true });
}

describe('AxInputOtpComponent — ControlValueAccessor', () => {
  it('reflects the FormControl value on the hidden input', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.componentInstance.ctrl.setValue('12');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('12');
  });

  it('propagates typed digits back to the FormControl', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '1234';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe('1234');
  });

  it('disables the hidden input when the FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
