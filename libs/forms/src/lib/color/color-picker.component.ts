import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TOKEN_NAMES } from '@axisui-ng/themes';

import {
  formatColor,
  gamutMapChroma,
  isInGamut,
  nearestToken,
  parseColor,
  type ColorFormat,
  type ColorToken,
  type Oklch,
} from './color-core';
import { AxSwatchDirective } from './swatch.directive';

interface TokenInput {
  name: string;
  value: string;
}

const DEFAULT: Oklch = { l: 0.7, c: 0.15, h: 250, alpha: 1 };

/**
 * OKLCH color picker — L/C/H(+alpha) sliders over a perceptual space, gamut-aware
 * (chroma mapped to the sRGB boundary, with an indicator), with a theme-token
 * palette and snap-to-nearest. Inline panel; compose inside a ax-popover for a
 * trigger. ControlValueAccessor over a color string serialized per `format`.
 */
@Component({
  selector: 'ax-color-picker',
  standalone: true,
  imports: [AxSwatchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': "ariaLabel() || 'Color picker'" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxColorPickerComponent), multi: true }],
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 shrink-0 rounded-md border border-border" [axSwatch]="swatchColor()"></div>
        <input
          type="text"
          class="min-w-0 grow rounded-md border border-input bg-background px-2 py-1 text-sm transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          [value]="text()"
          [disabled]="isDisabled()"
          (change)="onText($event)"
          aria-label="Color value"
        />
        @if (!inGamut()) {
          <span class="shrink-0 text-xs text-warning" role="status">out of gamut — clamped</span>
        }
      </div>

      <label class="flex items-center gap-2 text-xs">
        <span class="w-4">L</span>
        <span class="relative h-4 grow rounded" [axSwatch]="lTrack()">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            class="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
            [value]="raw().l * 100"
            [disabled]="isDisabled()"
            (input)="onChannel('l', $event)"
            aria-label="Lightness"
          />
        </span>
        <span class="w-10 text-end tabular-nums">{{ (raw().l * 100).toFixed(0) }}%</span>
      </label>

      <label class="flex items-center gap-2 text-xs">
        <span class="w-4">C</span>
        <span class="relative h-4 grow rounded" [axSwatch]="cTrack()">
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.001"
            class="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
            [value]="raw().c"
            [disabled]="isDisabled()"
            (input)="onChannel('c', $event)"
            aria-label="Chroma"
          />
        </span>
        <span class="w-10 text-end tabular-nums">{{ raw().c.toFixed(3) }}</span>
      </label>

      <label class="flex items-center gap-2 text-xs">
        <span class="w-4">H</span>
        <span class="relative h-4 grow rounded" [axSwatch]="hTrack()">
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            class="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
            [value]="raw().h"
            [disabled]="isDisabled()"
            (input)="onChannel('h', $event)"
            aria-label="Hue"
          />
        </span>
        <span class="w-10 text-end tabular-nums">{{ raw().h.toFixed(0) }}</span>
      </label>

      @if (alpha()) {
        <label class="flex items-center gap-2 text-xs">
          <span class="w-4">A</span>
          <span class="relative h-4 grow rounded" [axSwatch]="alphaTrack()">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              class="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
              [value]="raw().alpha * 100"
              [disabled]="isDisabled()"
              (input)="onChannel('alpha', $event)"
              aria-label="Alpha"
            />
          </span>
          <span class="w-10 text-end tabular-nums">{{ (raw().alpha * 100).toFixed(0) }}%</span>
        </label>
      }

      @if (showTokens()) {
        <div class="flex items-center gap-2">
          <div class="flex flex-wrap gap-1" role="group" aria-label="Theme colors">
            @for (t of effectiveTokens(); track t.name) {
              <!-- Touch target (S3): swatch stays 20px; ::before expands pressable area to ≥44px. -->
              <button
                type="button"
                class="relative h-5 w-5 cursor-pointer rounded border border-border before:absolute before:inset-[-12px] before:content-[''] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-out-quart hover:ring-2 hover:ring-ring active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                [axSwatch]="t.value"
                [disabled]="isDisabled()"
                [attr.aria-label]="t.name"
                [title]="t.name"
                (click)="pickToken(t)"
              ></button>
            }
          </div>
          <button
            type="button"
            class="ms-auto cursor-pointer rounded-md border border-input px-2 py-1 text-xs transition-[background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="isDisabled() || !effectiveTokens().length"
            (click)="snap()"
          >
            Snap to token
          </button>
        </div>
      }
    </div>
  `,
})
export class AxColorPickerComponent implements ControlValueAccessor {
  readonly value = model<string>('');
  readonly format = input<ColorFormat>('oklch');
  readonly alpha = input(false, { transform: booleanAttribute });
  readonly showTokens = input(true, { transform: booleanAttribute });
  readonly tokens = input<TokenInput[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  protected readonly raw = signal<Oklch>(DEFAULT);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeTokens = signal<TokenInput[]>([]);
  private lastEmitted = '';
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly inGamut = computed(() => isInGamut(this.raw()));
  protected readonly mapped = computed(() => gamutMapChroma(this.withAlpha(this.raw())));
  protected readonly swatchColor = computed(() => formatColor(this.mapped(), 'oklch'));
  protected readonly text = computed(() => formatColor(this.mapped(), this.format()));

  protected readonly effectiveTokens = computed<ColorToken[]>(() => {
    const src = this.tokens().length ? this.tokens() : this.themeTokens();
    return src.flatMap((t) => {
      const ok = parseColor(t.value);
      return ok ? [{ name: t.name, value: t.value, oklch: ok }] : [];
    });
  });

  protected readonly lTrack = computed(() => {
    const { c, h } = this.raw();
    return `linear-gradient(to right, oklch(0 ${c} ${h}), oklch(0.5 ${c} ${h}), oklch(1 ${c} ${h}))`;
  });
  protected readonly cTrack = computed(() => {
    const { l, h } = this.raw();
    return `linear-gradient(to right, oklch(${l} 0 ${h}), oklch(${l} 0.4 ${h}))`;
  });
  protected readonly hTrack = computed(() => {
    const { l, c } = this.raw();
    const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => `oklch(${l} ${c} ${h})`).join(', ');
    return `linear-gradient(to right, ${stops})`;
  });
  protected readonly alphaTrack = computed(() => {
    const { l, c, h } = this.raw();
    return `linear-gradient(to right, transparent, oklch(${l} ${c} ${h}))`;
  });

  constructor() {
    // External value → raw (skip our own emissions to avoid a loop).
    effect(() => {
      const v = this.value();
      if (v && v !== this.lastEmitted) {
        const p = parseColor(v);
        if (p) this.raw.set(p);
      }
    });

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const styles = getComputedStyle(document.documentElement);
      const toks: TokenInput[] = [];
      for (const name of TOKEN_NAMES) {
        if (!name.startsWith('--color-')) continue;
        const value = styles.getPropertyValue(name).trim();
        if (value) toks.push({ name, value });
      }
      this.themeTokens.set(toks);
    });
  }

  protected onChannel(ch: 'l' | 'c' | 'h' | 'alpha', e: Event): void {
    const v = +(e.target as HTMLInputElement).value;
    const next = ch === 'l' ? v / 100 : ch === 'alpha' ? v / 100 : v;
    this.raw.update((r) => ({ ...r, [ch]: next }));
    this.commit();
  }

  protected onText(e: Event): void {
    const p = parseColor((e.target as HTMLInputElement).value);
    if (p) {
      this.raw.set(p);
      this.commit();
    }
  }

  protected pickToken(t: ColorToken): void {
    this.raw.set({ ...t.oklch, alpha: this.alpha() ? t.oklch.alpha : 1 });
    this.commit();
  }

  protected snap(): void {
    const t = nearestToken(this.raw(), this.effectiveTokens());
    if (t) this.pickToken(t);
  }

  private withAlpha(c: Oklch): Oklch {
    return this.alpha() ? c : { ...c, alpha: 1 };
  }

  private commit(): void {
    const out = formatColor(this.mapped(), this.format());
    this.lastEmitted = out;
    this.value.set(out);
    this.onChange(out);
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(v: string): void {
    const p = v ? parseColor(v) : null;
    if (p) {
      this.raw.set(p);
      this.lastEmitted = v;
    }
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
