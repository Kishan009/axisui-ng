/**
 * AxSplitter family — unit + a11y tests. jsdom has no layout (clientWidth = 0)
 * and no real PointerEvent, so the drag test stubs the container width and the
 * element's pointer-capture methods. a11y is asserted in 3 modes (LTR/RTL/dark).
 * Runs twice (zoneless + Zone.js) per the jest config.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSplitterComponent } from './splitter.component';
import { AxSplitterPanelComponent } from './splitter-panel.component';
import { AxSplitterHandleComponent } from './splitter-handle.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSplitterComponent, AxSplitterPanelComponent, AxSplitterHandleComponent],
  template: `
    <ax-splitter
      [orientation]="orientation()"
      [autoGutters]="autoGutters()"
      [storeKey]="storeKey()"
      ariaLabel="Editor layout"
    >
      <ax-splitter-panel [size]="50" [minSize]="10" [collapsible]="true">A</ax-splitter-panel>
      @if (!autoGutters()) {
        <ax-splitter-handle />
      }
      <ax-splitter-panel [size]="50" [minSize]="10">B</ax-splitter-panel>
    </ax-splitter>
  `,
})
class HostComponent {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly autoGutters = signal(true);
  readonly storeKey = signal('');
}

function build(setup: (h: HostComponent) => void = () => {}): {
  fixture: ComponentFixture<HostComponent>;
  splitter: AxSplitterComponent;
  root: HTMLElement;
  handle: HTMLElement;
} {
  const fixture = TestBed.createComponent(HostComponent);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('ax-splitter') as HTMLElement;
  const splitter = fixture.debugElement.children[0].componentInstance as AxSplitterComponent;
  const handle = fixture.nativeElement.querySelector('ax-splitter-handle') as HTMLElement;
  return { fixture, splitter, root, handle };
}

function ptr(type: string, clientX: number): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, clientX });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e as unknown as PointerEvent;
}

describe('AxSplitter', () => {
  it('renders one auto gutter between two panels (none after the last)', () => {
    const { fixture } = build();
    expect(fixture.nativeElement.querySelectorAll('ax-splitter-handle').length).toBe(1);
  });

  it('applies flex-grow equal to each panel size', () => {
    const { fixture } = build();
    const panels = fixture.nativeElement.querySelectorAll('ax-splitter-panel') as NodeListOf<HTMLElement>;
    expect(panels[0].style.flexGrow).toBe('50');
    expect(panels[1].style.flexGrow).toBe('50');
  });

  it('the separator exposes aria-orientation + value range', () => {
    const { handle } = build();
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical'); // horizontal splitter → vertical separator
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(handle.getAttribute('aria-valuemin')).toBe('10');
  });

  it('keyboard ArrowRight nudges the boundary by step%', () => {
    const { fixture, splitter, handle } = build();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([60, 40]);
  });

  it('Home drives the boundary to the left panel min', () => {
    const { fixture, splitter, handle } = build();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([10, 90]);
  });

  it('pointer drag resizes proportionally to the container width', () => {
    const { fixture, splitter, root, handle } = build();
    Object.defineProperty(root, 'clientWidth', { value: 200, configurable: true });
    handle.setPointerCapture = jest.fn();
    handle.releasePointerCapture = jest.fn();
    handle.hasPointerCapture = jest.fn(() => true);

    handle.dispatchEvent(ptr('pointerdown', 100));
    handle.dispatchEvent(ptr('pointermove', 150)); // +50px of 200 = +25%
    handle.dispatchEvent(ptr('pointerup', 150));
    fixture.detectChanges();

    expect(splitter.sizes()).toEqual([75, 25]);
    expect(handle.setPointerCapture).toHaveBeenCalled();
  });

  it('dragging the collapsible panel below its min snaps it closed on release', () => {
    const { fixture, splitter, root, handle } = build();
    Object.defineProperty(root, 'clientWidth', { value: 200, configurable: true });
    handle.setPointerCapture = jest.fn();
    handle.releasePointerCapture = jest.fn();
    handle.hasPointerCapture = jest.fn(() => true);

    handle.dispatchEvent(ptr('pointerdown', 100));
    handle.dispatchEvent(ptr('pointermove', 10)); // -90px of 200 = -45% → panel A to 5% (below min 10, allowed while dragging)
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([5, 95]);
    handle.dispatchEvent(ptr('pointerup', 10)); // release snaps A (5 < min 10) to collapsedSize 0
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([0, 100]);
  });

  it('double-click collapses the collapsible panel; again expands it', () => {
    const { fixture, splitter, handle } = build();
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([0, 100]);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([50, 50]);
  });

  it('manual mode wires the explicit handle to boundary 0', () => {
    const { fixture, splitter } = build((h) => h.autoGutters.set(false));
    const handle = fixture.nativeElement.querySelector('ax-splitter-handle') as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(splitter.sizes()).toEqual([60, 40]);
  });

  it('persists sizes to localStorage and restores them', () => {
    const store: Record<string, string> = {};
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => void (store[k] = v));
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => store[k] ?? null);

    const first = build((h) => h.storeKey.set('demo'));
    first.handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    first.fixture.detectChanges();
    expect(JSON.parse(store['demo'])).toEqual([60, 40]);

    const second = build((h) => h.storeKey.set('demo'));
    second.fixture.detectChanges();
    expect(second.splitter.sizes()).toEqual([60, 40]);

    jest.restoreAllMocks();
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(build().fixture.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const { fixture } = build();
      (fixture.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const { fixture } = build();
      (fixture.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
  });
});
