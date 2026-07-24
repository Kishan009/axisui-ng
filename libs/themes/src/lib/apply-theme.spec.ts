/**
 * Smoke test for the apply-theme helpers.
 * These functions are browser-only (touch document.documentElement),
 * so we run them inside afterNextRender-like guards via a small jsdom setup.
 */

import {
  setIndustry,
  setDensity,
  setTrustTier,
  setDarkMode,
  getStoredTheme,
} from './apply-theme';

describe('apply-theme helpers', () => {
  beforeEach(() => {
    // jsdom is reset between tests
    document.documentElement.removeAttribute('data-industry');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-trust');
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('ax-theme');
    } catch {
      // ignore
    }
  });

  describe('setIndustry', () => {
    it('sets the data-industry attribute', () => {
      setIndustry('banking');
      expect(document.documentElement.getAttribute('data-industry')).toBe('banking');
    });

    it('removes the attribute when given null', () => {
      document.documentElement.setAttribute('data-industry', 'banking');
      setIndustry(null);
      expect(document.documentElement.hasAttribute('data-industry')).toBe(false);
    });
  });

  describe('setDensity', () => {
    it('sets the data-density attribute on document root by default', () => {
      setDensity('compact');
      expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    });

    it('sets the attribute on a provided scope', () => {
      const scope = document.createElement('div');
      document.body.appendChild(scope);
      setDensity('comfortable', scope);
      expect(scope.getAttribute('data-density')).toBe('comfortable');
      expect(document.documentElement.hasAttribute('data-density')).toBe(false);
      document.body.removeChild(scope);
    });
  });

  describe('setTrustTier', () => {
    it('sets the data-trust attribute', () => {
      setTrustTier('regulated');
      expect(document.documentElement.getAttribute('data-trust')).toBe('regulated');
    });
  });

  describe('setDarkMode', () => {
    it('adds the .dark class when enabled', () => {
      setDarkMode(true, false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the .dark class when disabled', () => {
      document.documentElement.classList.add('dark');
      setDarkMode(false, false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists to localStorage when persist=true', () => {
      setDarkMode(true, true);
      expect(localStorage.getItem('ax-theme')).toBe('dark');
      setDarkMode(false, true);
      expect(localStorage.getItem('ax-theme')).toBe('light');
    });
  });

  describe('getStoredTheme', () => {
    it('returns the stored value when set', () => {
      localStorage.setItem('ax-theme', 'dark');
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns null when not set', () => {
      expect(getStoredTheme()).toBeNull();
    });
  });
});
