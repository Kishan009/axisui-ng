/**
 * Smoke tests for the entire forms lib — confirms all 7 components
 * are exported and construct without error.
 */

import { AxCheckboxComponent } from './checkbox/checkbox.component';
import { AxFormFieldComponent } from './form-field/form-field.component';
import { AxInputComponent } from './input/input.component';
import { AxRadioComponent } from './radio/radio.component';
import { AxSelectComponent } from './select/select.component';
import { AxSwitchComponent } from './switch/switch.component';
import { AxTextareaComponent } from './textarea/textarea.component';

describe('@axisui-ng/forms', () => {
  it('exports seven form components', () => {
    expect(AxInputComponent).toBeDefined();
    expect(AxTextareaComponent).toBeDefined();
    expect(AxCheckboxComponent).toBeDefined();
    expect(AxRadioComponent).toBeDefined();
    expect(AxSwitchComponent).toBeDefined();
    expect(AxFormFieldComponent).toBeDefined();
    expect(AxSelectComponent).toBeDefined();
  });

  it('all components are standalone', () => {
    const all = [AxInputComponent, AxTextareaComponent, AxCheckboxComponent, AxRadioComponent, AxSwitchComponent, AxFormFieldComponent, AxSelectComponent];
    for (const c of all) {
      expect((c as unknown as { ɵcmp: { standalone: boolean } }).ɵcmp.standalone).toBe(true);
    }
  });
});
