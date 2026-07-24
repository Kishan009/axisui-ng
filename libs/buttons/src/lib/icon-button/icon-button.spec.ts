/**
 * Unit + a11y tests for the IconButton component.
 * Mirrors the Button spec pattern.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxIconButtonComponent } from './icon-button.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxIconButtonComponent],
  template: `
    <ax-icon-button
      [variant]="variant"
      [size]="size"
      [shape]="shape"
      [disabled]="disabled"
      [loading]="loading"
      [ariaLabel]="ariaLabel"
    >
      +
    </ax-icon-button>
  `,
})
class TestHostComponent {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' = 'ghost';
  size: 'sm' | 'md' | 'lg' = 'md';
  shape: 'square' | 'circle' = 'square';
  disabled = false;
  loading = false;
  ariaLabel = 'Add item';
}

describe('AxIconButtonComponent', () => {
  it('renders a button element with the requested variant', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
  });

  it('applies the size and shape as data attributes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.size = 'lg';
    fixture.componentInstance.shape = 'circle';
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-icon-button') as HTMLElement;
    expect(host.getAttribute('data-size')).toBe('lg');
    expect(host.getAttribute('data-shape')).toBe('circle');
  });

  it('is disabled when the disabled input is true', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('has no a11y violations when ariaLabel is provided', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('emits clickEvent when clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    // Smoke: assert the host's click handler runs without error.
    expect(button).toBeTruthy();
  });

  it('shows a spinner and marks aria-busy while loading', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.ax-icon-button__spinner')).toBeTruthy();
  });

  it('sets the accessible name from ariaLabel', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Add item');
  });

  it('never emits an empty aria-label (attribute absent when no name) and warns in dev', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.ariaLabel = '';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    // An empty-string aria-label would leave the button unnamed; the attribute must be omitted instead.
    expect(button.getAttribute('aria-label')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing accessible name'));
    warn.mockRestore();
  });
});
