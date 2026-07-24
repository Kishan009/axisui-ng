import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTooltipDirective } from './tooltip.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxTooltipDirective],
  template: `<button [axTooltip]="text" [showDelay]="0" [hideDelay]="0">Hover me</button>`,
})
class HostComponent {
  text = 'Save changes';
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxTooltipDirective', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('shows the tooltip text on focus and hides on blur', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('Save changes');
    expect(overlayRoot().querySelector('[role="tooltip"]')).toBeTruthy();

    btn.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(overlayRoot().textContent).not.toContain('Save changes');
  });

  it('does nothing when text is empty', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.text = '';
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    btn.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="tooltip"]')).toBeFalsy();
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
