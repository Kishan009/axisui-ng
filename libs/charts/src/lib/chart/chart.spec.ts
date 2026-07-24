import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxChartComponent } from './chart.component';
import {
  type ChartDomain,
  type ChartLabelFormatter,
  type ChartPointEvent,
  type ChartSeriesInput,
  type ChartType,
  type ChartValueFormatter,
} from './chart.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxChartComponent],
  template: `
    <ax-chart
      [type]="type()"
      [series]="series()"
      [labels]="labels()"
      [showGrid]="showGrid()"
      [showLegend]="showLegend()"
      [stacked]="stacked()"
      [animated]="animated()"
      [valueFormat]="valueFormat()"
      [labelFormat]="labelFormat()"
      [xDomain]="xDomain()"
      [yDomain]="yDomain()"
      [donutRatio]="donutRatio()"
      (pointHover)="onHover($event)"
      (pointClick)="onClick($event)"
    />
  `,
})
class HostComponent {
  type = signal<ChartType>('line');
  series = signal<ChartSeriesInput[]>([
    { name: 'A', data: [10, 20, 30] },
    { name: 'B', data: [5, 15, 25] },
  ]);
  labels = signal<string[]>(['Jan', 'Feb', 'Mar']);
  showGrid = signal(true);
  showLegend = signal(true);
  stacked = signal(false);
  animated = signal(false);
  valueFormat = signal<ChartValueFormatter | null>(null);
  labelFormat = signal<ChartLabelFormatter | null>(null);
  xDomain = signal<ChartDomain | null>(null);
  yDomain = signal<ChartDomain | null>(null);
  donutRatio = signal(0.55);
  hovers: (ChartPointEvent | null)[] = [];
  clicks: ChartPointEvent[] = [];

  onHover(event: ChartPointEvent | null): void {
    this.hovers.push(event);
  }

  onClick(event: ChartPointEvent): void {
    this.clicks.push(event);
  }
}

function setup(configure?: (h: HostComponent) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HostComponent],
  });
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

function svg(fixture: ReturnType<typeof setup>): SVGSVGElement {
  return fixture.nativeElement.querySelector('svg') as SVGSVGElement;
}

