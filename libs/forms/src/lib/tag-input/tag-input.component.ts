/**
 * TagInput — free-text tokens. Type and press Enter or comma to add a chip;
 * paste splits on commas/newlines; Backspace on an empty field removes the last
 * chip. Implements ControlValueAccessor over `string[]` so it works with
 * `[(ngModel)]` / `formControlName`, and exposes a two-way `[(value)]`.
 *
 * @example
 * <ax-tag-input [(value)]="tags" placeholder="Add a tag…" [max]="5" ariaLabel="Tags" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { cn } from '../_utils/cn';
import { AxChipComponent } from '../chip/chip.component';

@Component({
  selector: 'ax-tag-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxChipComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxTagInputComponent), multi: true },
  ],
  host: {
    '[attr.role]': "'group'",
    '[attr.aria-label]': 'ariaLabel() || null',
    class: 'block',
  },
  template: `
    <div [class]="classes()">
      @for (tag of value(); track tag; let i = $index) {
        <ax-chip removable [disabled]="effectiveDisabled()" [removeAriaLabel]="'Remove ' + tag" (remove)="removeAt(i)">
          {{ tag }}
        </ax-chip>
      }
      <input
        class="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        [value]="draft()"
        [disabled]="effectiveDisabled()"
        [attr.aria-label]="ariaLabel() || 'Add tag'"
        [placeholder]="placeholder()"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (paste)="onPaste($event)"
        (blur)="onTouched()"
      />
    </div>
    <span aria-live="polite" class="sr-only">{{ announcement() }}</span>
  `,
})
export class AxTagInputComponent implements ControlValueAccessor {
  /** Placeholder for the text field. @default '' */
  placeholder = input<string>('');

  /** Disabled state (also driven by the parent form via setDisabledState). @default false */
  disabled = input<boolean>(false);

  /** Maximum number of tags (null = unlimited). @default null */
  max = input<number | null>(null);

  /** Allow duplicate tags. @default false */
  allowDuplicates = input<boolean>(false);

  /** Accessible label for the group + field. @default '' */
  ariaLabel = input<string>('');

  /** The tags (two-way). @default [] */
  value = model<string[]>([]);

  /** The in-progress text. */
  protected readonly draft = signal<string>('');

  /** Screen-reader announcement for add/remove/rejection (rendered in an aria-live region). */
  protected readonly announcement = signal<string>('');

  private announce(message: string): void {
    // Append a trailing space when repeating so an identical consecutive message
    // still changes the live region's text content and gets re-announced.
    this.announcement.set(this.announcement() === message ? `${message} ` : message);
  }

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());

  protected readonly classes = computed(() =>
    cn(
      'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-[var(--radius-field)] border border-input bg-background px-2 py-1',
      'transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart',
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      this.effectiveDisabled() && 'cursor-not-allowed opacity-50'
    )
  );

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitDraft();
    } else if (event.key === 'Backspace' && this.draft() === '' && this.value().length > 0) {
      event.preventDefault();
      this.removeAt(this.value().length - 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text.includes(',') && !text.includes('\n')) return;
    event.preventDefault();
    for (const part of text.split(/[,\n]/)) this.addTag(part);
  }

  /** Add the current draft as a tag, clearing the field on success. */
  protected commitDraft(): void {
    if (this.addTag(this.draft())) this.draft.set('');
  }

  /** Add one tag (trimmed). Returns whether it was added. */
  private addTag(raw: string): boolean {
    if (this.effectiveDisabled()) return false;
    const tag = raw.trim();
    if (!tag) return false;
    const current = this.value();
    if (!this.allowDuplicates() && current.includes(tag)) {
      this.announce(`${tag} is already added`);
      return false;
    }
    const max = this.max();
    if (max != null && current.length >= max) {
      this.announce(`Maximum of ${max} tags reached`);
      return false;
    }
    this.setTags([...current, tag]);
    this.announce(`${tag} added`);
    return true;
  }

  protected removeAt(index: number): void {
    if (this.effectiveDisabled()) return;
    const removed = this.value()[index];
    this.setTags(this.value().filter((_, i) => i !== index));
    if (removed !== undefined) this.announce(`${removed} removed`);
  }

  private setTags(next: string[]): void {
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(
      Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    );
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
