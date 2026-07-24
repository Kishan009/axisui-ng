import { pageList } from './page-list';

describe('pageList', () => {
  it('lists every page when the count is small', () => {
    expect(pageList(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows a right ellipsis near the start', () => {
    expect(pageList(1, 20, 1)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('shows both ellipses in the middle', () => {
    expect(pageList(10, 20, 1)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });

  it('shows a left ellipsis near the end', () => {
    expect(pageList(20, 20, 1)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });
});
