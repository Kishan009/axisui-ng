import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

/**
 * AspectRatio — constrains its host to a width/height ratio. Sets the modern
 * `aspect-ratio` CSS property via Renderer2 (SSR-safe; arbitrary ratios can't be
 * Tailwind utilities and `[style.*]` template bindings are disallowed).
 *
 * @example
 * <div [axAspectRatio]="16 / 9"><img class="h-full w-full object-cover" src="…" alt="" /></div>
 */
@Directive({
  selector: '[axAspectRatio]',
  host: { class: 'block overflow-hidden' },
})
export class AxAspectRatioDirective {
  /** width / height ratio. @default 16/9 */
  readonly axAspectRatio = input<number>(16 / 9);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      this.renderer.setStyle(this.host.nativeElement, 'aspect-ratio', String(this.axAspectRatio()));
    });
  }
}
