import { isEmpty, pointsToPath, strokesToSvg, type SignatureStroke } from './signature-core';

describe('signature-core', () => {
  describe('pointsToPath', () => {
    it('returns empty string for no points', () => {
      expect(pointsToPath([])).toBe('');
    });
    it('renders a single point as a dot (M…L same point)', () => {
      expect(pointsToPath([[10, 20]])).toBe('M 10 20 L 10 20');
    });
    it('renders two points as a straight segment', () => {
      expect(pointsToPath([[0, 0], [10, 10]])).toBe('M 0 0 L 10 10');
    });
    it('uses quadratic smoothing for three or more points', () => {
      const d = pointsToPath([[0, 0], [10, 0], [10, 10]]);
      expect(d.startsWith('M 0 0')).toBe(true);
      expect(d).toContain('Q');
    });
  });

  describe('strokesToSvg', () => {
    const strokes: SignatureStroke[] = [
      [[0, 0], [10, 10]],
      [[20, 20], [30, 30]],
    ];
    it('wraps a viewBox and a path per non-empty stroke', () => {
      const svg = strokesToSvg(strokes, 320, 160, 2);
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 320 160"');
      expect(svg.match(/<path/g)?.length).toBe(2);
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('stroke-width="2"');
    });
    it('skips empty strokes', () => {
      expect(strokesToSvg([[], [[1, 1]]], 10, 10, 1).match(/<path/g)?.length).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('is true for no strokes or only empty strokes', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([[]])).toBe(true);
    });
    it('is false when a stroke has points', () => {
      expect(isEmpty([[[0, 0]]])).toBe(false);
    });
  });
});
