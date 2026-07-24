import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxInputComponent } from '@axisui-ng/forms';

import type { AuthMode, AuthSubmit } from '../blocks.types';

/**
 * Auth form — login/signup card composing ax-input + ax-button. Fields use implicit
 * <label> wrapping for accessible names, and set `autocomplete`/`name` so password
 * managers and mobile keyboards work (email, current-password vs new-password by
 * mode, name). Pass [error] to surface a failure in a `role="alert"` region.
 * Emit-only: (authSubmit) fires with the credentials after a required-field guard;
 * no validation library or network. Header/footer slots are projected. Token-classed.
 */
@Component({
  selector: 'ax-auth-form',
  standalone: true,
  imports: [AxInputComponent, AxButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      class="flex flex-col gap-4 rounded-card border border-border bg-card p-6 text-card-foreground"
      [attr.aria-label]="ariaLabel() || (mode() === 'signup' ? 'Sign up' : 'Sign in')"
      (submit)="onSubmit($event)"
    >
      <ng-content select="[slot=header]" />

      @if (mode() === 'signup') {
        <label class="flex flex-col gap-1 text-sm font-medium">
          Name
          <ax-input
            type="text"
            name="name"
            autocomplete="name"
            placeholder="Your name"
            [value]="name()"
            (valueChange)="name.set($event ?? '')"
          />
        </label>
      }

      <label class="flex flex-col gap-1 text-sm font-medium">
        Email
        <ax-input
          type="email"
          name="email"
          autocomplete="email"
          placeholder="you@example.com"
          [value]="email()"
          (valueChange)="email.set($event ?? '')"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-medium">
        Password
        <ax-input
          type="password"
          name="password"
          [autocomplete]="passwordAutocomplete()"
          placeholder="Password"
          [value]="password()"
          (valueChange)="password.set($event ?? '')"
        />
      </label>

      @if (error()) {
        <p role="alert" class="text-sm font-medium text-destructive">{{ error() }}</p>
      }

      <ax-button class="mt-2 w-full" [disabled]="pending()" (clickEvent)="submit()">{{ resolvedLabel() }}</ax-button>

      <ng-content select="[slot=footer]" />
    </form>
  `,
})
export class AxAuthFormComponent {
  readonly mode = input<AuthMode>('login');
  readonly submitLabel = input('');
  readonly pending = input(false);
  readonly ariaLabel = input('');
  /** Error message to surface (e.g. "Incorrect email or password"). Rendered in a `role="alert"` region. */
  readonly error = input<string | null>(null);
  readonly authSubmit = output<AuthSubmit>();

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected readonly resolvedLabel = computed(
    () => this.submitLabel() || (this.mode() === 'signup' ? 'Create account' : 'Sign in'),
  );

  /** Signup asks the browser to offer/generate a new password; login offers the saved one. */
  protected readonly passwordAutocomplete = computed(() =>
    this.mode() === 'signup' ? 'new-password' : 'current-password',
  );

  protected onSubmit(e: Event): void {
    e.preventDefault();
    this.submit();
  }

  protected submit(): void {
    if (this.pending()) return;
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;
    if (this.mode() === 'signup' && !this.name().trim()) return;
    const payload: AuthSubmit = { email, password };
    if (this.mode() === 'signup') payload.name = this.name().trim();
    this.authSubmit.emit(payload);
  }
}
