import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxHoverCardComponent } from './hover-card.component';
import { AxHoverCardTriggerDirective } from './hover-card-trigger.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxHoverCardComponent, AxHoverCardTriggerDirective],
  template: `
    <a [axHoverCardFor]="h" [openDelay]="0" [closeDelay]="0">@username</a>
    <ax-hover-card #h><p>Profile preview</p></ax-hover-card>
  `,
})
class HostComponent {}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxHoverCardComponent', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('opens on pointer enter and closes on leave', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('a') as HTMLElement;

    trigger.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('Profile preview');

    trigger.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(overlayRoot().textContent).not.toContain('Profile preview');
  });

  it('has no a11y violations when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('a') as HTMLElement).dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
