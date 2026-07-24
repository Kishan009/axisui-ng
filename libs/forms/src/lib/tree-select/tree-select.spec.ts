/**
 * AxTreeSelectComponent — unit + a11y tests. The dropdown panel renders in the
 * CDK overlay container. a11y is asserted in three modes (LTR / RTL / dark) on
 * the (closed) trigger. Run twice (zoneless + Zone.js).
 */

import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTreeSelectComponent } from './tree-select.component';
import type { TreeNode } from '@axisui-ng/tree';

expect.extend(toHaveNoViolations);

const NODES: TreeNode[] = [
  { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
  { id: 'b', label: 'B' },
];

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxTreeSelectComponent> {
  const fixture = TestBed.createComponent(AxTreeSelectComponent);
  fixture.componentRef.setInput('nodes', NODES);
  fixture.componentRef.setInput('ariaLabel', 'Tree select');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const trigger = (f: ComponentFixture<AxTreeSelectComponent>) =>
  f.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
const panel = () => TestBed.inject(OverlayContainer).getContainerElement();

describe('AxTreeSelectComponent', () => {
  it('shows the placeholder when empty (single)', () => {
    expect(trigger(create({ placeholder: 'Pick a node' })).textContent).toContain('Pick a node');
  });

  it('opens the tree panel on trigger click', () => {
    const f = create();
    trigger(f).click();
    f.detectChanges();
    expect(panel().querySelector('[role="tree"]')).toBeTruthy();
  });

  it('single select sets the value, shows the label, and closes', () => {
    const f = create({ selection: 'single' });
    trigger(f).click();
    f.detectChanges();
    (panel().querySelector('[data-tree-id="b"]') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('b');
    expect(panel().querySelector('[role="tree"]')).toBeNull(); // closed
    expect(trigger(f).textContent).toContain('B');
  });

  it('multiple shows a chip per checked id; removing a chip unchecks it', () => {
    const f = create({ selection: 'multiple', value: ['a', 'a1'] });
    expect(f.nativeElement.querySelectorAll('ax-chip').length).toBe(2);
    (f.nativeElement.querySelectorAll('ax-chip button')[1] as HTMLButtonElement).click(); // remove "A1"
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a']);
  });

  it('panel search filters the tree', () => {
    const f = create();
    trigger(f).click();
    f.detectChanges();
    const search = panel().querySelector('input') as HTMLInputElement;
    search.value = 'A1';
    search.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(panel().querySelector('[data-tree-id="a1"]')).toBeTruthy();
    expect(panel().querySelector('[data-tree-id="b"]')).toBeNull();
  });

  it('Escape closes the panel', () => {
    const f = create();
    trigger(f).click();
    f.detectChanges();
    expect(panel().querySelector('[role="tree"]')).toBeTruthy();
    trigger(f).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(panel().querySelector('[role="tree"]')).toBeNull();
  });

  it('CVA: writeValue shows the label, setDisabledState disables the trigger', () => {
    const f = create({ selection: 'single' });
    f.componentInstance.writeValue('b');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(trigger(f).textContent).toContain('B');
    expect(trigger(f).getAttribute('aria-disabled')).toBe('true');
    expect(trigger(f).getAttribute('tabindex')).toBe('-1');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ selection: 'single', value: 'b' }).nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create({ selection: 'multiple', value: ['a'] });
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create();
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
