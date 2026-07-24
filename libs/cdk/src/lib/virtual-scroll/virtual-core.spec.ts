import { computeRange, totalSize } from './virtual-core';

describe('virtual-core', () => {
  describe('totalSize', () => {
    it('multiplies count by item size', () => {
      expect(totalSize(1000, 40)).toBe(40000);
    });
    it('clamps negatives to 0', () => {
      expect(totalSize(-5, 40)).toBe(0);
      expect(totalSize(10, -1)).toBe(0);
    });
  });

  describe('computeRange', () => {
    const SIZE = 40;
    const VP = 400; // 10 rows visible
    const COUNT = 1000;

    it('renders the top window (+overscan) at scrollTop 0', () => {
      // visible = ceil(400/40)=10; first=0 → end = 0+10+2+1 = 13; start = 0
      expect(computeRange(0, VP, SIZE, COUNT, 2)).toEqual({ start: 0, end: 13 });
    });

    it('windows around the middle', () => {
      // scrollTop 4000 → first = 100; start = 100-2 = 98; end = 100+10+2+1 = 113
      expect(computeRange(4000, VP, SIZE, COUNT, 2)).toEqual({ start: 98, end: 113 });
    });

    it('clamps the end at the bottom', () => {
      // near the end: first = floor(39600/40)=990; end = min(1000, 990+10+2+1)=1000
      expect(computeRange(39600, VP, SIZE, COUNT, 2)).toEqual({ start: 988, end: 1000 });
    });

    it('respects overscan = 0', () => {
      expect(computeRange(4000, VP, SIZE, COUNT, 0)).toEqual({ start: 100, end: 111 });
    });

    it('returns empty for an empty list / zero item size / unmeasured viewport', () => {
      expect(computeRange(0, VP, SIZE, 0, 4)).toEqual({ start: 0, end: 0 });
      expect(computeRange(0, VP, 0, COUNT, 4)).toEqual({ start: 0, end: 0 });
      expect(computeRange(0, 0, SIZE, COUNT, 4)).toEqual({ start: 0, end: 0 });
    });

    it('handles a viewport larger than the list', () => {
      const r = computeRange(0, 10000, SIZE, 5, 4);
      expect(r.start).toBe(0);
      expect(r.end).toBe(5);
    });

    it('never returns end < start', () => {
      const r = computeRange(999999, VP, SIZE, COUNT, 2);
      expect(r.end).toBeGreaterThanOrEqual(r.start);
      expect(r.end).toBeLessThanOrEqual(COUNT);
    });
  });
});
