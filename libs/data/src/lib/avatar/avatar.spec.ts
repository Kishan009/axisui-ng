import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxAvatarComponent } from './avatar.component';
import { AxAvatarGroupComponent } from './avatar-group.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxAvatarComponent],
  template: `<ax-avatar [src]="src" [alt]="alt" [initials]="initials" />`,
})
class HostComponent {
  src: string | null = null;
  alt = 'Jane Doe';
  initials: string | null = 'JD';
}

describe('AxAvatarComponent', () => {
  it('shows initials when no src', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('JD');
  });

  it('renders an img when src is provided', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.src = 'https://example.com/a.png';
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('Jane Doe');
  });

  it('falls back to the user icon when no src and no initials', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.initials = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ax-icon')).toBeTruthy();
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.src = 'https://example.com/a.png';
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [AxAvatarComponent, AxAvatarGroupComponent],
  template: `
    <ax-avatar-group [max]="max">
      <ax-avatar initials="AB" />
      <ax-avatar initials="CD" />
      <ax-avatar initials="EF" />
      <ax-avatar initials="GH" />
      <ax-avatar initials="IJ" />
    </ax-avatar-group>
  `,
})
class GroupHostComponent {
  max = 0;
}

describe('AxAvatarGroupComponent', () => {
  it('shows all avatars and no remainder when max is 0', () => {
    const fixture = TestBed.createComponent(GroupHostComponent);
    fixture.detectChanges();
    const avatars = fixture.nativeElement.querySelectorAll('ax-avatar');
    expect(avatars).toHaveLength(5);
    const visible = [...avatars].filter((a) => (a as HTMLElement).style.display !== 'none');
    expect(visible).toHaveLength(5);
    expect(fixture.nativeElement.textContent).not.toContain('+');
  });

  it('hides the overflow and shows a +N remainder chip', () => {
    const fixture = TestBed.createComponent(GroupHostComponent);
    fixture.componentInstance.max = 3;
    fixture.detectChanges();
    const avatars = [...fixture.nativeElement.querySelectorAll('ax-avatar')] as HTMLElement[];
    const hidden = avatars.filter((a) => a.style.display === 'none');
    expect(hidden).toHaveLength(2);
    const chip = fixture.nativeElement.querySelector('[aria-label="2 more"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('+2');
  });
});
