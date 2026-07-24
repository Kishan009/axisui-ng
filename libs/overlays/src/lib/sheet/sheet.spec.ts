import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSheetComponent } from './sheet.component';
import { AxDialogDescriptionDirective, AxDialogTitleDirective } from '../dialog/dialog-parts';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSheetComponent, AxDialogTitleDirective, AxDialogDescriptionDirective],
  template: `
    <ax-sheet [(open)]="open" [side]="side">
      <h2 axDialogTitle>Filters</h2>
      <p axDialogDescription>Refine the results.</p>
      <p axDialogBody>Sheet body</p>
    </ax-sheet>
  `,
})
class HostComponent {
  open = signal(false);
  side: 'start' | 'end' | 'top' | 'bottom' = 'end';
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxSheetComponent', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('renders a modal sheet with the side data attribute', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('data-side')).toBe('end');
    expect(overlayRoot().textContent).toContain('Sheet body');
  });

  it('closes on Escape', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    (overlayRoot().querySelector('[role="dialog"]') as HTMLElement)
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('labels and describes the sheet from the projected title/description', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    const labelId = panel.getAttribute('aria-labelledby');
    const descId = panel.getAttribute('aria-describedby');
    expect(overlayRoot().querySelector(`#${labelId}`)?.textContent).toContain('Filters');
    expect(overlayRoot().querySelector(`#${descId}`)?.textContent).toContain('Refine the results');
  });

  it('repositions when side changes while open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.side = 'start';
    fixture.detectChanges();
    expect((overlayRoot().querySelector('[role="dialog"]') as HTMLElement).getAttribute('data-side')).toBe('start');

    fixture.componentInstance.side = 'end';
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.getAttribute('data-side')).toBe('end');
    expect(overlayRoot().querySelectorAll('[role="dialog"]').length).toBe(1);
    // Pane sized by OverlayConfig (flush to the end edge).
    const pane = overlayRoot().querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(pane.style.width).toBe('24rem');
  });

  it('has no a11y violations when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
