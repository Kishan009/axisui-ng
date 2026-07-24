import { resolveKeys } from './kbd.tokens';

describe('resolveKeys', () => {
  it('maps "mod" to ⌘/Command on mac', () => {
    expect(resolveKeys('mod', 'mac')).toEqual([{ display: '⌘', label: 'Command' }]);
  });

  it('maps "mod" to Ctrl/Control on other platforms', () => {
    expect(resolveKeys('mod', 'other')).toEqual([{ display: 'Ctrl', label: 'Control' }]);
  });

  it('splits a "+"-joined string into multiple keys', () => {
    const result = resolveKeys('mod+shift+k', 'mac');
    expect(result.map((r) => r.display)).toEqual(['⌘', '⇧', 'K']);
  });

  it('accepts an array of tokens', () => {
    const result = resolveKeys(['ctrl', 'alt', 'del'], 'other');
    expect(result.map((r) => r.display)).toEqual(['Ctrl', 'Alt', 'Del']);
  });

  it('is case-insensitive for known tokens', () => {
    expect(resolveKeys('MOD', 'mac')[0].display).toBe('⌘');
    expect(resolveKeys('Shift', 'mac')[0].display).toBe('⇧');
  });

  it('passes unknown tokens through uppercased (display === label)', () => {
    expect(resolveKeys('k', 'mac')).toEqual([{ display: 'K', label: 'K' }]);
  });

  it('ignores empty tokens and trims whitespace', () => {
    expect(resolveKeys('mod + k', 'mac').map((r) => r.display)).toEqual(['⌘', 'K']);
    expect(resolveKeys('mod++k', 'mac').map((r) => r.display)).toEqual(['⌘', 'K']);
  });
});
