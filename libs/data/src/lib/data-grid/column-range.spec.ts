import { columnRange } from './column-range';

// Six 100px columns; total 600.
const w = [100, 100, 100, 100, 100, 100];

describe('columnRange', () => {
  it('at scrollLeft 0 with a 250px viewport and 0 overscan renders the first visible run', () => {
    const r = columnRange(0, 250, w, 0);
    expect(r.start).toBe(0);
    expect(r.end).toBe(3); // cols 0,1,2 (col 2 spans 200..300, crosses the 250 edge)
    expect(r.leftPad).toBe(0);
    expect(r.rightPad).toBe(300); // cols 3,4,5
  });

  it('applies overscan on both sides, clamped to bounds', () => {
    const r = columnRange(250, 200, w, 1); // visible ~cols 2,3,4; +1 each side -> 1..6
    expect(r.start).toBe(1);
    expect(r.end).toBe(6);
    expect(r.leftPad).toBe(100);
    expect(r.rightPad).toBe(0);
  });

  it('scrolled to the far right renders the tail', () => {
    const r = columnRange(350, 250, w, 0); // visible 350..600 -> cols 3,4,5
    expect(r.start).toBe(3);
    expect(r.end).toBe(6);
    expect(r.leftPad).toBe(300);
    expect(r.rightPad).toBe(0);
  });

  it('renders everything when the viewport is wider than the total', () => {
    const r = columnRange(0, 5000, w, 0);
    expect(r).toEqual({ start: 0, end: 6, leftPad: 0, rightPad: 0 });
  });

  it('empty columns -> all-zero range', () => {
    expect(columnRange(0, 300, [], 2)).toEqual({ start: 0, end: 0, leftPad: 0, rightPad: 0 });
  });

  it('non-positive viewport falls back to rendering all', () => {
    expect(columnRange(120, 0, w, 0)).toEqual({ start: 0, end: 6, leftPad: 0, rightPad: 0 });
  });
});
