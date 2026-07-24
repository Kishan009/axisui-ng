import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCollapsibleComponent } from './collapsible.component';
import { AxCollapsibleTriggerDirective } from './collapsible-trigger.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCollapsibleComponent, AxCollapsibleTriggerDirective],
  template: `
    <ax-collapsible>
      <button axCollapsibleTrigger>Toggle</button>
      <p>Hidden content</p>
    </ax-collapsible>
  `,
})
class HostComponent {}

function render() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const f = TestBed.createComponent(HostComponent);
  f.detectChanges();
  return f;
}

describe('AxCollapsible', () => {
  it('is closed by default (content region hidden) with aria wired', () => {
    const el = render().nativeElement;
    const trigger = el.querySelector('[axCollapsibleTrigger]') as HTMLElement;
    const region = el.querySelector('[role="region"]') as HTMLElement;
    expect(region.getAttribute('data-state')).toBe('closed');
    expect(region.hasAttribute('inert')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(region.id);
    expect(region.id).toBeTruthy();
  });
  it('toggles open when the trigger is clicked', () => {
    const fixture = render();
    const el = fixture.nativeElement;
    (el.querySelector('[axCollapsibleTrigger]') as HTMLElement).click();
    fixture.detectChanges();
    const region = el.querySelector('[role="region"]') as HTMLElement;
    expect(region.getAttribute('data-state')).toBe('open');
    expect(region.hasAttribute('inert')).toBe(false);
    expect((el.querySelector('[axCollapsibleTrigger]') as HTMLElement).getAttribute('aria-expanded')).toBe('true');
  });
  it('has no a11y violations', async () => {
    const results = await axe(render().nativeElement);
    expect(results).toHaveNoViolations();
  });
});