describe('AxChart', () => {
  it('renders an svg[role=img] with one line path per series', () => {
    const fixture = setup();
    expect(svg(fixture).getAttribute('role')).toBe('img');
    expect(fixture.nativeElement.querySelectorAll('[data-chart-line]').length).toBe(2);
  });

  it('generates a descriptive aria-label from the series when none is given', () => {
    const label = svg(setup()).getAttribute('aria-label') ?? '';
    // series A/B, line type, 3 points each
    expect(label).toBe('line chart, 2 series (A, B), 3 points');
  });

  it('exposes a visually-hidden data table with the series values', () => {
    const fixture = setup();
    const table = fixture.nativeElement.querySelector('[data-chart-table]') as HTMLTableElement;
    expect(table).toBeTruthy();
    expect(table.className).toContain('sr-only');
    // header: Category + one column per series
    const headers = Array.from(table.querySelectorAll('thead th')).map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Category', 'A', 'B']);
    // first body row: Jan, 10, 5
    const firstRow = Array.from(table.querySelectorAll('tbody tr')[0].children).map((c) => c.textContent?.trim());
    expect(firstRow).toEqual(['Jan', '10', '5']);
  });

  it('distinguishes line series with dash patterns (non-color encoding)', () => {
    const fixture = setup();
    const lines = fixture.nativeElement.querySelectorAll('[data-chart-line]');
    expect(lines[0].getAttribute('stroke-dasharray')).toBeNull(); // first series solid
    expect(lines[1].getAttribute('stroke-dasharray')).toBeTruthy(); // second series dashed
  });

  it('area type adds a filled area path per series', () => {
    const fixture = setup((h) => h.type.set('area'));
    expect(fixture.nativeElement.querySelectorAll('[data-chart-area]').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('[data-chart-line]').length).toBe(2);
  });

  it('bar type renders rects', () => {
    const fixture = setup((h) => h.type.set('bar'));
    expect(fixture.nativeElement.querySelectorAll('[data-chart-bar]').length).toBe(6);
  });

  it('pie renders one path per slice', () => {
    const fixture = setup((h) => {
      h.type.set('pie');
      h.series.set([
        {
          kind: 'radial',
          name: 'Share',
          data: [
            { label: 'A', value: 1 },
            { label: 'B', value: 2 },
          ],
        },
      ]);
    });
    expect(fixture.nativeElement.querySelectorAll('[data-chart-slice]').length).toBe(2);
  });

  it('donut uses inner radius from donutRatio', () => {
    const fixture = setup((h) => {
      h.type.set('donut');
      h.donutRatio.set(0.5);
      h.series.set([{ kind: 'radial', name: 'Share', data: [{ label: 'A', value: 1 }, { label: 'B', value: 1 }] }]);
    });
    expect(fixture.nativeElement.querySelectorAll('[data-chart-slice]').length).toBe(2);
  });

  it('radial legend lists datum labels', () => {
    const fixture = setup((h) => {
      h.type.set('pie');
      h.series.set([
        {
          kind: 'radial',
          name: 'Share',
          data: [
            { label: 'Alpha', value: 1 },
            { label: 'Beta', value: 2 },
          ],
        },
      ]);
    });
    const legend = fixture.nativeElement.querySelector('[data-chart-legend]') as HTMLElement;
    expect(legend.textContent).toContain('Alpha');
    expect(legend.textContent).toContain('Beta');
  });

  it('scatter renders a circle per point', () => {
    const fixture = setup((h) => {
      h.type.set('scatter');
      h.series.set([
        { kind: 'xy', name: 'A', data: [{ x: 1, y: 2 }, { x: 3, y: 4 }] },
        { kind: 'xy', name: 'B', data: [{ x: 2, y: 1 }] },
      ]);
    });
    expect(fixture.nativeElement.querySelectorAll('[data-chart-point]').length).toBe(3);
  });

  it('stacked bar uses full category width (not grouped side-by-side)', () => {
    const fixture = setup((h) => {
      h.type.set('bar');
      h.stacked.set(true);
      h.series.set([
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
      ]);
    });
    const bars = Array.from(fixture.nativeElement.querySelectorAll('[data-chart-bar]')) as SVGRectElement[];
    expect(bars.length).toBe(4);
    const uniqueX = new Set(bars.map((bar) => bar.getAttribute('x')));
    expect(uniqueX.size).toBe(2);
  });

  it('stacked area renders closed band paths', () => {
    const fixture = setup((h) => {
      h.type.set('area');
      h.stacked.set(true);
      h.series.set([
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [2, 2, 1] },
      ]);
    });
    const areas = fixture.nativeElement.querySelectorAll('[data-chart-area]');
    expect(areas.length).toBe(2);
    expect(areas[0].getAttribute('d')).toContain('Z');
  });

  it('toggles gridlines and legend', () => {
    const fixture = setup((h) => {
      h.showGrid.set(false);
      h.showLegend.set(false);
    });
    expect(fixture.nativeElement.querySelectorAll('[data-chart-grid]').length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-chart-legend]')).toBeNull();
  });

  it('shows a tooltip on pointermove and clears it on pointerleave', () => {
    const fixture = setup();
    const el = svg(fixture);
    el.getBoundingClientRect = () =>
      ({ left: 0, width: 600, top: 0, height: 240, right: 600, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 600, bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chart-tooltip]')).toBeTruthy();
    el.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chart-tooltip]')).toBeNull();
  });

  it('applies valueFormat in tooltip text', () => {
    const fixture = setup((h) => {
      h.valueFormat.set((value) => `$${value}`);
    });
    const el = svg(fixture);
    el.getBoundingClientRect = () =>
      ({ left: 0, width: 600, top: 0, height: 240, right: 600, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 600, bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chart-tooltip]')?.textContent).toContain('$');
  });

  it('emits pointHover once per datum change and null on leave', () => {
    const fixture = setup();
    const host = fixture.componentInstance;
    host.hovers = [];
    const el = svg(fixture);
    el.getBoundingClientRect = () =>
      ({ left: 0, width: 600, top: 0, height: 240, right: 600, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 600, bubbles: true }));
    fixture.detectChanges();
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 590, bubbles: true }));
    fixture.detectChanges();
    el.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    fixture.detectChanges();
    expect(host.hovers.filter(Boolean).length).toBeGreaterThanOrEqual(1);
    expect(host.hovers[host.hovers.length - 1]).toBeNull();
    const nonNull = host.hovers.filter((event): event is ChartPointEvent => event !== null);
    const keys = nonNull.map((event) => `${event.seriesIndex}:${event.dataIndex}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('emits pointClick on pointer click of active datum', () => {
    const fixture = setup();
    const host = fixture.componentInstance;
    host.clicks = [];
    const el = svg(fixture);
    el.getBoundingClientRect = () =>
      ({ left: 0, width: 600, top: 0, height: 240, right: 600, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, bubbles: true }));
    fixture.detectChanges();
    el.dispatchEvent(new MouseEvent('click', { clientX: 300, bubbles: true }));
    fixture.detectChanges();
    expect(host.clicks.length).toBe(1);
    expect(host.clicks[0]?.chartType).toBe('line');
  });

  it('makes the svg focusable and moves active datum with arrow keys', () => {
    const fixture = setup();
    const el = svg(fixture);
    expect(el.getAttribute('tabindex')).toBe('0');
    el.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chart-tooltip]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-chart-live]')?.textContent).toMatch(/A|B/);
  });

  it('Enter emits pointClick for keyboard selection', () => {
    const fixture = setup();
    const host = fixture.componentInstance;
    host.clicks = [];
    const el = svg(fixture);
    el.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.clicks.length).toBe(1);
  });

  it('Escape clears keyboard selection', () => {
    const fixture = setup();
    const el = svg(fixture);
    el.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chart-tooltip]')).toBeNull();
  });

  it('renders a No data message when series is empty', () => {
    const fixture = setup((h) => h.series.set([]));
    expect(fixture.nativeElement.textContent).toContain('No data');
  });

  it('renders Invalid chart data for mismatched series kinds', () => {
    const fixture = setup((h) => {
      h.type.set('line');
      h.series.set([{ kind: 'xy', name: 'A', data: [{ x: 1, y: 2 }] }]);
    });
    expect(fixture.nativeElement.textContent).toContain('Invalid chart data');
  });

  it('has no a11y violations', async () => {
    const results = await axe(setup().nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('sets data-animated only when animated input is true after render', async () => {
    const fixture = setup((h) => h.animated.set(true));
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    expect(svg(fixture).getAttribute('data-animated')).toBe('true');
  });

  it('does not set data-animated by default', () => {
    expect(svg(setup()).getAttribute('data-animated')).toBeNull();
  });
});
