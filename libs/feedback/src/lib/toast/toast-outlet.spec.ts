import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxToastOutletComponent } from './toast-outlet.component';
import { ToastService } from './toast.service';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxToastOutletComponent],
  template: `<ax-toast-outlet position="bottom-end" />`,
})
class HostComponent {}

describe('AxToastOutletComponent', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('renders one node per active toast', () => {
    service.show({ title: 'One', duration: 0 });
    service.show({ title: 'Two', duration: 0 });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[role="status"]');
    expect(items.length).toBe(2);
  });

  it('dismiss button removes the toast', () => {
    service.show({ title: 'Closeme', duration: 0 });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(service.toasts().length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('[role="status"]').length).toBe(0);
  });

  it('announces errors assertively (role="alert") and info politely (role="status")', () => {
    service.show({ title: 'Saved', variant: 'success', duration: 0 });
    service.show({ title: 'Failed', variant: 'destructive', duration: 0 });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(status.textContent).toContain('Saved');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(alert.textContent).toContain('Failed');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders inside a persistent notifications region', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-toast-outlet') as HTMLElement;
    expect(host.getAttribute('role')).toBe('region');
    expect(host.getAttribute('aria-label')).toBe('Notifications');
  });

  it('has no a11y violations', async () => {
    service.show({ title: 'Accessible', description: 'desc', duration: 0 });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
