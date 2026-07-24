import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxEmptyComponent } from './empty.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxEmptyComponent],
  template: `<ax-empty icon="search" title="No results" description="Try a different search.">
    <button>Clear</button>
  </ax-empty>`,
})
class HostComponent {}

describe('AxEmpty', () => {
  function render() {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    return f;
  }
  it('renders the icon, title and description', () => {
    const el = render().nativeElement;
    expect(el.querySelector('[data-ax-icon="search"]')).toBeTruthy();
    expect(el.textContent).toContain('No results');
    expect(el.textContent).toContain('Try a different search.');
  });
  it('projects action content', () => {
    expect(render().nativeElement.querySelector('button')?.textContent).toContain('Clear');
  });
  it('has no a11y violations', async () => {
    const results = await axe(render().nativeElement);
    expect(results).toHaveNoViolations();
  });
});
