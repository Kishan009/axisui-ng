import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxPaginationComponent } from './pagination.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxPaginationComponent],
  template: `<ax-pagination [(page)]="page" [total]="200" [pageSize]="10" (pageChange)="last = $event" />`,
})
class HostComponent {
  page = signal(1);
  last = 0;
}

describe('AxPagination', () => {
  it('marks the current page with aria-current', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.textContent?.trim()).toBe('1');
  });

  it('disables first/prev on page 1', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const prev = fixture.nativeElement.querySelector('[aria-label="Previous page"]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('emits pageChange and updates page when next is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const next = fixture.nativeElement.querySelector('[aria-label="Next page"]') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(2);
    expect(fixture.componentInstance.last).toBe(2);
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
