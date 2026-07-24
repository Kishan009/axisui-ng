import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AxAuthFormComponent,
  type AuthMode,
  type AuthSubmit,
} from '@axisui-ng/blocks';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

@Component({
  selector: 'demo-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxAuthFormComponent,
    AxButtonComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div class="mx-auto flex max-w-md flex-col gap-8 py-6">
      <div class="text-center">
        <p class="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          AxisUI sample
        </p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Sign in with token-first chrome
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          Auth surfaces inherit preset, dark mode, and density from Theme — no per-form
          color overrides.
        </p>
      </div>

      <div class="demo-surface p-5" axStack gap="4">
        <div axCluster gap="2" class="justify-center">
          <ax-button
            size="sm"
            [variant]="mode() === 'login' ? 'primary' : 'outline'"
            (clickEvent)="mode.set('login')"
          >
            Log in
          </ax-button>
          <ax-button
            size="sm"
            [variant]="mode() === 'signup' ? 'primary' : 'outline'"
            (clickEvent)="mode.set('signup')"
          >
            Sign up
          </ax-button>
        </div>

        <ax-auth-form
          [mode]="mode()"
          [error]="authError()"
          (authSubmit)="onAuth($event)"
        >
          <div slot="header" class="mb-1">
            <h3 class="text-base font-semibold text-card-foreground">
              {{ mode() === 'signup' ? 'Create account' : 'Welcome back' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              Card chrome uses <code class="text-foreground">bg-card</code> /
              <code class="text-foreground">border-border</code> tokens.
            </p>
          </div>
        </ax-auth-form>

        @if (lastAuth(); as a) {
          <p class="text-center text-xs text-muted-foreground">
            Demo submit: {{ a.email }}
            @if (a.name) {
              <span>({{ a.name }})</span>
            }
          </p>
        }
      </div>

      <p class="text-center text-xs text-muted-foreground">
        Composed with <code class="text-foreground">ax-auth-form</code> from
        <code class="text-foreground">@axisui-ng/blocks</code>.
      </p>
    </div>
  `,
})
export class AuthPageComponent {
  readonly mode = signal<AuthMode>('login');
  readonly lastAuth = signal<AuthSubmit | null>(null);
  readonly authError = signal<string | null>(null);

  onAuth(value: AuthSubmit): void {
    this.authError.set(null);
    this.lastAuth.set(value);
  }
}
