import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSwitchComponent } from './switch.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSwitchComponent],
  template: `<ax-switch [checked]="checked" [disabled]="disabled" ariaLabel="Wifi">Wifi</ax-switch>`,
})
class HostComponent {
  checked = false;
  disabled = false;
}

const input = (f: { nativeElement: HTMLElement }) =>
  f.nativeElement.querySelector('input[role="switch"]') as HTMLInputElement;

describe('AxSwitchComponent', () => {
  it('exposes its on/off state via aria-checked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-checked')).toBe('false');
    fixture.componentInstance.checked = true;
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('toggles checked on user change', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = input(fixture);
    el.checked = true;
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('reflects the disabled state', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(input(fixture).disabled).toBe(true);
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
