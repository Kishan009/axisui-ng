import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxAlertComponent } from './alert.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxAlertComponent],
  template: `
    <ax-alert [variant]="variant" [title]="title" [dismissible]="dismissible" (dismiss)="onDismiss()">
      Body copy
    </ax-alert>
  `,
})
class HostComponent {
  variant: 'info' | 'success' | 'warning' | 'destructive' = 'info';
  title: string | null = 'Heads up';
  dismissible = false;
  dismissed = 0;
  onDismiss() { this.dismissed++; }
}

describe('AxAlertComponent', () => {
  it('renders title and body, politely (role="status") for info severity', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Heads up');
    expect(el.textContent).toContain('Body copy');
  });

  it('escalates to role="alert" for warning and destructive severities', () => {
    const fixture = TestBed.createComponent(HostComponent);
    for (const variant of ['warning', 'destructive'] as const) {
      fixture.componentInstance.variant = variant;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    }
  });

  it('carries severity without a banned side-stripe border', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // The tinted container carries meaning; no border-s-* accent stripe should appear.
    const surface = fixture.nativeElement.querySelector('[role="status"] > div') as HTMLElement;
    expect(surface.className).toContain('border');
    expect(surface.className).not.toMatch(/border-s-/);
  });

  it('emits dismiss when the close button is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.dismissible = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement;
    btn.click();
    expect(fixture.componentInstance.dismissed).toBe(1);
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.dismissible = true;
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
