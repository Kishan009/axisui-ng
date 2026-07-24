import { collapse, expand, normalizeSizes, resize, snapThreshold } from './splitter-core';

const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);

describe('splitter-core', () => {
  describe('normalizeSizes', () => {
    it('splits equally when all undefined', () => {
      expect(normalizeSizes([undefined, undefined, undefined], 3)).toEqual([100 / 3, 100 / 3, 100 / 3]);
    });
    it('fills the remainder across undefined panels', () => {
      expect(normalizeSizes([60, undefined], 2)).toEqual([60, 40]);
    });
    it('always sums to 100', () => {
      expect(sum(normalizeSizes([10, 10, 10], 3))).toBeCloseTo(100, 6);
    });
    it('returns [] for count 0', () => {
      expect(normalizeSizes([], 0)).toEqual([]);
    });
  });

  describe('resize', () => {
    it('moves the boundary, conserving the pair total', () => {
      expect(resize([50, 50], 0, 10, [0, 0], [100, 100])).toEqual([60, 40]);
    });
    it('clamps to the growing panel max', () => {
      expect(resize([50, 50], 0, 40, [0, 0], [70, 100])).toEqual([70, 30]);
    });
    it('clamps to the shrinking panel min', () => {
      expect(resize([50, 50], 0, 40, [0, 20], [100, 100])).toEqual([80, 20]);
    });
    it('is a no-op at an out-of-range boundary', () => {
      expect(resize([50, 50], 5, 10, [0, 0], [100, 100])).toEqual([50, 50]);
    });
    it('keeps the total at 100 after a move', () => {
      expect(sum(resize([30, 30, 40], 1, 15, [0, 0, 0], [100, 100, 100]))).toBeCloseTo(100, 6);
    });
  });

  describe('collapse / expand', () => {
    it('collapse gives the freed space to the next sibling', () => {
      expect(collapse([50, 50], 0, 0)).toEqual([0, 100]);
    });
    it('expand restores from the next sibling', () => {
      expect(expand([0, 100], 0, 50)).toEqual([50, 50]);
    });
    it('collapse of the last panel feeds the previous sibling', () => {
      expect(collapse([40, 60], 1, 0)).toEqual([100, 0]);
    });
  });

  describe('snapThreshold', () => {
    it('snaps to collapsedSize below the threshold', () => {
      expect(snapThreshold(3, 0, 5)).toBe(0);
    });
    it('passes the value through at or above the threshold', () => {
      expect(snapThreshold(8, 0, 5)).toBe(8);
    });
  });
});
