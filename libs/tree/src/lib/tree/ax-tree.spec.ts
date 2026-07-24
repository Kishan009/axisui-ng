/**
 * AxTreeComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) on the rendered host. Run twice (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTreeComponent } from './ax-tree.component';
import type { TreeNode } from './tree-core';

expect.extend(toHaveNoViolations);

const NODES: TreeNode[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      { id: 'a2', label: 'A2', children: [{ id: 'a2x', label: 'A2x' }] },
    ],
  },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C (lazy)', hasChildren: true },
];

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxTreeComponent> {
  const fixture = TestBed.createComponent(AxTreeComponent);
  fixture.componentRef.setInput('nodes', NODES);
  fixture.componentRef.setInput('ariaLabel', 'Files');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const rows = (f: ComponentFixture<AxTreeComponent>) =>
  Array.from(f.nativeElement.querySelectorAll('[role="treeitem"]')) as HTMLElement[];
const row = (f: ComponentFixture<AxTreeComponent>, id: string) =>
  f.nativeElement.querySelector(`[data-tree-id="${id}"]`) as HTMLElement | null;
const ids = (f: ComponentFixture<AxTreeComponent>) =>
  rows(f).map((r) => r.getAttribute('data-tree-id'));
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('AxTreeComponent', () => {
  it('renders only the visible (root) rows when collapsed', () => {
    expect(ids(create())).toEqual(['a', 'b', 'c']);
    expect(row(create(), 'a')!.getAttribute('role')).toBe('tree' + 'item');
  });

  it('expands a node when its toggle is clicked (and sets aria-level/expanded)', () => {
    const f = create();
    (row(f, 'a')!.querySelector('button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(ids(f)).toEqual(['a', 'a1', 'a2', 'b', 'c']);
    expect(row(f, 'a')!.getAttribute('aria-expanded')).toBe('true');
    expect(row(f, 'a1')!.getAttribute('aria-level')).toBe('2');
  });

  it('single selection sets selectedId + aria-selected', () => {
    const f = create({ selection: 'single' });
    row(f, 'b')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.selectedId()).toBe('b');
    expect(row(f, 'b')!.getAttribute('aria-selected')).toBe('true');
  });

  it('multiple selection cascades to descendants and shows mixed parents', () => {
    const f = create({ selection: 'multiple' });
    // check the box on root "a" → cascades to all descendants
    (row(f, 'a')!.querySelector('[data-s]') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    f.detectChanges();
    expect([...f.componentInstance.checkedIds()].sort()).toEqual(['a', 'a1', 'a2', 'a2x']);
    expect(row(f, 'a')!.getAttribute('aria-checked')).toBe('true');

    // a partial check → indeterminate ("mixed")
    f.componentRef.setInput('checkedIds', ['a1']);
    f.detectChanges();
    expect(row(f, 'a')!.getAttribute('aria-checked')).toBe('mixed');
  });

  it('lazy-loads children on first expand', async () => {
    const loadChildren = jest.fn(async () => [{ id: 'c1', label: 'C1' }] as TreeNode[]);
    const f = create({ loadChildren });
    (row(f, 'c')!.querySelector('button') as HTMLButtonElement).click();
    await flush();
    f.detectChanges();
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(ids(f)).toContain('c1');
  });

  it('roving keyboard moves focus with ArrowDown/Up', () => {
    const f = create();
    const tree = f.nativeElement.querySelector('[role="tree"]') as HTMLElement;
    expect(f.componentInstance.focusedId()).toBe('a');
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.focusedId()).toBe('b');
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.focusedId()).toBe('a');
  });

  it('ArrowRight expands a collapsed node', () => {
    const f = create();
    const tree = f.nativeElement.querySelector('[role="tree"]') as HTMLElement;
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    f.detectChanges();
    expect(ids(f)).toContain('a1');
  });

  it('renders through the virtual viewport when virtual', () => {
    const f = create({ virtual: true });
    expect(f.nativeElement.querySelector('[role="tree"]')?.classList.contains('overflow-auto')).toBe(true);
    expect(rows(f).length).toBeGreaterThan(0);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light (multiple, expanded)', async () => {
      expect(await axe(create({ selection: 'multiple', expandedIds: ['a', 'a2'] }).nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create({ selection: 'single' });
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
