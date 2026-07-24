/** Signature stroke geometry — pure, no DOM. Strokes are arrays of [x,y] points. */

export type SignaturePoint = [number, number];
export type SignatureStroke = SignaturePoint[];

const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Quadratic-smoothed (midpoint) SVG path through a stroke's points. 1 point → a dot. '' for empty. */
export function pointsToPath(points: SignatureStroke): string {
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${r2(first[0])} ${r2(first[1])} L ${r2(first[0])} ${r2(first[1])}`;

  let d = `M ${r2(first[0])} ${r2(first[1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cur = points[i]!;
    const next = points[i + 1]!;
    d += ` Q ${r2(cur[0])} ${r2(cur[1])} ${r2((cur[0] + next[0]) / 2)} ${r2((cur[1] + next[1]) / 2)}`;
  }
  const last = points[points.length - 1]!;
  d += ` L ${r2(last[0])} ${r2(last[1])}`;
  return d;
}

/** Full `<svg>` string: viewBox 0 0 w h, one `<path stroke="currentColor">` per non-empty stroke. */
export function strokesToSvg(strokes: SignatureStroke[], width: number, height: number, strokeWidth: number): string {
  const paths = strokes
    .filter((s) => s.length > 0)
    .map(
      (s) =>
        `<path d="${pointsToPath(s)}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`;
}

/** True when there are no strokes (or every stroke is empty). */
export function isEmpty(strokes: SignatureStroke[]): boolean {
  return strokes.every((s) => s.length === 0);
}
