import { TestBed } from '@angular/core/testing';

import { DemoLayoutService } from './layout.service';

describe('DemoLayoutService', () => {
  let service: DemoLayoutService;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-industry');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-trust');
    localStorage.removeItem('ax-theme');
    localStorage.removeItem('ui-demo-preset');
    localStorage.removeItem('ui-demo-density');
    localStorage.removeItem('ui-demo-trust');

    TestBed.configureTestingModule({ providers: [DemoLayoutService] });
    service = TestBed.inject(DemoLayoutService);
  });

  it('setDark(true) adds .dark on documentElement', () => {
    service.setDark(true);
    expect(service.dark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setPreset writes data-industry', () => {
    service.setPreset('banking');
    expect(service.preset()).toBe('banking');
    expect(document.documentElement.getAttribute('data-industry')).toBe('banking');
  });

  it('setDensity writes data-density', () => {
    service.setDensity('compact');
    expect(service.density()).toBe('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
  });

  it('setTrust writes data-trust', () => {
    service.setTrust('regulated');
    expect(service.trust()).toBe('regulated');
    expect(document.documentElement.getAttribute('data-trust')).toBe('regulated');
  });

  it('openConfigurator toggles configuratorOpen', () => {
    expect(service.configuratorOpen()).toBe(false);
    service.openConfigurator();
    expect(service.configuratorOpen()).toBe(true);
    service.closeConfigurator();
    expect(service.configuratorOpen()).toBe(false);
  });

  it('toggleSidebar opens and closes the sidebar', () => {
    expect(service.sidebarOpen()).toBe(true);
    service.closeSidebar();
    expect(service.sidebarOpen()).toBe(false);
    service.openSidebar();
    expect(service.sidebarOpen()).toBe(true);
    service.toggleSidebar();
    expect(service.sidebarOpen()).toBe(false);
  });
});
