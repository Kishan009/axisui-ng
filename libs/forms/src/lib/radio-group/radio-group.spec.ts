import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxRadioComponent } from '../radio/radio.component';
import { AxRadioGroupComponent } from './radio-group.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxRadioGroupComponent, AxRadioComponent],
  template: `
    <ax-radio-group [value]="value()" (valueChange)="value.set($event)" [disabled]="disabled()" ariaLabel="Plan">
      <ax-radio value="free">Free</ax-radio>
      <ax-radio value="pro">Pro</ax-radio>
      <ax-radio value="team">Team</ax-radio>
    </ax-radio-group>
  `,
})
class HostComponent {
  value = signal<string | null>(null);
  disabled = signal(false);
}

const radios = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];

describe('AxRadioGroupComponent', () => {
  it('exposes radiogroup semantics with a label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('ax-radio-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Plan');
  });

  it('gives every child the same native name so the browser groups them', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const names = new Set(radios(fixture.nativeElement).map((r) => r.name));
    expect(names.size).toBe(1);
  });

  it('checks the radio matching the group value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set('pro');
    fixture.detectChanges();
    const [free, pro] = radios(fixture.nativeElement);
    expect(free.checked).toBe(false);
    expect(pro.checked).toBe(true);
  });

  it('updates the group value when a radio is selected (two-way)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const [, pro] = radios(fixture.nativeElement);
    pro.checked = true;
    pro.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('pro');
  });

  it('cascades disabled to every child', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(radios(fixture.nativeElement).every((r) => r.disabled)).toBe(true);
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set('free');
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [AxRadioGroupComponent, AxRadioComponent, ReactiveFormsModule],
  template: `
    <ax-radio-group [formControl]="ctrl" ariaLabel="Plan">
      <ax-radio value="a">A</ax-radio>
      <ax-radio value="b">B</ax-radio>
    </ax-radio-group>
  `,
})
class ReactiveHostComponent {
  ctrl = new FormControl<string | null>('a');
}

describe('AxRadioGroupComponent (reactive forms)', () => {
  it('writes the FormControl value into the checked radio', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const [a] = radios(fixture.nativeElement);
    expect(a.checked).toBe(true);
  });

  it('propagates selection back to the FormControl', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const [, b] = radios(fixture.nativeElement);
    b.checked = true;
    b.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe('b');
  });

  it('disables all radios when the FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    expect(radios(fixture.nativeElement).every((r) => r.disabled)).toBe(true);
  });
});
