import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxProgressComponent } from './progress.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxProgressComponent],
  template: `<ax-progress [value]="value" [max]="max" />`,
})
class HostComponent {
  value: number | null = 40;
  max = 100;
}

describe('AxProgressComponent', () => {
  it('sets aria-valuenow when determinate', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('fills to the correct width', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.ax-progress__fill') as HTMLElement;
    expect(fill.style.width).toBe('40%');
  });

  it('omits aria-valuenow when indeterminate', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value = null;
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
