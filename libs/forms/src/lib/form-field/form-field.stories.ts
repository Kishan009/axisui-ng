import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxInputComponent } from '../input/input.component';
import { AxRadioComponent } from '../radio/radio.component';
import { AxFormFieldComponent } from './form-field.component';

const meta: Meta<AxFormFieldComponent> = {
  title: 'Forms/FormField',
  component: AxFormFieldComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxFormFieldComponent, AxInputComponent, AxRadioComponent] })],
};
export default meta;
type Story = StoryObj<AxFormFieldComponent>;

/** Label + helper text wired to a projected `ax-input` via matching `forId`/`id`. */
export const Default: Story = {
  render: () => ({
    template: `
      <ax-form-field class="block w-72" label="Email" forId="ff-email" helper="We'll never share it.">
        <ax-input id="ff-email" type="email" placeholder="you@example.com" />
      </ax-form-field>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    template: `
      <ax-form-field class="block w-72" label="Full name" forId="ff-name" [required]="true" helper="As it appears on your ID.">
        <ax-input id="ff-name" placeholder="Jane Doe" />
      </ax-form-field>
    `,
  }),
};

/** When `error` is set, it replaces the helper and the field wires `aria-invalid` onto the control. */
export const WithError: Story = {
  render: () => ({
    template: `
      <ax-form-field class="block w-72" label="Password" forId="ff-pw" error="Must be at least 8 characters.">
        <ax-input id="ff-pw" type="password" [invalid]="true" />
      </ax-form-field>
    `,
  }),
};

/** Group mode — a labelled `role="radiogroup"` around a set of radios. */
export const GroupMode: Story = {
  name: 'Group mode (radios)',
  render: () => ({
    template: `
      <ax-form-field class="block w-72" [group]="true" groupRole="radiogroup" label="Plan" error="Pick one to continue.">
        <div class="flex flex-col gap-2">
          <ax-radio name="ff-plan" value="free">Free</ax-radio>
          <ax-radio name="ff-plan" value="pro">Pro</ax-radio>
          <ax-radio name="ff-plan" value="team">Team</ax-radio>
        </div>
      </ax-form-field>
    `,
  }),
};
