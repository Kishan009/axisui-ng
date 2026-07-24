/**
 * Regression + behavior spec for the FormField + control pairing.
 *
 * Guards two a11y contracts documented on `ax-form-field`, for every control
 * that provides `AX_FORM_FIELD_CONTROL`:
 *   1. The `<label for>` (from `label` + `forId`) associates with the
 *      projected control's `id`, so assistive tech sees a labelled field.
 *   2. The field auto-wires `aria-describedby` (to its helper/error text)
 *      and `aria-invalid` (to its error state) onto the projected control —
 *      no consumer wiring.
 */

import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxFormFieldComponent } from './form-field.component';
import { AxInputComponent } from '../input/input.component';
import { AxRadioComponent } from '../radio/radio.component';
import { AxSelectComponent } from '../select/select.component';
import { AxTextareaComponent } from '../textarea/textarea.component';

expect.extend(toHaveNoViolations);

interface FieldHost {
  value: string | null;
  helper: string | null;
  error: string | null;
}

@Component({
  standalone: true,
  imports: [AxFormFieldComponent, AxInputComponent],
  template: `
    <ax-form-field label="Email" forId="email" [helper]="helper" [error]="error">
      <ax-input id="email" type="email" [(value)]="value" />
    </ax-form-field>
  `,
})
class InputHost implements FieldHost {
  value: string | null = '';
  helper: string | null = null;
  error: string | null = null;
}

@Component({
  standalone: true,
  imports: [AxFormFieldComponent, AxTextareaComponent],
  template: `
    <ax-form-field label="Bio" forId="bio" [helper]="helper" [error]="error">
      <ax-textarea id="bio" [(value)]="value" />
    </ax-form-field>
  `,
})
class TextareaHost implements FieldHost {
  value: string | null = '';
  helper: string | null = null;
  error: string | null = null;
}

@Component({
  standalone: true,
  imports: [AxFormFieldComponent, AxSelectComponent],
  template: `
    <ax-form-field label="Country" forId="country" [helper]="helper" [error]="error">
      <ax-select id="country" [options]="options" [(value)]="value" />
    </ax-form-field>
  `,
})
class SelectHost implements FieldHost {
  value: string | null = null;
  helper: string | null = null;
  error: string | null = null;
  options = [
    { value: 'us', label: 'United States' },
    { value: 'in', label: 'India' },
  ];
}

