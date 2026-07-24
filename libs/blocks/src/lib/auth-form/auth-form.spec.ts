import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxAuthFormComponent } from './auth-form.component';
import type { AuthSubmit } from '../blocks.types';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxAuthFormComponent> {
  const f = TestBed.createComponent(AxAuthFormComponent);
  f.componentRef.setInput('ariaLabel', 'Sign in');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

function type(f: ComponentFixture<AxAuthFormComponent>, selector: string, value: string): void {
  const input = f.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  f.detectChanges();
}

describe('AxAuthFormComponent', () => {
  it('renders email + password and no name field in login mode', () => {
    const el = create().nativeElement as HTMLElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.textContent).not.toContain('Name');
  });

  it('renders the name field in signup mode', () => {
    expect((create({ mode: 'signup' }).nativeElement as HTMLElement).textContent).toContain('Name');
  });

  it('emits the credentials on submit', () => {
    const f = create();
    let payload: AuthSubmit | undefined;
    f.componentInstance.authSubmit.subscribe((p) => (payload = p));
    type(f, 'input[type="email"]', 'a@b.com');
    type(f, 'input[type="password"]', 'secret123');
    (f.nativeElement.querySelector('ax-button button') as HTMLButtonElement).click();
    expect(payload).toEqual({ email: 'a@b.com', password: 'secret123' });
  });

  it('does not emit when required fields are empty', () => {
    const f = create();
    let called = false;
    f.componentInstance.authSubmit.subscribe(() => (called = true));
    (f.nativeElement.querySelector('ax-button button') as HTMLButtonElement).click();
    expect(called).toBe(false);
  });

  it('disables submit when pending', () => {
    const btn = create({ pending: true }).nativeElement.querySelector('ax-button button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ mode: 'signup' }).nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create();
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
