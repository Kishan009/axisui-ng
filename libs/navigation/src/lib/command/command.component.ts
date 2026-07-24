import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { matchesQuery } from './command-filter';
import type { CommandItem, CommandKeyBindings } from './command.types';

/**
 * Command — a searchable command list (palette body). Use inside <ax-command-dialog>
 * for the modal ⌘K variant, or inline.
 *
 * Keyboard (all bindings customizable via `keyBindings`): ArrowUp/Down move the
 * active option, Home/End jump to the ends, PageUp/PageDown jump by `pageSize`,
 * Enter selects the active option, Escape emits `close`. Disabled options are
 * skipped; navigation never wraps.
 */
@Component({
  selector: 'ax-command',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { class: 'flex w-full flex-col gap-2' },
  template: `
    <div class="flex items-center gap-2 border-b border-border pb-2">
      <ax-icon name="search" [size]="16" class="text-muted-foreground" />
      <input
        type="text"
        class="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        [placeholder]="placeholder()"
        [value]="query()"
        role="combobox"
        aria-label="Command search"
        aria-controls="ax-command-list"
        aria-autocomplete="list"
        [attr.aria-expanded]="filtered().length > 0"
        [attr.aria-activedescendant]="activeOptionId()"
        (input)="onSearch($event)"
        (keydown)="onKeydown($event)"
      />
    </div>
    <ul id="ax-command-list" role="listbox" aria-label="Commands" class="max-h-72 overflow-y-auto">
      @for (item of filtered(); track item.id; let i = $index) {
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- listbox uses aria-activedescendant: the input is focused and handles keyboard; options are mouse targets only -->
        <li
          #optionEl
          role="option"
          [id]="'ax-command-option-' + i"
          [attr.aria-selected]="i === activeIndex()"
          [attr.aria-disabled]="item.disabled ? 'true' : null"
          [class]="optionClasses"
          [class.bg-accent]="i === activeIndex()"
          [class.text-accent-foreground]="i === activeIndex()"
          (click)="choose(item)"
          (mouseenter)="activeIndex.set(i)"
        >
          @if (item.icon) { <ax-icon [name]="item.icon" [size]="16" /> }
          <span>{{ item.label }}</span>
          @if (item.group) { <span class="ms-auto text-xs text-muted-foreground">{{ item.group }}</span> }
        </li>
      }
      @if (filtered().length === 0) {
        <li role="presentation" class="px-2 py-6 text-center text-sm text-muted-foreground">{{ emptyText() }}</li>
      }
    </ul>
    <span aria-live="polite" role="status" class="sr-only">{{ resultsAnnouncement() }}</span>
  `,
})
export class AxCommandComponent {
  /** The commands to show. */
  readonly items = input.required<CommandItem[]>();
  /** Search placeholder. @default 'Type a command…' */
  readonly placeholder = input<string>('Type a command…');
  /** Text shown when nothing matches. @default 'No results.' */
  readonly emptyText = input<string>('No results.');
  /** Override any subset of the keyboard bindings. */
  readonly keyBindings = input<Partial<CommandKeyBindings>>({});
  /** How many enabled options PageUp/PageDown jump by. @default 5 */
  readonly pageSize = input<number>(5);
  /** Emitted when an item is chosen. */
  // eslint-disable-next-line @angular-eslint/no-output-native -- `select` is the established public Command API
  readonly select = output<CommandItem>();
  /** Emitted when the close binding (Escape by default) is pressed. */
  // eslint-disable-next-line @angular-eslint/no-output-native -- `close` is the intended public Command API; it composes with the wrapping dialog's own Escape handling
  readonly close = output<void>();

  protected readonly query = signal('');
  protected readonly filtered = computed(() => this.items().filter((i) => matchesQuery(i, this.query())));
  /** Index of the keyboard-active option within `filtered()` (-1 = none). */
  protected readonly activeIndex = signal(-1);

  private readonly optionEls = viewChildren<ElementRef<HTMLElement>>('optionEl');

  private readonly defaultBindings: Required<CommandKeyBindings> = {
    next: 'ArrowDown',
    prev: 'ArrowUp',
    pageDown: 'PageDown',
    pageUp: 'PageUp',
    first: 'Home',
    last: 'End',
    select: 'Enter',
    close: 'Escape',
  };

