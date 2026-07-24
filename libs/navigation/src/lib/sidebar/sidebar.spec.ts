import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSidebarComponent } from './sidebar.component';
import { AxSidebarItemComponent } from './sidebar-item.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSidebarComponent, AxSidebarItemComponent],
  template: `
    <ax-sidebar [(collapsed)]="collapsed">
      <ax-sidebar-item [active]="true">Dashboard</ax-sidebar-item>
      <ax-sidebar-item>Settings</ax-sidebar-item>
    </ax-sidebar>
  `,
})
class HostComponent {
  collapsed = signal(false);
}

describe('AxSidebar', () => {
  it('reflects collapsed state on the aside data attribute', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(aside.getAttribute('data-collapsed')).toBe('false');
    fixture.componentInstance.collapsed.set(true);
    fixture.detectChanges();
    expect(aside.getAttribute('data-collapsed')).toBe('true');
  });

  it('marks the active item with aria-current', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(active?.textContent).toContain('Dashboard');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
