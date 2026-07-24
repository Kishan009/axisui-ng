/**
 * Unit tests for the ButtonGroup component.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxButtonComponent } from '../button/button.component';
import { AxButtonGroupComponent } from './button-group.component';

@Component({
  standalone: true,
  imports: [AxButtonGroupComponent, AxButtonComponent],
  template: `
    <div axButtonGroup [orientation]="orientation" [ariaLabel]="ariaLabel">
      <ax-button>One</ax-button>
      <ax-button>Two</ax-button>
      <ax-button>Three</ax-button>
    </div>
  `,
})
class TestHostComponent {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  ariaLabel: string | null = 'Group label';
}

describe('AxButtonGroupComponent', () => {
  it('renders with role="group" and orientation attribute', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[axButtonGroup]') as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('projects child buttons', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('ax-button');
    expect(buttons.length).toBe(3);
  });

  it('switches orientation', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.orientation = 'vertical';
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[axButtonGroup]') as HTMLElement;
    expect(host.getAttribute('data-orientation')).toBe('vertical');
  });

  it('binds aria-label when provided', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.ariaLabel = 'Text alignment';
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[axButtonGroup]') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Text alignment');
  });
});
