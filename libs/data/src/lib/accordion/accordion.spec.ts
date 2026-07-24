import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxAccordionComponent } from './accordion.component';
import { AxAccordionItemComponent } from './accordion-item.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxAccordionComponent, AxAccordionItemComponent],
  template: `
    <ax-accordion [type]="type" [collapsible]="true">
      <ax-accordion-item value="a">
        <span axAccordionTrigger>Trigger A</span>
        <div axAccordionContent>Panel A</div>
      </ax-accordion-item>
      <ax-accordion-item value="b">
        <span axAccordionTrigger>Trigger B</span>
        <div axAccordionContent>Panel B</div>
      </ax-accordion-item>
    </ax-accordion>
  `,
})
class HostComponent {
  type: 'single' | 'multiple' = 'single';
}

function triggers(el: HTMLElement) {
  return Array.from(el.querySelectorAll('button[aria-expanded]')) as HTMLButtonElement[];
}

describe('AxAccordionComponent', () => {
  it('starts fully collapsed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(triggers(fixture.nativeElement).every((t) => t.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('opens a panel on trigger click (single)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const [a] = triggers(fixture.nativeElement);
    a.click();
    fixture.detectChanges();
    expect(a.getAttribute('aria-expanded')).toBe('true');
  });

  it('single mode closes the previous when opening another', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const [a, b] = triggers(fixture.nativeElement);
    a.click(); fixture.detectChanges();
    b.click(); fixture.detectChanges();
    expect(a.getAttribute('aria-expanded')).toBe('false');
    expect(b.getAttribute('aria-expanded')).toBe('true');
  });

  it('multiple mode keeps both open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.type = 'multiple';
    fixture.detectChanges();
    const [a, b] = triggers(fixture.nativeElement);
    a.click(); b.click(); fixture.detectChanges();
    expect(a.getAttribute('aria-expanded')).toBe('true');
    expect(b.getAttribute('aria-expanded')).toBe('true');
  });

  it('links each header to a labelled content region (aria-controls / role=region / aria-labelledby)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    triggers(fixture.nativeElement).forEach((button) => {
      const contentId = button.getAttribute('aria-controls');
      expect(contentId).toBeTruthy();
      const region = fixture.nativeElement.querySelector(`#${contentId}`) as HTMLElement;
      expect(region).toBeTruthy();
      expect(region.getAttribute('role')).toBe('region');
      expect(region.getAttribute('aria-labelledby')).toBe(button.id);
      expect(button.id).toBeTruthy();
    });
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
