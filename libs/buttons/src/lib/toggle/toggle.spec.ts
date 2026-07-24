/**
 * Unit + a11y tests for the Toggle component.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxToggleComponent } from './toggle.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxToggleComponent],
  template: `<ax-toggle [pressed]="pressed" [disabled]="disabled" ariaLabel="Mute">Mute</ax-toggle>`,
})
class TestHostComponent {
  pressed = false;
  disabled = false;
}

describe('AxToggleComponent', () => {
  it('renders a button with role-based semantics', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
  });

  it('reflects pressed state in aria-pressed', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.pressed = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles pressed state on click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('has no a11y violations when labelled', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
