/**
 * Upload — a drag-drop / browse zone with a validating file list, optional
 * auto-upload + per-file progress, and image thumbnails. Implements
 * ControlValueAccessor over `File[]` and exposes a two-way `[(value)]`.
 *
 * Without `uploadFn` it is a pure dropzone (files are collected). With
 * `uploadFn` it drives uploads and shows a `ax-progress` bar per file. Rejected
 * files (wrong type / too large / over the count cap) are silently ignored.
 *
 * The zone is a `<label>` wrapping a visually-hidden `<input type="file">`, so
 * click + keyboard (the focused input opens the dialog natively) work with one
 * accessible control; drag/drop is handled on the label.
 *
 * @example
 * <ax-upload [(value)]="files" accept="image/*" [multiple]="true" [maxSize]="2_000_000" ariaLabel="Photos" />
 * <ax-upload accept=".pdf" [uploadFn]="upload" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AxIconComponent } from '@axisui-ng/icons';
import { AxProgressComponent } from '@axisui-ng/feedback';

import { cn } from '../_utils/cn';
import type { UploadFn, UploadItem } from './upload.types';

@Component({
  selector: 'ax-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent, AxProgressComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxUploadComponent), multi: true },
  ],
  host: { class: 'block' },
  template: `
    <label
      [class]="zoneClasses()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
    >
      <input
        type="file"
        class="peer sr-only"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="effectiveDisabled()"
        [attr.aria-label]="ariaLabel()"
        (change)="onInputChange($event)"
        (blur)="onTouched()"
      />
      <ax-icon name="upload" [size]="24" class="text-muted-foreground" />
      <span class="text-sm font-medium">Drag &amp; drop or <span class="text-primary">browse</span></span>
      @if (accept()) {
        <span class="text-xs text-muted-foreground">{{ accept() }}</span>
      }
    </label>

    @if (items().length) {
      <ul role="list" class="mt-3 flex flex-col gap-2">
        @for (item of items(); track item.id) {
          <li class="flex items-center gap-3 rounded-[var(--radius-md)] border border-border p-2">
            @if (item.previewUrl) {
              <img [src]="item.previewUrl" alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
            } @else {
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                <ax-icon name="file" [size]="18" />
              </span>
            }
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm">{{ item.file.name }}</span>
                <span class="ms-auto shrink-0 text-xs text-muted-foreground">{{ formatSize(item.file.size) }}</span>
              </div>
              @if (item.status === 'uploading') {
                <ax-progress class="mt-1 block" [value]="item.progress" [ariaLabel]="'Uploading ' + item.file.name" />
              } @else if (item.status === 'error') {
                <span class="text-xs text-destructive">{{ item.error || 'Upload failed' }}</span>
              }
            </div>
            @if (item.status === 'success') {
              <ax-icon name="check-circle" [size]="18" class="shrink-0 text-success" />
            } @else if (item.status === 'error') {
              <ax-icon name="alert-circle" [size]="18" class="shrink-0 text-destructive" />
            }
            <!-- Touch target (S3): remove control stays visually 24px; ::before expands to ≥44px. -->
            <button
              type="button"
              class="relative inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground before:absolute before:inset-[-10px] before:content-[''] transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              [attr.aria-label]="'Remove ' + item.file.name"
              (click)="removeItem(item.id)"
            >
              <ax-icon name="x" [size]="16" />
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class AxUploadComponent implements ControlValueAccessor {
  /** Accepted types, e.g. "image/*,.pdf". @default '' */
  accept = input<string>('');
  /** Allow multiple files. When false, a new selection replaces the current one. @default false */
  multiple = input<boolean>(false);
  /** Max number of files (ignored when `!multiple`). @default null */
  maxFiles = input<number | null>(null);
  /** Max per-file size in bytes. @default null */
  maxSize = input<number | null>(null);
  /** Disabled (also driven by the parent form). @default false */
  disabled = input<boolean>(false);
  /** Optional auto-upload driver; without it the component just collects files. @default null */
  uploadFn = input<UploadFn | null>(null);
  /** Accessible label for the dropzone. @default 'Upload files' */
  ariaLabel = input<string>('Upload files');

  /** The accepted files (two-way + CVA). @default [] */
  value = model<File[]>([]);

  protected readonly items = signal<UploadItem[]>([]);
  protected readonly dragging = signal<boolean>(false);
  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());

  private readonly sanitizer = inject(DomSanitizer);
  private nextId = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.items().forEach((i) => this.cleanup(i)));
  }

  protected readonly zoneClasses = computed(() =>
    cn(
      'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-input bg-background p-6 text-center transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-out-quart',
      'hover:border-primary/50 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      this.dragging() && 'border-primary bg-primary/5'
    )
  );

  // --- interaction ------------------------------------------------------

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.effectiveDisabled()) this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.ingest(event.dataTransfer?.files);
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ingest(input.files);
    input.value = ''; // allow re-selecting the same file
  }

  // --- ingest / validation ----------------------------------------------

  private ingest(list: FileList | null | undefined): void {
    if (!list || this.effectiveDisabled()) return;
    const replace = !this.multiple();
    const cap = replace ? 1 : this.maxFiles() ?? Number.POSITIVE_INFINITY;
    const existing = replace ? [] : this.items();
    const accepted: UploadItem[] = [];
    for (const file of Array.from(list)) {
      if (existing.length + accepted.length >= cap) break;
      if (!this.accepts(file)) continue;
      const max = this.maxSize();
      if (max != null && file.size > max) continue;
      accepted.push({ id: this.nextId++, file, status: 'ready', progress: 0, ...this.makePreview(file) });
    }
    if (accepted.length === 0) return;

    if (replace) this.items().forEach((i) => this.cleanup(i));
    this.items.set([...existing, ...accepted]);
    this.emit();

    if (this.uploadFn()) accepted.forEach((i) => this.startUpload(i.id));
  }

  private accepts(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type;
    return accept.split(',').some((raw) => {
      const pattern = raw.trim().toLowerCase();
      if (!pattern) return false;
      if (pattern.startsWith('.')) return name.endsWith(pattern);
      if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
      return type === pattern;
    });
  }

  // --- upload -----------------------------------------------------------

  private startUpload(id: number): void {
    const fn = this.uploadFn();
    const item = this.find(id);
    if (!fn || !item) return;
    const controller = new AbortController();
    this.patch(id, { status: 'uploading', progress: 0, controller });
    fn(
      item.file,
      (pct) => this.patch(id, { progress: Math.max(0, Math.min(100, Math.round(pct))) }),
      controller.signal
    )
      .then(() => this.patch(id, { status: 'success', progress: 100 }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : '';
        this.patch(id, msg ? { status: 'error', error: msg } : { status: 'error' });
      });
  }

  protected removeItem(id: number): void {
    const item = this.find(id);
    if (!item) return;
    this.cleanup(item);
    this.items.set(this.items().filter((i) => i.id !== id));
    this.emit();
  }

  // --- helpers ----------------------------------------------------------

  private find(id: number): UploadItem | undefined {
    return this.items().find((i) => i.id === id);
  }

  private patch(id: number, changes: Partial<UploadItem>): void {
    this.items.set(this.items().map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }

  private emit(): void {
    const files = this.items().map((i) => i.file);
    this.value.set(files);
    this.onChange(files);
  }

  private makePreview(file: File): Pick<UploadItem, 'objectUrl' | 'previewUrl'> {
    if (!file.type.startsWith('image/')) return {};
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return {};
    const objectUrl = URL.createObjectURL(file);
    return { objectUrl, previewUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl) };
  }

  private cleanup(item: UploadItem): void {
    item.controller?.abort();
    if (item.objectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(item.objectUrl);
    }
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // --- ControlValueAccessor ---------------------------------------------

  private onChange: (value: File[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    const files =
      Array.isArray(value) && typeof File !== 'undefined'
        ? value.filter((v): v is File => v instanceof File)
        : [];
    this.items().forEach((i) => this.cleanup(i));
    this.items.set(
      files.map((file) => ({ id: this.nextId++, file, status: 'ready' as const, progress: 0, ...this.makePreview(file) }))
    );
    this.value.set(files);
  }
  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
