import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxPopoverComponent } from './popover.component';
import { AxPopoverTriggerDirective } from './popover-trigger.directive';
import { AxOverlayCloseDirective } from '@axisui-ng/overlays-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxPopoverComponent, AxPopoverTriggerDirective, AxOverlayCloseDirective],
  template: `
    <button [axPopoverTriggerFor]="p">Open</button>
    <ax-popover #p>
      <p>Popover body</p>
      <button axOverlayClose>Close</button>
    </ax-popover>
  `,
})
class HostComponent {}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxPopoverComponent', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('opens on trigger click and projects content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('Popover body');
  });

  it('closes via axOverlayClose', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const close = overlayRoot().querySelector('[axOverlayClose]') as HTMLElement;
    close.click();
    fixture.detectChanges();
    expect(overlayRoot().textContent).not.toContain('Popover body');
  });

  it('returns focus to the trigger when closed from inside (WCAG 2.4.3)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const close = overlayRoot().querySelector('[axOverlayClose]') as HTMLElement;
    close.focus(); // focus is now inside the overlay (keyboard user)
    close.click(); // triggers detach → returnFocusToTrigger
    fixture.detectChanges();
    expect(trigger.ownerDocument.activeElement).toBe(trigger);
  });

  it('has no a11y violations when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
