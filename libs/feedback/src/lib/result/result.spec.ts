import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxResultComponent, type ResultStatus } from './result.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxResultComponent],
  template: `<ax-result [status]="status()" title="Done" description="It worked." />`,
})
class HostComponent {
  status = signal<ResultStatus>('success');
}

function render(configure?: (h: HostComponent) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const f = TestBed.createComponent(HostComponent);
  if (configure) configure(f.componentInstance);
  f.detectChanges();
  return f;
}

describe('AxResult', () => {
  it('maps success → check-circle + success color', () => {
    const el = render((h) => h.status.set('success')).nativeElement;
    expect(el.querySelector('[data-ax-icon="check-circle"]')).toBeTruthy();
    expect(el.querySelector('.text-success')).toBeTruthy();
  });
  it('maps error → x-circle + destructive color', () => {
    const el = render((h) => h.status.set('error')).nativeElement;
    expect(el.querySelector('[data-ax-icon="x-circle"]')).toBeTruthy();
    expect(el.querySelector('.text-destructive')).toBeTruthy();
  });
  it('has role="status"', () => {
    expect(render().nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });
  it('has no a11y violations', async () => {
    const results = await axe(render().nativeElement);
    expect(results).toHaveNoViolations();
  });
});
