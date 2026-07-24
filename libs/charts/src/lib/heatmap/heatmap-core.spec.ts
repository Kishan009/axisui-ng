import { binIndex, matrixExtent, normalize } from './heatmap-core';

describe('heatmap-core', () => {
  describe('matrixExtent', () => {
    it('finds min/max across rows', () => {
      expect(matrixExtent([[0, 10], [5, 3]])).toEqual({ min: 0, max: 10 });
    });
    it('empty → 0/0', () => {
      expect(matrixExtent([])).toEqual({ min: 0, max: 0 });
    });
  });

  describe('normalize', () => {
    it('maps within range to 0..1', () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
    });
    it('equal extent → 0', () => {
      expect(normalize(5, 5, 5)).toBe(0);
    });
    it('clamps out-of-range', () => {
      expect(normalize(-1, 0, 10)).toBe(0);
      expect(normalize(20, 0, 10)).toBe(1);
    });
  });

  describe('binIndex', () => {
    it('buckets 0..1 into 1..bins', () => {
      expect(binIndex(0, 5)).toBe(1);
      expect(binIndex(0.5, 5)).toBe(3);
      expect(binIndex(1, 5)).toBe(5);
    });
    it('clamps to [1, bins]', () => {
      expect(binIndex(1.5, 5)).toBe(5);
      expect(binIndex(-1, 5)).toBe(1);
    });
  });
});
