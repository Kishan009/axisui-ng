/**
 * AxCarouselComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) on the rendered host element. Autoplay is disabled in
 * behaviour tests; scroll positioning is a no-op under jsdom (no layout), so
 * navigation is asserted via the `currentSlide` model. Run twice (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCarouselComponent } from './carousel.component';
import { AxCarouselSlideComponent } from './carousel-slide.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCarouselComponent, AxCarouselSlideComponent],
  template: `
    <ax-carousel [autoplay]="autoplay()" [loop]="loop()" [slidesPerView]="spv()" ariaLabel="Demo">
      <ax-carousel-slide>One</ax-carousel-slide>
      <ax-carousel-slide>Two</ax-carousel-slide>
      <ax-carousel-slide>Three</ax-carousel-slide>
      <ax-carousel-slide>Four</ax-carousel-slide>
    </ax-carousel>
  `,
})
class HostComponent {
  loop = signal(false);
  spv = signal(1);
  autoplay = signal(false);
}

interface Harness {
  fixture: ComponentFixture<HostComponent>;
  host: HostComponent;
  el: HTMLElement;
  carousel: AxCarouselComponent;
}

function setup(configure?: (h: HostComponent) => void): Harness {
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  const carousel = fixture.debugElement.query(By.directive(AxCarouselComponent))
    .componentInstance as AxCarouselComponent;
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement, carousel };
}

const slides = (el: HTMLElement) => Array.from(el.querySelectorAll('ax-carousel-slide')) as HTMLElement[];
const dots = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('button[aria-label^="Go to slide"]')) as HTMLButtonElement[];
const arrow = (el: HTMLElement, label: string) =>
  el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;

describe('AxCarousel', () => {
  it('renders a labelled carousel region', () => {
    const el = setup().el.querySelector('ax-carousel') as HTMLElement;
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-roledescription')).toBe('carousel');
    expect(el.getAttribute('aria-label')).toBe('Demo');
  });

  it('labels each slide with its position', () => {
    const s = slides(setup().el);
    expect(s.length).toBe(4);
    expect(s[0].getAttribute('aria-roledescription')).toBe('slide');
    expect(s.map((x) => x.getAttribute('aria-label'))).toEqual(['1 of 4', '2 of 4', '3 of 4', '4 of 4']);
  });

  it('next()/previous() move currentSlide and clamp at the ends', () => {
    const { fixture, carousel } = setup();
    carousel.next();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(1);
    carousel.goTo(99);
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(3); // maxIndex = count - slidesPerView
    carousel.next();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(3); // clamped, no loop
    carousel.goTo(0);
    carousel.previous();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(0);
  });

  it('loops past the ends when loop is set', () => {
    const { fixture, carousel } = setup((h) => h.loop.set(true));
    carousel.previous();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(3); // wrapped from 0 → maxIndex
    carousel.next();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(0); // wrapped from maxIndex → 0
  });

  it('renders one indicator dot per page and reflects slidesPerView', () => {
    expect(dots(setup().el).length).toBe(4); // spv 1 → maxIndex 3 → 4 dots
    expect(dots(setup((h) => h.spv.set(2)).el).length).toBe(3); // spv 2 → maxIndex 2 → 3 dots
  });

  it('clicking an indicator goes to that slide', () => {
    const { fixture, el, carousel } = setup();
    dots(el)[2].click();
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(2);
  });

  it('arrow keys navigate', () => {
    const { fixture, el, carousel } = setup();
    el.querySelector('ax-carousel')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(carousel.currentSlide()).toBe(1);
  });

  it('disables the arrows at the ends without loop', () => {
    const { fixture, el, carousel } = setup();
    expect(arrow(el, 'Previous slide')!.disabled).toBe(true);
    expect(arrow(el, 'Next slide')!.disabled).toBe(false);
    carousel.goTo(3);
    fixture.detectChanges();
    expect(arrow(el, 'Next slide')!.disabled).toBe(true);
  });

  it('does not auto-advance when autoplay is off', () => {
    expect(setup().carousel.currentSlide()).toBe(0);
  });

  it('renders a pause/play control when autoplay is on and toggles it (WCAG 2.2.2)', () => {
    const { fixture, el } = setup((h) => h.autoplay.set(true));
    const btn = () => el.querySelector('button[aria-pressed]') as HTMLButtonElement;
    expect(btn()).toBeTruthy();
    expect(btn().getAttribute('aria-label')).toBe('Pause carousel');
    expect(btn().getAttribute('aria-pressed')).toBe('false');
    btn().click();
    fixture.detectChanges();
    expect(btn().getAttribute('aria-label')).toBe('Play carousel');
    expect(btn().getAttribute('aria-pressed')).toBe('true');
  });

  it('shows no pause/play control when autoplay is off', () => {
    expect(setup().el.querySelector('button[aria-pressed]')).toBeNull();
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().el)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const { el } = setup();
      (el.querySelector('ax-carousel') as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(el)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const { el } = setup();
      (el.querySelector('ax-carousel') as HTMLElement).classList.add('dark');
      expect(await axe(el)).toHaveNoViolations();
    });
  });
});
