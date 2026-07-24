import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Platform family used to resolve modifier glyphs. */
export type KbdPlatform = 'mac' | 'other';

/** A resolved keycap: the glyph to display and its screen-reader name. */
export interface KbdKey {
  /** Glyph or short text shown in the keycap (e.g. '⌘', 'Ctrl', 'K'). */
  display: string;
  /** Accessible name announced for the keycap (e.g. 'Command', 'K'). */
  label: string;
}

interface KbdMapEntry {
  mac: KbdKey;
  other: KbdKey;
}

const k = (display: string, label: string): KbdKey => ({ display, label });

/** Modifier + named-key map. Keys are lowercase tokens. */
const KEY_MAP: Record<string, KbdMapEntry> = {
  mod: { mac: k('⌘', 'Command'), other: k('Ctrl', 'Control') },
  meta: { mac: k('⌘', 'Command'), other: k('Win', 'Windows') },
  cmd: { mac: k('⌘', 'Command'), other: k('Win', 'Windows') },
  command: { mac: k('⌘', 'Command'), other: k('Win', 'Windows') },
  ctrl: { mac: k('⌃', 'Control'), other: k('Ctrl', 'Control') },
  control: { mac: k('⌃', 'Control'), other: k('Ctrl', 'Control') },
  alt: { mac: k('⌥', 'Option'), other: k('Alt', 'Alt') },
  option: { mac: k('⌥', 'Option'), other: k('Alt', 'Alt') },
  shift: { mac: k('⇧', 'Shift'), other: k('⇧', 'Shift') },
  enter: { mac: k('↵', 'Enter'), other: k('↵', 'Enter') },
  return: { mac: k('↵', 'Enter'), other: k('↵', 'Enter') },
  esc: { mac: k('Esc', 'Escape'), other: k('Esc', 'Escape') },
  escape: { mac: k('Esc', 'Escape'), other: k('Esc', 'Escape') },
  tab: { mac: k('Tab', 'Tab'), other: k('Tab', 'Tab') },
  backspace: { mac: k('⌫', 'Backspace'), other: k('⌫', 'Backspace') },
  delete: { mac: k('Del', 'Delete'), other: k('Del', 'Delete') },
  del: { mac: k('Del', 'Delete'), other: k('Del', 'Delete') },
  up: { mac: k('↑', 'Up arrow'), other: k('↑', 'Up arrow') },
  down: { mac: k('↓', 'Down arrow'), other: k('↓', 'Down arrow') },
  left: { mac: k('←', 'Left arrow'), other: k('←', 'Left arrow') },
  right: { mac: k('→', 'Right arrow'), other: k('→', 'Right arrow') },
};

/** Split a raw `keys` input into individual trimmed, non-empty tokens. */
function tokenize(keys: string | string[]): string[] {
  const list = Array.isArray(keys) ? keys : keys.split('+');
  return list.map((t) => t.trim()).filter((t) => t.length > 0);
}

/**
 * Resolve a `keys` input into display keycaps for the given platform. Known
 * modifier/named tokens map to glyphs; unknown tokens pass through uppercased
 * (display === label).
 */
export function resolveKeys(keys: string | string[], platform: KbdPlatform): KbdKey[] {
  return tokenize(keys).map((token) => {
    const entry = KEY_MAP[token.toLowerCase()];
    if (entry) return entry[platform];
    const upper = token.toUpperCase();
    return k(upper, upper);
  });
}

/**
 * Injectable platform family for Kbd. Browser-detected, SSR-safe (defaults to
 * 'other' off-browser). Override in tests via TestBed providers.
 */
export const KBD_PLATFORM = new InjectionToken<KbdPlatform>('KBD_PLATFORM', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return 'other';
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const probe = nav?.platform || nav?.userAgent || '';
    return /mac|iphone|ipad|ipod/i.test(probe) ? 'mac' : 'other';
  },
});
