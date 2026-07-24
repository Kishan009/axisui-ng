import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDialogComponent } from './dialog.component';
import { AxDialogDescriptionDirective, AxDialogTitleDirective } from './dialog-parts';
import { AxOverlayCloseDirective } from '@axisui-ng/overlays-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxDialogComponent, AxOverlayCloseDirective, AxDialogTitleDirective, AxDialogDescriptionDirective],
  template: `
    <ax-dialog [(open)]="open">
      <h2 axDialogTitle>Confirm</h2>
      <p axDialogDescription>This action can't be undone.</p>
      <p axDialogBody>Are you sure?</p>
      <div axDialogFooter><button axOverlayClose>Cancel</button></div>
    </ax-dialog>
  `,
})
class HostComponent {
  open = signal(false);
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxDialogComponent', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('renders the dialog content when open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(overlayRoot().textContent).toContain('Are you sure?');
  });

  it('closes when Escape is pressed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes via axOverlayClose', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    (overlayRoot().querySelector('[axOverlayClose]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('labels and describes the dialog from the projected title/description', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const panel = overlayRoot().querySelector('[role="dialog"]') as HTMLElement;
    const labelId = panel.getAttribute('aria-labelledby');
    const descId = panel.getAttribute('aria-describedby');
    expect(labelId).toBeTruthy();
    expect(descId).toBeTruthy();
    expect(overlayRoot().querySelector(`#${labelId}`)?.textContent).toContain('Confirm');
    expect(overlayRoot().querySelector(`#${descId}`)?.textContent).toContain("can't be undone");
  });

  it('has no a11y violations when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
