import { blockStartOf, blocksForRange, missingBlocks, windowRows, needsMore } from './block-cache';

describe('block-cache', () => {
  it('blockStartOf floors to the block boundary', () => {
    expect(blockStartOf(0, 100)).toBe(0);
    expect(blockStartOf(250, 100)).toBe(200);
    expect(blockStartOf(99, 100)).toBe(0);
  });
  it('blockStartOf treats non-positive size as a single block', () => {
    expect(blockStartOf(5, 0)).toBe(0);
  });
  it('blocksForRange returns covering block starts', () => {
    expect(blocksForRange(150, 320, 100)).toEqual([100, 200, 300]);
    expect(blocksForRange(0, 0, 100)).toEqual([]);
    expect(blocksForRange(0, 100, 100)).toEqual([0]);
  });
  it('missingBlocks is the set difference', () => {
    expect(missingBlocks([0, 100, 200], new Set([100]))).toEqual([0, 200]);
    expect(missingBlocks([0], new Set([0]))).toEqual([]);
  });
  it('windowRows assembles cached rows and undefined placeholders', () => {
    // size 2 ⇒ blocks keyed by start index: 0 (rows 0-1) and 4 (rows 4-5)
    const cache = new Map<number, string[]>([[0, ['a', 'b']], [4, ['e', 'f']]]);
    // rows: 0:'a' 1:'b' 2:undef 3:undef 4:'e' 5:'f'
    expect(windowRows(cache, 1, 5, 2)).toEqual(['b', undefined, undefined, 'e']);
  });
  it('needsMore is true within threshold of the loaded end', () => {
    expect(needsMore(300, 100, 40, 10, 3)).toBe(true);   // view bottom 400 == content end
    expect(needsMore(0, 100, 40, 10, 3)).toBe(false);    // top, far from end
    expect(needsMore(0, 100, 40, 0, 3)).toBe(false);     // nothing loaded
  });
});
