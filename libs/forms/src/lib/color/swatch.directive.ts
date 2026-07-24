import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

/**
 * Sets the host's CSS `background` to an arbitrary color/gradient string via
 * Renderer2 (SSR-safe; arbitrary dynamic colors cannot be Tailwind utilities and
 * `[style.*]` template bindings are disallowed). Used for the preview swatch,
 * slider gradient tracks, and token swatches.
 */
@Directive({
  selector: '[axSwatch]',
  standalone: true,
})
export class AxSwatchDirective {
  /** Any valid CSS `background` value (e.g. `oklch(0.7 0.1 250)` or a linear-gradient). */
  readonly axSwatch = input<string>('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      this.renderer.setStyle(this.host.nativeElement, 'background', this.axSwatch());
    });
  }
}
