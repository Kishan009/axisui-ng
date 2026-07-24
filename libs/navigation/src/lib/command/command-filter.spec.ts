import { matchesQuery } from './command-filter';

describe('matchesQuery', () => {
  it('matches everything on an empty query', () => {
    expect(matchesQuery({ id: '1', label: 'New File' }, '')).toBe(true);
  });

  it('matches a subsequence of the label', () => {
    expect(matchesQuery({ id: '1', label: 'New File' }, 'nf')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesQuery({ id: '1', label: 'New File' }, 'xyz')).toBe(false);
  });

  it('matches against keywords', () => {
    expect(matchesQuery({ id: '1', label: 'Settings', keywords: ['preferences'] }, 'pref')).toBe(true);
  });
});
