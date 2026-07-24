/**
 * Carousel — a horizontally scroll-snapping slide container with arrows, dot
 * indicators, keyboard nav, and (default-on) autoplay. Built on native CSS
 * scroll-snap: touch/swipe works for free and there are no JS transforms, so it
 * is SSR-safe. Supports multiple slides per view via `slidesPerView`.
 *
 * @example
 * <ax-carousel [slidesPerView]="1" ariaLabel="Highlights">
 *   <ax-carousel-slide>…</ax-carousel-slide>
 *   <ax-carousel-slide>…</ax-carousel-slide>
 * </ax-carousel>
 */
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import { AxCarouselSlideComponent } from './carousel-slide.component';
import { CAROUSEL_CONTEXT, type CarouselContext } from './carousel.types';

@Component({
  selector: 'ax-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  providers: [{ provide: CAROUSEL_CONTEXT, useExisting: forwardRef(() => AxCarouselComponent) }],
  host: {
    class: 'relative block',
    '[attr.role]': "'region'",
    '[attr.aria-roledescription]': "'carousel'",
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': 'onKeydown($event)',
    '(pointerenter)': 'pauseAutoplay()',
    '(pointerleave)': 'resumeAutoplay()',
    '(focusin)': 'pauseAutoplay()',
    '(focusout)': 'resumeAutoplay()',
  },
  template: `
    <div
      #viewport
      class="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      [attr.aria-live]="autoplay() ? 'off' : 'polite'"
      (scroll)="onScroll()"
    >
      <ng-content />
    </div>

    @if (autoplay() && count() > slidesPerView()) {
      <button
        type="button"
        class="absolute end-2 top-2 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-background active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        [attr.aria-label]="userPaused() ? 'Play carousel' : 'Pause carousel'"
        [attr.aria-pressed]="userPaused()"
        (click)="toggleAutoplay()"
      >
        @if (userPaused()) {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        } @else {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        }
      </button>
    }

    @if (showArrows() && count() > slidesPerView()) {
      <button
        type="button"
        class="absolute start-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-background active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous slide"
        [disabled]="!loop() && currentSlide() <= 0"
        (click)="previous()"
      >
        <ax-icon name="chevron-left" [size]="18" />
      </button>
      <button
        type="button"
        class="absolute end-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-background active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next slide"
        [disabled]="!loop() && currentSlide() >= maxIndex()"
        (click)="next()"
      >
        <ax-icon name="chevron-right" [size]="18" />
      </button>
    }

    @if (showIndicators() && count() > slidesPerView()) {
      <div class="mt-3 flex justify-center gap-2">
        @for (dot of dots(); track dot) {
          <button
            type="button"
            [class]="dotClasses(dot)"
            [attr.aria-label]="'Go to slide ' + (dot + 1)"
            [attr.aria-current]="dot === currentSlide() ? 'true' : null"
            (click)="goTo(dot)"
          ></button>
        }
      </div>
    }
  `,
})
export class AxCarouselComponent implements CarouselContext {
  /** Slides visible per view (1–4 styled; others fall back to full width). @default 1 */
  readonly slidesPerView = input<number>(1);
  /** Wrap past the ends with the arrows. @default false */
  readonly loop = input<boolean>(false);
  /** Auto-advance. @default true */
  readonly autoplay = input<boolean>(true);
  /** Autoplay interval (ms). @default 5000 */
  readonly interval = input<number>(5000);
  /** Show prev/next arrows. @default true */
  readonly showArrows = input<boolean>(true);
  /** Show dot indicators. @default true */
  readonly showIndicators = input<boolean>(true);
  /** Accessible label for the carousel region. */
  readonly ariaLabel = input<string>('');

  /** Leading visible slide index (two-way). @default 0 */
  readonly currentSlide = model<number>(0);

  private readonly slides = contentChildren(AxCarouselSlideComponent);
  readonly count = computed(() => this.slides().length);

  /** Highest reachable leading index. */
  protected readonly maxIndex = computed(() => Math.max(0, this.count() - this.slidesPerView()));
  /** Indicator dot indices. */
  protected readonly dots = computed(() => Array.from({ length: this.maxIndex() + 1 }, (_, i) => i));

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly platformId = inject(PLATFORM_ID);
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Transient pause from hover/focus. */
  private paused = false;
  /** Explicit pause from the pause/play control — persists across hover/focus. */
  protected readonly userPaused = signal(false);

  constructor() {
    effect(() => {
      this.slides().forEach((s, i) => s.index.set(i));
    });
    afterNextRender(() => this.maybeStartAutoplay());
    inject(DestroyRef).onDestroy(() => this.stopAutoplay());
  }

  // --- nav --------------------------------------------------------------

  next(): void {
    if (this.currentSlide() >= this.maxIndex()) {
      if (this.loop()) this.goTo(0);
      return;
    }
    this.goTo(this.currentSlide() + 1);
  }

  previous(): void {
    if (this.currentSlide() <= 0) {
      if (this.loop()) this.goTo(this.maxIndex());
      return;
    }
    this.goTo(this.currentSlide() - 1);
  }

  goTo(index: number): void {
    const target = Math.min(this.maxIndex(), Math.max(0, index));
    this.currentSlide.set(target);
    const vp = this.viewport()?.nativeElement;
    if (!vp) return;
    const left = (vp.clientWidth / this.slidesPerView()) * target;
    if (typeof vp.scrollTo === 'function') vp.scrollTo({ left, behavior: 'smooth' });
    else vp.scrollLeft = left;
  }

  protected onScroll(): void {
    const vp = this.viewport()?.nativeElement;
    if (!vp) return;
    const slideWidth = vp.clientWidth / this.slidesPerView();
    if (slideWidth <= 0) return;
    const idx = Math.min(this.maxIndex(), Math.max(0, Math.round(vp.scrollLeft / slideWidth)));
    if (idx !== this.currentSlide()) this.currentSlide.set(idx);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  // --- autoplay ---------------------------------------------------------

  private maybeStartAutoplay(): void {
    this.stopAutoplay();
    if (this.paused || this.userPaused() || !this.autoplay() || this.count() <= this.slidesPerView()) return;
    if (this.prefersReducedMotion()) return;
    this.timer = setInterval(() => this.autoAdvance(), this.interval());
  }

  /** User-facing pause/play toggle (WCAG 2.2.2). Persists across hover/focus. */
  protected toggleAutoplay(): void {
    this.userPaused.update((p) => !p);
    if (this.userPaused()) this.stopAutoplay();
    else this.maybeStartAutoplay();
  }

  protected pauseAutoplay(): void {
    this.paused = true;
    this.stopAutoplay();
  }

  protected resumeAutoplay(): void {
    this.paused = false;
    this.maybeStartAutoplay();
  }

  private stopAutoplay(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private autoAdvance(): void {
    if (this.currentSlide() >= this.maxIndex()) this.goTo(0);
    else this.goTo(this.currentSlide() + 1);
  }

  private prefersReducedMotion(): boolean {
    if (!isPlatformBrowser(this.platformId) || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- classes ----------------------------------------------------------

  protected dotClasses(dot: number): string {
    return cn(
      // Visual dot stays 8px; ::before expands the pressable area toward 44px without changing gutter.
      "relative h-2 w-2 cursor-pointer rounded-full before:absolute before:content-[''] before:-inset-4",
      'transition-[color,background-color,width] duration-[var(--duration-fast)] ease-out-quart',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      dot === this.currentSlide() ? 'w-4 bg-primary' : 'bg-muted hover:bg-muted-foreground/40'
    );
  }
}