  /** id of the active option, for aria-activedescendant. */
  protected readonly activeOptionId = computed(() => {
    const i = this.activeIndex();
    return i >= 0 ? `ax-command-option-${i}` : null;
  });

  /** Polite screen-reader announcement of how many commands match the query. */
  protected readonly resultsAnnouncement = computed(() => {
    const n = this.filtered().length;
    return n === 0 ? this.emptyText() : `${n} result${n === 1 ? '' : 's'} available`;
  });

  protected readonly optionClasses = cn(
    'flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm',
    'transition-colors duration-[var(--duration-fast)] ease-out-quart',
    'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
  );

  constructor() {
    // Re-anchor the active option whenever the filtered list changes (e.g. typing).
    // First enabled option when there are results, else -1 (keys become no-ops).
    effect(() => {
      const opts = this.filtered();
      // First enabled option, or -1 when the list is empty / all-disabled
      // (keys become no-ops and no disabled option is ever active).
      const next = opts.findIndex((o) => !o.disabled);
      // untracked: depend only on `filtered()`, not on activeIndex — otherwise
      // every keyboard move would retrigger this effect and snap back to `next`.
      if (untracked(this.activeIndex) !== next) this.activeIndex.set(next);
    });
    // Keep the active option scrolled into view (browser-only; no-op under SSR).
    effect(() => {
      const i = this.activeIndex();
      const els = this.optionEls();
      if (i >= 0 && els[i]) els[i].nativeElement.scrollIntoView?.({ block: 'nearest' });
    });
  }

  private resolveBinding(action: keyof CommandKeyBindings): string {
    return this.keyBindings()[action] ?? this.defaultBindings[action];
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected choose(item: CommandItem): void {
    if (item.disabled) return;
    this.select.emit(item);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const opts = this.filtered();
    if (opts.length === 0) return;
    const key = event.key;
    switch (key) {
      case this.resolveBinding('next'):
        event.preventDefault();
        this.moveActive(1);
        break;
      case this.resolveBinding('prev'):
        event.preventDefault();
        this.moveActive(-1);
        break;
      case this.resolveBinding('pageDown'):
        event.preventDefault();
        this.moveActive(this.pageSize());
        break;
      case this.resolveBinding('pageUp'):
        event.preventDefault();
        this.moveActive(-this.pageSize());
        break;
      case this.resolveBinding('first'):
        event.preventDefault();
        this.setActiveToEdge(1);
        break;
      case this.resolveBinding('last'):
        event.preventDefault();
        this.setActiveToEdge(-1);
        break;
      case this.resolveBinding('select'): {
        event.preventDefault();
        const active = opts[this.activeIndex()];
        if (active) this.choose(active);
        break;
      }
      case this.resolveBinding('close'):
        // Do NOT preventDefault/stopPropagation: let the event keep bubbling so a
        // wrapping <ax-dialog> still performs its own Escape-to-close.
        this.close.emit();
        break;
    }
  }

  /**
   * Move the active option by up to `delta` enabled steps in `delta`'s direction,
   * skipping disabled options and clamping at the ends (no wrap).
   */
  private moveActive(delta: number): void {
    if (delta === 0) return;
    const opts = this.filtered();
    const dir = delta > 0 ? 1 : -1;
    let steps = Math.abs(delta);
    let i = this.activeIndex();
    let landed = i;
    while (steps > 0) {
      let next = i + dir;
      // Skip past disabled options in this direction.
      while (opts[next]?.disabled) next += dir;
      if (!opts[next]) break; // clamp: no further enabled option that way
      i = next;
      landed = next;
      steps--;
    }
    if (landed !== this.activeIndex()) this.activeIndex.set(landed);
  }

  /** Jump the active option to the first (`dir=1`) or last (`dir=-1`) enabled option. */
  private setActiveToEdge(dir: 1 | -1): void {
    const opts = this.filtered();
    if (dir === 1) {
      const i = opts.findIndex((o) => !o.disabled);
      if (i >= 0) this.activeIndex.set(i);
    } else {
      for (let i = opts.length - 1; i >= 0; i--) {
        if (!opts[i]?.disabled) {
          this.activeIndex.set(i);
          return;
        }
      }
    }
  }
}
