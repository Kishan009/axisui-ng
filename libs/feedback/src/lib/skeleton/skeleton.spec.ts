import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSkeletonComponent } from './skeleton.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSkeletonComponent],
  template: `<ax-skeleton [variant]="variant" [width]="width" [height]="height" />`,
})
class HostComponent {
  variant: 'text' | 'circle' | 'rect' = 'rect';
  width: string | null = '120px';
  height: string | null = '40px';
}

describe('AxSkeletonComponent', () => {
  it('applies width and height inline styles', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ax-skeleton') as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('40px');
  });

  it('is aria-hidden (decorative)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ax-skeleton') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