function suite(name: string, host: Type<FieldHost>, controlSelector: string, forId: string): void {
  describe(`AxFormFieldComponent + ${name}`, () => {
    function render(setup: Partial<FieldHost> = {}): ComponentFixture<FieldHost> {
      const fixture = TestBed.createComponent(host);
      Object.assign(fixture.componentInstance, setup);
      fixture.detectChanges();
      // Second pass lets the FormField's auto-wiring effect propagate into the
      // projected control's view before we assert on the rendered attributes.
      fixture.detectChanges();
      return fixture;
    }

    function parts(fixture: ComponentFixture<FieldHost>) {
      const el = fixture.nativeElement as HTMLElement;
      return {
        label: el.querySelector('label') as HTMLLabelElement,
        control: el.querySelector(controlSelector) as HTMLElement,
        helper: el.querySelector('p.text-muted-foreground') as HTMLElement | null,
        error: el.querySelector('p[role="alert"]') as HTMLElement | null,
      };
    }

    it('associates the label with the projected control via for/id', () => {
      const { label, control } = parts(render());
      expect(label.getAttribute('for')).toBe(forId);
      expect(control.id).toBe(forId);
      expect(label.getAttribute('for')).toBe(control.id);
    });

    it('auto-wires aria-describedby to the helper text', () => {
      const { control, helper } = parts(render({ helper: 'Help text.' }));
      expect(helper).toBeTruthy();
      expect(helper!.id).toBeTruthy();
      expect(control.getAttribute('aria-describedby')).toBe(helper!.id);
    });

    it('auto-wires aria-describedby + aria-invalid to the error text when invalid', () => {
      const { control, error } = parts(render({ error: 'Required' }));
      expect(error).toBeTruthy();
      expect(control.getAttribute('aria-describedby')).toBe(error!.id);
      expect(control.getAttribute('aria-invalid')).toBe('true');
    });

    it('leaves aria-describedby/aria-invalid unset with no helper or error', () => {
      const { control } = parts(render());
      expect(control.getAttribute('aria-describedby')).toBeNull();
      expect(control.getAttribute('aria-invalid')).toBeNull();
    });

    it('has no a11y violations with a helper (label associated, descriptor valid)', async () => {
      const results = await axe(render({ helper: 'Help text.' }).nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations in the error state', async () => {
      const results = await axe(render({ error: 'Required' }).nativeElement);
      expect(results).toHaveNoViolations();
    });
  });
}

suite('AxInputComponent', InputHost, 'input', 'email');
suite('AxTextareaComponent', TextareaHost, 'textarea', 'bio');
suite('AxSelectComponent', SelectHost, 'button[role="combobox"]', 'country');

@Component({
  standalone: true,
  imports: [AxFormFieldComponent, AxRadioComponent],
  template: `
    <ax-form-field [group]="true" label="Plan" [helper]="helper" [error]="error">
      <ax-radio name="plan" value="free">Free</ax-radio>
      <ax-radio name="plan" value="pro">Pro</ax-radio>
    </ax-form-field>
  `,
})
class RadioGroupHost {
  helper: string | null = null;
  error: string | null = null;
}

describe('AxFormFieldComponent group mode', () => {
  function render(setup: Partial<RadioGroupHost> = {}): ComponentFixture<RadioGroupHost> {
    const fixture = TestBed.createComponent(RadioGroupHost);
    Object.assign(fixture.componentInstance, setup);
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }

  function field(fixture: ComponentFixture<RadioGroupHost>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('ax-form-field') as HTMLElement;
  }

  it('exposes a role=group container labelled by its own (non-<label>) label', () => {
    const group = field(render());
    expect(group.getAttribute('role')).toBe('group');

    const labelledBy = group.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelEl = group.querySelector(`[id="${labelledBy}"]`) as HTMLElement;
    expect(labelEl).toBeTruthy();
    expect(labelEl.tagName).toBe('SPAN');
    expect(labelEl.textContent).toContain('Plan');
  });

  it('does not render a <label for> for the group label', () => {
    // The field's own label is a <span>; the only <label>s present are the
    // radios' implicit wrapping labels, none of which carry a `for`.
    const group = field(render());
    expect(group.querySelector('label[for]')).toBeNull();
  });

  it('auto-wires aria-describedby on the group to the helper text', () => {
    const group = field(render({ helper: 'Pick one.' }));
    const helper = group.querySelector('p.text-muted-foreground') as HTMLElement;
    expect(helper).toBeTruthy();
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
  });

  it('auto-wires aria-describedby + aria-invalid on the group when invalid', () => {
    const group = field(render({ error: 'Required' }));
    const error = group.querySelector('p[role="alert"]') as HTMLElement;
    expect(error).toBeTruthy();
    expect(group.getAttribute('aria-describedby')).toBe(error.id);
    expect(group.getAttribute('aria-invalid')).toBe('true');
  });

  it('leaves aria-describedby/aria-invalid unset with no helper or error', () => {
    const group = field(render());
    expect(group.getAttribute('aria-describedby')).toBeNull();
    expect(group.getAttribute('aria-invalid')).toBeNull();
  });

  it('has no a11y violations with a helper', async () => {
    expect(await axe(render({ helper: 'Pick one.' }).nativeElement)).toHaveNoViolations();
  });

  it('has no a11y violations in the error state', async () => {
    expect(await axe(render({ error: 'Required' }).nativeElement)).toHaveNoViolations();
  });
});
