import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCardComponent } from './card.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCardComponent],
  template: `
    <ax-card>
      <div axCardHeader>Header</div>
      <div axCardContent>Body</div>
      <div axCardFooter>Footer</div>
    </ax-card>
  `,
})
class HostComponent {}

describe('AxCardComponent', () => {
  it('projects all three slots', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Header');
    expect(text).toContain('Body');
    expect(text).toContain('Footer');
  });

  it('renders a bordered card container', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.ax-card') as HTMLElement;
    expect(card.className).toContain('border');
    expect(card.className).toContain('bg-card');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
