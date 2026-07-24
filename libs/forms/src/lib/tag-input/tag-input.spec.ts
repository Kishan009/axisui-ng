/**
 * AxTagInputComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) by toggling the rendered host element (not the global
 * document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTagInputComponent } from './tag-input.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxTagInputComponent> {
  const fixture = TestBed.createComponent(AxTagInputComponent);
  fixture.componentRef.setInput('ariaLabel', 'Tags');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const input = (f: ComponentFixture<AxTagInputComponent>) =>
  f.nativeElement.querySelector('input') as HTMLInputElement;
const chips = (f: ComponentFixture<AxTagInputComponent>) =>
  Array.from(f.nativeElement.querySelectorAll('ax-chip')) as HTMLElement[];

function type(f: ComponentFixture<AxTagInputComponent>, text: string) {
  const el = input(f);
  el.value = text;
  el.dispatchEvent(new Event('input'));
  f.detectChanges();
}
function key(f: ComponentFixture<AxTagInputComponent>, k: string) {
  input(f).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  f.detectChanges();
}

describe('AxTagInputComponent', () => {
  it('adds a tag on Enter and clears the field', () => {
    const f = create();
    type(f, 'alpha');
    key(f, 'Enter');
    expect(f.componentInstance.value()).toEqual(['alpha']);
    expect(input(f).value).toBe('');
    expect(chips(f).length).toBe(1);
  });

  it('adds a tag on comma and trims whitespace', () => {
    const f = create();
    type(f, '  beta  ');
    key(f, ',');
    expect(f.componentInstance.value()).toEqual(['beta']);
  });

  it('ignores empty and duplicate tags by default', () => {
    const f = create({ value: ['alpha'] });
    type(f, '   ');
    key(f, 'Enter');
    type(f, 'alpha');
    key(f, 'Enter');
    expect(f.componentInstance.value()).toEqual(['alpha']);
  });

  it('allows duplicates when allowDuplicates is set', () => {
    const f = create({ value: ['alpha'], allowDuplicates: true });
    type(f, 'alpha');
    key(f, 'Enter');
    expect(f.componentInstance.value()).toEqual(['alpha', 'alpha']);
  });

  it('respects the max cap', () => {
    const f = create({ value: ['a', 'b'], max: 2 });
    type(f, 'c');
    key(f, 'Enter');
    expect(f.componentInstance.value()).toEqual(['a', 'b']);
  });

  it('removes the last tag on Backspace when the field is empty', () => {
    const f = create({ value: ['a', 'b'] });
    key(f, 'Backspace');
    expect(f.componentInstance.value()).toEqual(['a']);
  });

  it('removes a tag via the chip remove button', () => {
    const f = create({ value: ['a', 'b', 'c'] });
    (chips(f)[1].querySelector('button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a', 'c']);
  });

  it('announces add / remove / rejection via an aria-live region', () => {
    const f = create({ max: 1 });
    const live = () => (f.nativeElement.querySelector('[aria-live]') as HTMLElement).textContent?.trim();
    type(f, 'alpha');
    key(f, 'Enter');
    expect(live()).toBe('alpha added');
    // max=1 reached → next add is rejected with an explanation
    type(f, 'beta');
    key(f, 'Enter');
    expect(live()).toBe('Maximum of 1 tags reached');
    // remove announces which tag went
    (chips(f)[0].querySelector('button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(live()).toBe('alpha removed');
  });

  it('splits a pasted comma/newline list into tags', () => {
    const f = create();
    // jsdom has no DataTransfer; mock clipboardData on a plain paste event.
    const event = new Event('paste', { bubbles: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'one, two\nthree' } });
    input(f).dispatchEvent(event);
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['one', 'two', 'three']);
  });

  it('CVA: writeValue + setDisabledState drive state', () => {
    const f = create();
    const cmp = f.componentInstance;
    cmp.writeValue(['x', 'y']);
    cmp.setDisabledState(true);
    f.detectChanges();
    expect(cmp.value()).toEqual(['x', 'y']);
    expect(input(f).disabled).toBe(true);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ value: ['a', 'b'] }).nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const f = create({ value: ['a', 'b'] });
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const f = create({ value: ['a', 'b'] });
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
