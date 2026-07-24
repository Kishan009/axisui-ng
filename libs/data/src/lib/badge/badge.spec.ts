import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxBadgeComponent } from './badge.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxBadgeComponent],
  template: `<ax-badge [variant]="variant" [appearance]="appearance">{{ label }}</ax-badge>`,
})
class HostComponent {
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' = 'default';
  appearance: 'solid' | 'soft' = 'solid';
  label = 'New';
}

describe('AxBadgeComponent', () => {
  it('projects content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('New');
  });

  it('applies the success variant class', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant = 'success';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span.ax-badge') as HTMLElement;
    expect(span.className).toContain('bg-success');
  });

  it('swaps the solid fill for a tinted mix when appearance="soft"', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.variant = 'success';
    fixture.componentInstance.appearance = 'soft';
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-badge') as HTMLElement;
    const span = fixture.nativeElement.querySelector('span.ax-badge') as HTMLElement;
    expect(host.getAttribute('data-appearance')).toBe('soft');
    expect(span.className).toContain('--badge-bg-mix');
    expect(span.className).not.toContain('bg-success');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
