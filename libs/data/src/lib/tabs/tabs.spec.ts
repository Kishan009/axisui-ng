import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTabsComponent } from './tabs.component';
import { AxTabsListComponent } from './tabs-list.component';
import { AxTabTriggerComponent } from './tab-trigger.component';
import { AxTabPanelComponent } from './tab-panel.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxTabsComponent, AxTabsListComponent, AxTabTriggerComponent, AxTabPanelComponent],
  template: `
    <ax-tabs [value]="value">
      <ax-tabs-list>
        <ax-tab-trigger value="one">One</ax-tab-trigger>
        <ax-tab-trigger value="two">Two</ax-tab-trigger>
      </ax-tabs-list>
      <ax-tab-panel value="one">Panel one</ax-tab-panel>
      <ax-tab-panel value="two">Panel two</ax-tab-panel>
    </ax-tabs>
  `,
})
class HostComponent {
  value: string | null = 'one';
}

describe('AxTabsComponent', () => {
  it('marks the active trigger with aria-selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('switches panels on trigger click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    tabs[1].click();
    fixture.detectChanges();
    const panels = Array.from(fixture.nativeElement.querySelectorAll('[role="tabpanel"]')) as HTMLElement[];
    expect(panels[0].hasAttribute('hidden')).toBe(true);
    expect(panels[1].hasAttribute('hidden')).toBe(false);
  });

  it('associates each trigger with its panel (aria-controls / aria-labelledby)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const panels = Array.from(fixture.nativeElement.querySelectorAll('[role="tabpanel"]')) as HTMLElement[];
    // trigger[i].aria-controls -> panel[i].id, and panel[i].aria-labelledby -> trigger[i].id
    tabs.forEach((tab, i) => {
      expect(tab.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(tab.id);
      expect(tab.id).toBeTruthy();
      expect(panels[i].id).toBeTruthy();
    });
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
