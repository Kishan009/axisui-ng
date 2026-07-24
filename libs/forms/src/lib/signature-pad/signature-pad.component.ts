import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { isEmpty, pointsToPath, strokesToSvg, type SignaturePoint, type SignatureStroke } from './signature-core';

/**
 * Signature pad — an SVG drawable input (CVA). Strokes render as <path>s; pointer
 * drawing uses setPointerCapture (no document listeners, SSR-safe). Ink is
 * currentColor (themes via text-foreground; exported SVG stays portable). Value is
 * an SVG string (default) or a PNG data URL (browser-only). Clear + Undo.
 */
@Component({
  selector: 'ax-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxSignaturePadComponent), multi: true }],
  template: `
    <div class="flex flex-col gap-2">
      <svg
        #surface
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        [attr.width]="width()"
        [attr.height]="height()"
        class="touch-none select-none rounded-md border border-input bg-background text-foreground"
        [class.cursor-crosshair]="!isDisabled()"
        [class.opacity-50]="isDisabled()"
        role="img"
        [attr.aria-label]="ariaLabel() || 'Signature'"
        xmlns="http://www.w3.org/2000/svg"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
      >
        @for (s of strokes(); track $index) {
          <path
            [attr.d]="pathFor(s)"
            fill="none"
            stroke="currentColor"
            [attr.stroke-width]="penWidth()"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
      </svg>
      <div class="flex gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-md border border-input px-2 py-1 text-xs transition-[background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="isDisabled() || empty()"
          (click)="undo()"
        >
          Undo
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-md border border-input px-2 py-1 text-xs transition-[background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="isDisabled() || empty()"
          (click)="clear()"
        >
          Clear
        </button>
      </div>
    </div>
  `,
})
export class AxSignaturePadComponent implements ControlValueAccessor {
  readonly format = input<'svg' | 'png'>('svg');
  readonly penWidth = input(2);
  readonly width = input(320);
  readonly height = input(160);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  protected readonly strokes = signal<SignatureStroke[]>([]);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly empty = computed(() => isEmpty(this.strokes()));

  private readonly surface = viewChild.required<ElementRef<SVGSVGElement>>('surface');
  private readonly platformId = inject(PLATFORM_ID);
  private drawing = false;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected pathFor(s: SignatureStroke): string {
    return pointsToPath(s);
  }

  onPointerDown(e: PointerEvent): void {
    if (this.isDisabled()) return;
    this.drawing = true;
    this.surface().nativeElement.setPointerCapture(e.pointerId);
    this.strokes.update((arr) => [...arr, [this.toLocal(e)]]);
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.drawing) return;
    const p = this.toLocal(e);
    this.strokes.update((arr) => {
      const next = arr.slice();
      const last = next[next.length - 1]!;
      next[next.length - 1] = [...last, p];
      return next;
    });
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    const el = this.surface().nativeElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    this.onTouched();
    this.emit();
  }

  protected undo(): void {
    this.strokes.update((a) => a.slice(0, -1));
    this.emit();
  }

  protected clear(): void {
    this.strokes.set([]);
    this.emit();
  }

  private toLocal(e: PointerEvent): SignaturePoint {
    const rect = this.surface().nativeElement.getBoundingClientRect();
    const sx = rect.width ? this.width() / rect.width : 1;
    const sy = rect.height ? this.height() / rect.height : 1;
    return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy];
  }

  private emit(): void {
    this.onChange(this.serialize());
  }

  private serialize(): string {
    if (this.empty()) return '';
    if (this.format() === 'png') return this.toPng();
    return strokesToSvg(this.strokes(), this.width(), this.height(), this.penWidth());
  }

  private toPng(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    const canvas = document.createElement('canvas');
    canvas.width = this.width();
    canvas.height = this.height();
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.lineWidth = this.penWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(this.surface().nativeElement).color || 'black';
    for (const s of this.strokes()) {
      const head = s[0];
      if (!head) continue;
      ctx.beginPath();
      ctx.moveTo(head[0], head[1]);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i]![0], s[i]![1]);
      ctx.stroke();
    }
    return canvas.toDataURL('image/png');
  }

  // ControlValueAccessor
  writeValue(v: string): void {
    if (!v) this.strokes.set([]);
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.cvaDisabled.set(d);
  }
}
