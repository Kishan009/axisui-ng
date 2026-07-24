/**
 * Unit tests for the ToggleGroup component.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxToggleComponent } from '../toggle/toggle.component';
import { AxToggleGroupComponent } from './toggle-group.component';

@Component({
  standalone: true,
  imports: [AxToggleGroupComponent, AxToggleComponent],
  template: `
    <ax-toggle-group [type]="type" [(value)]="value" [ariaLabel]="ariaLabel">
      <ax-toggle value="a">A</ax-toggle>
      <ax-toggle value="b">B</ax-toggle>
      <ax-toggle value="c">C</ax-toggle>
    </ax-toggle-group>
  `,
})
class TestHostComponent {
  type: 'single' | 'multiple' = 'single';
  value: string | string[] | null = null;
  ariaLabel = 'Choices';
}

describe('AxToggleGroupComponent', () => {
  it('renders as a group with role', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('ax-toggle-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('data-type')).toBe('single');
  });

  it('binds aria-label', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.ariaLabel = 'Text formatting';
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('ax-toggle-group') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Text formatting');
  });

  it('single-select: click on a toggle emits its value', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('ax-toggle');
    (toggles[1] as HTMLElement).querySelector('button')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('b');
  });

  it('multi-select: click adds and removes values', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.type = 'multiple';
    fixture.componentInstance.value = [];
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('ax-toggle button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toEqual(['a', 'b']);
    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toEqual(['b']);
  });
});
