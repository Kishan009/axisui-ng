import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCheckboxComponent } from './checkbox.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCheckboxComponent],
  template: `
    <ax-checkbox [checked]="checked" [indeterminate]="indeterminate" [disabled]="disabled" ariaLabel="Accept">
      Accept
    </ax-checkbox>
  `,
})
class HostComponent {
  checked = false;
  indeterminate = false;
  disabled = false;
}

const input = (f: { nativeElement: HTMLElement }) =>
  f.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;

describe('AxCheckboxComponent', () => {
  it('reports aria-checked true/false for the checked state', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-checked')).toBe('false');
    fixture.componentInstance.checked = true;
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('reports aria-checked="mixed" and the native indeterminate flag when indeterminate', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.indeterminate = true;
    fixture.detectChanges();
    const el = input(fixture);
    expect(el.getAttribute('aria-checked')).toBe('mixed');
    expect(el.indeterminate).toBe(true);
    // The visual box shows the dash (a <line>), not the checkmark polyline.
    expect(fixture.nativeElement.querySelector('span[aria-hidden] line')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('span[aria-hidden] polyline')).toBeNull();
  });

  it('indeterminate takes visual precedence over checked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.checked = true;
    fixture.componentInstance.indeterminate = true;
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-checked')).toBe('mixed');
    expect(fixture.nativeElement.querySelector('span[aria-hidden] line')).toBeTruthy();
  });

  it('renders a square control box (not a pill/circle)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('span[aria-hidden]') as HTMLElement;
    expect(box.className).toContain('rounded-sm');
    expect(box.className.split(/\s+/)).not.toContain('rounded');
    expect(box.className).not.toContain('rounded-full');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
