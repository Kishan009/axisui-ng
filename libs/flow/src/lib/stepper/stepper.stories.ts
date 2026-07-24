import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxStepComponent } from './step.component';
import { AxStepperComponent } from './stepper.component';
import type { StepperGuard } from './stepper.types';

const NAV_BTN =
  'inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:pointer-events-none';
const NAV_PRIMARY =
  'inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover';

const meta: Meta<AxStepperComponent> = {
  title: 'Flow/Stepper',
  component: AxStepperComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxStepperComponent, AxStepComponent] })],
};
export default meta;

type Story = StoryObj<AxStepperComponent>;

export const Horizontal: Story = {
  render: () => ({
    template: `
      <ax-stepper #s class="w-[640px]">
        <ax-step label="Account" description="Your login">
          <p class="text-sm text-muted-foreground">Step 1 — account details.</p>
        </ax-step>
        <ax-step label="Profile" description="About you">
          <p class="text-sm text-muted-foreground">Step 2 — profile.</p>
        </ax-step>
        <ax-step label="Review">
          <p class="text-sm text-muted-foreground">Step 3 — review &amp; submit.</p>
        </ax-step>
      </ax-stepper>
      <div class="mt-4 flex gap-2">
        <button type="button" class="${NAV_BTN}" (click)="s.previous()">Back</button>
        <button type="button" class="${NAV_PRIMARY}" (click)="s.next()">Next</button>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <ax-stepper #s orientation="vertical" class="w-[520px]">
        <ax-step label="Shipping" description="Where to?">
          <p class="text-sm text-muted-foreground">Shipping address.</p>
        </ax-step>
        <ax-step label="Payment" description="How you'll pay">
          <p class="text-sm text-muted-foreground">Payment method.</p>
        </ax-step>
        <ax-step label="Confirm">
          <p class="text-sm text-muted-foreground">Place your order.</p>
        </ax-step>
      </ax-stepper>
      <div class="mt-4 flex gap-2">
        <button type="button" class="${NAV_BTN}" (click)="s.previous()">Back</button>
        <button type="button" class="${NAV_PRIMARY}" (click)="s.next()">Next</button>
      </div>
    `,
  }),
};

export const NonLinear: Story = {
  render: () => ({
    template: `
      <ax-stepper [linear]="false" class="w-[640px]">
        <ax-step label="One"><p class="text-sm text-muted-foreground">Jump anywhere — click a step.</p></ax-step>
        <ax-step label="Two"><p class="text-sm text-muted-foreground">Second.</p></ax-step>
        <ax-step label="Three"><p class="text-sm text-muted-foreground">Third.</p></ax-step>
      </ax-stepper>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <ax-stepper [currentStep]="1" [linear]="false" class="w-[720px]">
        <ax-step label="Done" [completed]="true"><span></span></ax-step>
        <ax-step label="Current" description="In progress"><span></span></ax-step>
        <ax-step label="Has error" [error]="true"><span></span></ax-step>
        <ax-step label="Optional" [optional]="true"><span></span></ax-step>
        <ax-step label="Disabled" [disabled]="true"><span></span></ax-step>
      </ax-stepper>
    `,
  }),
};

const asyncGuard: StepperGuard = () => new Promise((resolve) => setTimeout(() => resolve(true), 900));

export const AsyncGuard: Story = {
  render: () => ({
    props: { asyncGuard },
    template: `
      <ax-stepper #s [guard]="asyncGuard" class="w-[640px]">
        <ax-step label="One"><p class="text-sm text-muted-foreground">Advancing validates for ~0.9s (spinner on the target step).</p></ax-step>
        <ax-step label="Two"><p class="text-sm text-muted-foreground">Second.</p></ax-step>
        <ax-step label="Three"><p class="text-sm text-muted-foreground">Third.</p></ax-step>
      </ax-stepper>
      <div class="mt-4 flex gap-2">
        <button type="button" class="${NAV_BTN}" (click)="s.previous()">Back</button>
        <button type="button" class="${NAV_PRIMARY}" (click)="s.next()">Next</button>
      </div>
    `,
  }),
};
