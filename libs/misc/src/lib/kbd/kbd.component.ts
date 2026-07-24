import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { KBD_PLATFORM, resolveKeys, type KbdKey } from './kbd.tokens';

/**
 * Kbd — renders keyboard-shortcut keycaps. Platform-aware: modifier tokens
 * resolve to ⌘/⌥/⌃/⇧ on macOS and Ctrl/Alt/Win on other platforms.
 *
 * Provide `keys` (a '+'-joined string or array of tokens) for resolved
 * keycaps, or omit it and project content for a single ad-hoc keycap. Static
 * classes live on the host `class` so consumer classes on <ax-kbd> survive.
 *
 * @example
 * <ax-kbd keys="mod+k" />
 * <ax-kbd [keys]="['ctrl','alt','del']" />
 * <ax-kbd>Esc</ax-kbd>
 */
@Component({
  selector: 'ax-kbd',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  host: {
    class: 'inline-flex items-center gap-1',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @if (resolved().length) {
      @for (key of resolved(); track $index) {
        <kbd [class]="capClasses" [attr.aria-label]="key.label">{{ key.display }}</kbd>
      }
    } @else {
      <kbd [class]="capClasses"><ng-content /></kbd>
    }
  `,
})
export class AxKbdComponent {
  private readonly platform = inject(KBD_PLATFORM);

  /** A '+'-joined string ("mod+k") or array of tokens. Empty/null → projected content. */
  readonly keys = input<string | string[] | null>(null);

  /** Optional accessible label for the whole combo. @default null */
  readonly ariaLabel = input<string | null>(null);

  protected readonly resolved = computed<KbdKey[]>(() => {
    const value = this.keys();
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return [];
    }
    return resolveKeys(value, this.platform);
  });

  /** Static keycap styling (token-driven). */
  protected readonly capClasses =
    'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border ' +
    'border-border bg-muted px-1.5 font-mono text-[0.7rem] leading-none text-muted-foreground';
}
