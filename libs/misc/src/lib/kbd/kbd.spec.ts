import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxKbdComponent } from './kbd.component';
import { KBD_PLATFORM, type KbdPlatform } from './kbd.tokens';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxKbdComponent],
  template: `
    <ax-kbd [keys]="combo"></ax-kbd>
    <ax-kbd>Esc</ax-kbd>
  `,
})
class HostComponent {
  combo: string | string[] = 'mod+shift+k';
}

function setup(platform: KbdPlatform) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [{ provide: KBD_PLATFORM, useValue: platform }],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture;
}

describe('AxKbd', () => {
  it('renders one <kbd> per resolved key', () => {
    const fixture = setup('mac');
    const first = fixture.nativeElement.querySelector('ax-kbd');
    expect(first.querySelectorAll('kbd').length).toBe(3);
  });

  it('resolves "mod" to ⌘/Command on mac', () => {
    const fixture = setup('mac');
    const firstCap = fixture.nativeElement.querySelector('ax-kbd kbd');
    expect(firstCap.textContent.trim()).toBe('⌘');
    expect(firstCap.getAttribute('aria-label')).toBe('Command');
  });

  it('resolves "mod" to Ctrl/Control on other platforms', () => {
    const fixture = setup('other');
    const firstCap = fixture.nativeElement.querySelector('ax-kbd kbd');
    expect(firstCap.textContent.trim()).toBe('Ctrl');
    expect(firstCap.getAttribute('aria-label')).toBe('Control');
  });

  it('falls back to projected content when no keys given', () => {
    const fixture = setup('mac');
    const kbds = fixture.nativeElement.querySelectorAll('ax-kbd');
    const projected = kbds[1].querySelectorAll('kbd');
    expect(projected.length).toBe(1);
    expect(projected[0].textContent.trim()).toBe('Esc');
  });

  it('has no a11y violations', async () => {
    const fixture = setup('mac');
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
