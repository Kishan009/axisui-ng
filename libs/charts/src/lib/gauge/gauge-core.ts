/**
 * Gauge geometry — pure, no DOM. Angles are degrees clockwise from 3 o'clock
 * (SVG y-down). Examples: bottom semicircle = 0→180; speedometer = 135→405.
 */

const DEG = Math.PI / 180;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export function clampValue(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Map value→angle (deg) across [startAngle, endAngle]; clamps value to [min,max]. min===max → startAngle. */
export function valueToAngle(v: number, min: number, max: number, startAngle: number, endAngle: number): number {
  if (min === max) return startAngle;
  const t = (clampValue(v, min, max) - min) / (max - min);
  return startAngle + t * (endAngle - startAngle);
}

/** Point on a circle. deg measured clockwise from the positive x-axis; SVG y-down. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = deg * DEG;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG path `M…A…` along the circle from startAngle to endAngle (large-arc + sweep flags set). */
export function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const [x0, y0] = polar(cx, cy, r, startAngle);
  const [x1, y1] = polar(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweep = endAngle >= startAngle ? 1 : 0;
  return `M ${r2(x0)} ${r2(y0)} A ${r2(r)} ${r2(r)} 0 ${largeArc} ${sweep} ${r2(x1)} ${r2(y1)}`;
}
