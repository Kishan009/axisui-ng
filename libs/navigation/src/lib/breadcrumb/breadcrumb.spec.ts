import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxBreadcrumbComponent } from './breadcrumb.component';
import { AxBreadcrumbItemComponent } from './breadcrumb-item.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxBreadcrumbComponent, AxBreadcrumbItemComponent],
  template: `
    <ax-breadcrumb>
      <ax-breadcrumb-item><a href="/">Home</a></ax-breadcrumb-item>
      <ax-breadcrumb-item><a href="/lib">Library</a></ax-breadcrumb-item>
      <ax-breadcrumb-item [current]="true">Components</ax-breadcrumb-item>
    </ax-breadcrumb>
  `,
})
class HostComponent {}

describe('AxBreadcrumb', () => {
  it('renders a nav labelled Breadcrumb with a list', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('[role="navigation"][aria-label="Breadcrumb"]');
    expect(nav).toBeTruthy();
    expect(nav.querySelector('[role="list"]')).toBeTruthy();
  });

  it('renders one separator span per item (CSS hides the first)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('ax-breadcrumb-item');
    const seps = fixture.nativeElement.querySelectorAll('[data-breadcrumb-separator]');
    expect(items.length).toBe(3);
    expect(seps.length).toBe(3);
  });

  it('marks the current item with aria-current="page"', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain('Components');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
