import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCommandComponent } from './command.component';
import type { CommandItem, CommandKeyBindings } from './command.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCommandComponent],
  template: `
    <ax-command
      [items]="items"
      [keyBindings]="keyBindings"
      (select)="picked = $event.id"
      (close)="closed = true"
    />
  `,
})
class HostComponent {
  items: CommandItem[] = [
    { id: 'new', label: 'New File' },
    { id: 'open', label: 'Open Folder' },
    { id: 'settings', label: 'Settings', keywords: ['preferences'] },
  ];
  keyBindings: Partial<CommandKeyBindings> = {};
  picked = '';
  closed = false;
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function combobox(fixture: { nativeElement: HTMLElement }): HTMLInputElement {
  return fixture.nativeElement.querySelector('[role="combobox"]') as HTMLInputElement;
}

function press(el: HTMLElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('AxCommand', () => {
  it('lists all items initially', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('filters items as the user types', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    type(input, 'pref');
    fixture.detectChanges();
    const opts = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(opts.length).toBe(1);
    expect(opts[0].textContent).toContain('Settings');
  });

  it('emits select with the chosen item on click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[role="option"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toBe('new');
  });

  it('shows the empty text when nothing matches', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    type(input, 'zzzz');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No results.');
  });

  it('announces the result count in a live region as the user types', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const live = () => (fixture.nativeElement.querySelector('[aria-live]') as HTMLElement).textContent?.trim();
    expect(live()).toBe('3 results available');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    type(input, 'settings');
    fixture.detectChanges();
    expect(live()).toBe('1 result available');
    type(input, 'zzzz');
    fixture.detectChanges();
    expect(live()).toBe('No results.');
  });

  it('tracks the active option via aria-activedescendant on ArrowDown', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = combobox(fixture);
    // A non-empty list anchors the active option at index 0.
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-0');
    press(input, 'ArrowDown');
    fixture.detectChanges();
    const active = input.getAttribute('aria-activedescendant');
    expect(active).toBe('ax-command-option-1');
    // It must reference a real option.
    expect(fixture.nativeElement.querySelector(`#${active}[role="option"]`)).toBeTruthy();
  });

  it('honors custom key bindings', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.keyBindings = { next: 'j', prev: 'k' };
    fixture.detectChanges();
    const input = combobox(fixture);
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-0');
    press(input, 'j');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-1');
    press(input, 'k');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-0');
  });

  it('jumps to last/first with End/Home', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = combobox(fixture);
    press(input, 'End');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-2');
    press(input, 'Home');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-0');
  });

  it('selects the active option on Enter', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = combobox(fixture);
    press(input, 'ArrowDown'); // index 1 — Open Folder
    fixture.detectChanges();
    press(input, 'Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toBe('open');
  });

  it('emits close on Escape', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const input = combobox(fixture);
    press(input, 'Escape');
    fixture.detectChanges();
    expect(fixture.componentInstance.closed).toBe(true);
  });

  it('never activates a disabled option', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.items = [
      { id: 'new', label: 'New File' },
      { id: 'open', label: 'Open Folder', disabled: true },
      { id: 'settings', label: 'Settings' },
    ];
    fixture.detectChanges();
    const input = combobox(fixture);
    const disabledId = 'ax-command-option-1';
    // ArrowDown should skip the disabled middle option.
    press(input, 'ArrowDown');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).not.toBe(disabledId);
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-2');
    // End/Home must also land on enabled options only.
    press(input, 'End');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-2');
    press(input, 'Home');
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('ax-command-option-0');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
