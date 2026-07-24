import { TestBed } from '@angular/core/testing';

import { DemoLayoutService } from './layout.service';

describe('DemoLayoutComponent (smoke)', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-industry');
    document.documentElement.removeAttribute('data-density');

    TestBed.configureTestingModule({ providers: [DemoLayoutService] });
  });

  it('applies theme attrs via DemoLayoutService', () => {
    const layout = TestBed.inject(DemoLayoutService);
    layout.setDark(true);
    layout.setPreset('healthcare');
    layout.setDensity('compact');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-industry')).toBe('healthcare');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
  });
});
