import { InjectionToken, type Signal } from '@angular/core';

/** Shared context a `ax-carousel` provides to its slides. */
export interface CarouselContext {
  /** Index of the leading visible slide. */
  readonly currentSlide: Signal<number>;
  /** Total number of slides. */
  readonly count: Signal<number>;
  /** How many slides are visible per view. */
  readonly slidesPerView: Signal<number>;
}

export const CAROUSEL_CONTEXT = new InjectionToken<CarouselContext>('CAROUSEL_CONTEXT');
