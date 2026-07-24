/**
 * CarouselSlide — one slide of a `ax-carousel`. Scroll-snaps within the
 * viewport; its flex-basis comes from the carousel's `slidesPerView`.
 *
 * @example <ax-carousel-slide>…content…</ax-carousel-slide>
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { cn } from '../_utils/cn';
import { CAROUSEL_CONTEXT } from './carousel.types';

const BASIS: Record<number, string> = {
  1: 'basis-full',
  2: 'basis-1/2',
  3: 'basis-1/3',
  4: 'basis-1/4',
};

@Component({
  selector: 'ax-carousel-slide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.role]': "'group'",
    '[attr.aria-roledescription]': "'slide'",
    '[attr.aria-label]': 'label()',
  },
  template: '<ng-content />',
})
export class AxCarouselSlideComponent {
  /** 0-based position, assigned by the parent carousel. */
  readonly index = signal<number>(-1);

  private readonly ctx = inject(CAROUSEL_CONTEXT);

  protected readonly classes = computed(() =>
    cn('min-w-0 shrink-0 snap-start', BASIS[this.ctx.slidesPerView()] ?? 'basis-full')
  );

  protected readonly label = computed(() => `${this.index() + 1} of ${this.ctx.count()}`);
}
