/**
 * AxTimelineComponent — unit + a11y tests across both modes (projected children
 * + data-driven `[items]`). a11y is asserted in three modes (LTR / RTL / dark)
 * on the rendered host. CSS-only behaviour (connector hidden on last item,
 * alternating placement) is asserted via the emitted class tokens, since jsdom
 * applies no Tailwind. Run twice (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTimelineComponent } from './timeline.component';
import { AxTimelineItemComponent } from './timeline-item.component';
import type { TimelineAlign, TimelineItem, TimelineOrientation } from './timeline.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxTimelineComponent, AxTimelineItemComponent],
  template: `
    <ax-timeline [orientation]="orientation()" [align]="align()">
      <ax-timeline-item title="Created" time="09:00">Order placed</ax-timeline-item>
      <ax-timeline-item title="Shipped" color="success" icon="check" />
      <ax-timeline-item title="Delivered" />
    </ax-timeline>
  `,
})
class ProjectedHost {
  orientation = signal<TimelineOrientation>('vertical');
  align = signal<TimelineAlign>('start');
}

@Component({
  standalone: true,
  imports: [AxTimelineComponent],
  template: `<ax-timeline [items]="items" />`,
})
class DataHost {
  items: TimelineItem[] = [
    { title: 'Created', time: '09:00', description: 'Order placed' },
    { title: 'Shipped', color: 'success', icon: 'check' },
    { title: 'Delivered' },
  ];
}

function projected(configure?: (h: ProjectedHost) => void) {
  const fixture = TestBed.createComponent(ProjectedHost);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}
function data() {
  const fixture = TestBed.createComponent(DataHost);
  fixture.detectChanges();
  return fixture;
}

const timelineEl = (f: ComponentFixture<unknown>) => f.nativeElement.querySelector('ax-timeline') as HTMLElement;
const items = (f: ComponentFixture<unknown>) =>
  Array.from(f.nativeElement.querySelectorAll('ax-timeline-item[role="listitem"]')) as HTMLElement[];

describe('AxTimeline', () => {
  it('projected mode renders a list of items with titles + content', () => {
    const f = projected();
    expect(timelineEl(f).getAttribute('role')).toBe('list');
    const its = items(f);
    expect(its.length).toBe(3);
    expect(f.nativeElement.textContent).toContain('Created');
    expect(f.nativeElement.textContent).toContain('Order placed');
  });

  it('data-driven mode renders the same item markup from [items]', () => {
    const f = data();
    const its = items(f);
    expect(its.length).toBe(3);
    expect(f.nativeElement.textContent).toContain('Delivered');
    expect(f.nativeElement.textContent).toContain('Order placed'); // description
  });

  it('renders a connector per item and hides the last via the container rule', () => {
    const f = projected();
    expect(f.nativeElement.querySelectorAll('[data-connector]').length).toBe(3);
    expect(timelineEl(f).className).toContain('ax-timeline-item:last-child');
  });

  it('reflects orientation via data-orientation', () => {
    const f = projected((h) => h.orientation.set('horizontal'));
    expect(timelineEl(f).getAttribute('data-orientation')).toBe('horizontal');
    expect(timelineEl(f).className).toContain('flex-row');
  });

  it('alternating (vertical) switches items to a grid and flips even content', () => {
    const f = projected((h) => h.align.set('alternate'));
    expect(items(f)[0].className).toContain('grid-cols-');
    expect(timelineEl(f).className).toContain('nth-child(even)');
  });

  it('renders a tinted icon marker', () => {
    const f = projected();
    const shipped = items(f)[1];
    expect(shipped.querySelector('[data-ax-icon="check"]')).toBeTruthy();
    expect(shipped.innerHTML).toContain('bg-success');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light (projected)', async () => {
      expect(await axe(timelineEl(projected()))).toHaveNoViolations();
    });

    it('has no violations in data-driven mode', async () => {
      expect(await axe(timelineEl(data()))).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const f = projected();
      timelineEl(f).setAttribute('dir', 'rtl');
      expect(await axe(timelineEl(f))).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const f = projected();
      timelineEl(f).classList.add('dark');
      expect(await axe(timelineEl(f))).toHaveNoViolations();
    });
  });
});
