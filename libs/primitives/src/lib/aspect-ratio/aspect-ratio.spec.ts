import { Component, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AxAspectRatioDirective } from './aspect-ratio.directive';

@Component({
  standalone: true,
  imports: [AxAspectRatioDirective],
  template: `<div [axAspectRatio]="3 / 2" data-testid="box"><img alt="" /></div>`,
})
class HostComponent {}

describe('AxAspectRatio', () => {
  it('sets the aspect-ratio style from the ratio input', () => {
    // jsdom's CSSOM drops the unknown `aspect-ratio` property, so assert the
    // directive applies it via Renderer2 (correct in real browsers).
    const fixture = TestBed.createComponent(HostComponent);
    const box = fixture.debugElement.query(By.css('[data-testid="box"]'));
    const renderer = box.injector.get(Renderer2);
    const setStyle = jest.spyOn(renderer, 'setStyle');
    fixture.detectChanges();
    expect(setStyle).toHaveBeenCalledWith(box.nativeElement, 'aspect-ratio', '1.5');
  });

  it('adds the layout host classes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
    expect(box.className).toContain('block');
    expect(box.className).toContain('overflow-hidden');
  });
});
