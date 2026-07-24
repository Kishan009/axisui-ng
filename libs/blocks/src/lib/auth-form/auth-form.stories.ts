import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxAuthFormComponent } from './auth-form.component';

const meta: Meta<AxAuthFormComponent> = {
  title: 'Blocks/AuthForm',
  component: AxAuthFormComponent,
  tags: ['autodocs'],
  argTypes: { mode: { control: 'inline-radio', options: ['login', 'signup'] } },
  args: { mode: 'login' },
  decorators: [moduleMetadata({ imports: [AxAuthFormComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm">
        <ax-auth-form [mode]="mode" ariaLabel="Sign in">
          <h2 slot="header" class="text-lg font-semibold">Welcome back</h2>
          <p slot="footer" class="text-xs text-muted-foreground">By continuing you agree to the terms.</p>
        </ax-auth-form>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxAuthFormComponent>;

export const Login: Story = {};

export const Signup: Story = { args: { mode: 'signup' } };
