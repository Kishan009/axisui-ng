/**
 * AxHierarchyComponent — unit + a11y tests, run in all three modes (LTR / RTL / dark),
 * each with a jest-axe assertion. CI runs this suite twice (zoneless + Zone.js).
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxHierarchyComponent } from './hierarchy.component';
import type { HierarchyNode, HierarchyNodeClick } from './hierarchy.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxHierarchyComponent],
  template: `
    <ax-hierarchy [data]="data" preset="org" (nodeClick)="clicked = $event">
      <ng-template #node let-n>
        <span>{{ n.id }}</span>
      </ng-template>
    </ax-hierarchy>
  `,
})
class TestHostComponent {
  data: HierarchyNode[] = [{ id: 'ceo', children: [{ id: 'cto' }, { id: 'cfo' }] }];
  clicked: HierarchyNodeClick | null = null;
}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  return fixture;
}

const buttons = (fixture: ReturnType<typeof setup>): HTMLButtonElement[] =>
  Array.from(fixture.nativeElement.querySelectorAll('button'));

describe('AxHierarchyComponent', () => {
  describe('LTR + light mode', () => {
    it('renders one card per node', () => {
      const fixture = setup();
      expect(buttons(fixture)).toHaveLength(3);
    });

    it('projects the node template with the node as $implicit', () => {
      const fixture = setup();
      const labels = buttons(fixture).map((b) => b.textContent?.trim());
      expect(labels).toEqual(expect.arrayContaining(['ceo', 'cto', 'cfo']));
    });

    it('draws a connector path per parent→child link', () => {
      const fixture = setup();
      const paths = fixture.nativeElement.querySelectorAll('path');
      expect(paths).toHaveLength(2); // ceo→cto, ceo→cfo
    });

    it('exposes the resolved direction on the svg', () => {
      const fixture = setup();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('data-direction')).toBe('tb'); // org preset
    });

    it('emits nodeClick with the node and its depth', () => {
      const fixture = setup();
      const ceo = buttons(fixture).find((b) => b.textContent?.includes('ceo'))!;
      ceo.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.clicked).toEqual({
        node: expect.objectContaining({ id: 'ceo' }),
        depth: 0,
      });
    });

    it('has no a11y violations', async () => {
      const fixture = setup();
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });

  describe('RTL', () => {
    it('has no a11y violations in RTL', async () => {
      const fixture = setup();
      fixture.nativeElement.setAttribute('dir', 'rtl');
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Dark mode', () => {
    it('has no a11y violations in dark mode', async () => {
      const fixture = setup();
      fixture.nativeElement.classList.add('dark');
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });
});
