import { normalizePlacement, connectedPositions } from './placement';

describe('normalizePlacement', () => {
  it('parses a bare side into side + center align', () => {
    expect(normalizePlacement('bottom')).toEqual({ side: 'bottom', align: 'center' });
  });

  it('parses a "side-align" shorthand', () => {
    expect(normalizePlacement('bottom-start')).toEqual({ side: 'bottom', align: 'start' });
  });
});

describe('connectedPositions', () => {
  it('places below for side=bottom (LTR), origin bottom → overlay top', () => {
    const [primary] = connectedPositions({ side: 'bottom', align: 'start' }, 'ltr');
    expect(primary.originY).toBe('bottom');
    expect(primary.overlayY).toBe('top');
    expect(primary.originX).toBe('start');
  });

  it('resolves logical end to the left edge in RTL', () => {
    const [primary] = connectedPositions({ side: 'end', align: 'center' }, 'rtl');
    // side=end in RTL points to the left
    expect(primary.originX).toBe('start');
    expect(primary.overlayX).toBe('end');
  });

  it('returns a fallback position after the primary', () => {
    const positions = connectedPositions({ side: 'bottom', align: 'center' }, 'ltr');
    expect(positions.length).toBeGreaterThanOrEqual(2);
  });
});
