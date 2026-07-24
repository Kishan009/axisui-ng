/**
 * Color math for the OKLCH color picker — pure, no DOM. OKLCH ↔ sRGB uses the
 * Björn Ottosson OKLab ↔ linear-sRGB matrices. Ranges: l 0–1, c 0–~0.4,
 * h 0–360 (deg), alpha 0–1. Every helper is deterministic and table-tested.
 */

export type ColorFormat = 'oklch' | 'hex' | 'rgb';
export interface Oklch { l: number; c: number; h: number; alpha: number }
export interface Rgb { r: number; g: number; b: number; alpha: number } // channels 0–1 (gamma sRGB)
export interface ColorToken { name: string; value: string; oklch: Oklch }

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const DEG = Math.PI / 180;

/** OKLCH → OKLab (a, b). */
function oklchToLab(c: Oklch): { L: number; a: number; b: number } {
  return { L: c.l, a: c.c * Math.cos(c.h * DEG), b: c.c * Math.sin(c.h * DEG) };
}

/** OKLab → linear sRGB (may be out of [0,1]). */
function labToLinear(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

/** linear sRGB → OKLab. */
function linearToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

const gammaEncode = (x: number): number => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const gammaDecode = (x: number): number => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));

/** OKLCH → gamma sRGB (channels clamped to [0,1]). For display / hex. */
export function oklchToSrgb(c: Oklch): Rgb {
  const { L, a, b } = oklchToLab(c);
  const lin = labToLinear(L, a, b);
  return {
    r: clamp01(gammaEncode(clamp01(lin.r))),
    g: clamp01(gammaEncode(clamp01(lin.g))),
    b: clamp01(gammaEncode(clamp01(lin.b))),
    alpha: c.alpha,
  };
}

/** gamma sRGB (0–1) → OKLCH. */
export function srgbToOklch(rgb: Rgb): Oklch {
  const { L, a, b } = linearToLab(gammaDecode(rgb.r), gammaDecode(rgb.g), gammaDecode(rgb.b));
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) / DEG;
  if (h < 0) h += 360;
  return { l: L, c, h, alpha: rgb.alpha };
}

/** True when the linear sRGB channels all sit within [0,1] (± epsilon). */
export function isInGamut(c: Oklch): boolean {
  const { L, a, b } = oklchToLab(c);
  const lin = labToLinear(L, a, b);
  const eps = 1e-4;
  return [lin.r, lin.g, lin.b].every((v) => v >= -eps && v <= 1 + eps);
}

/** Binary-search chroma down to the sRGB boundary, holding L and H fixed. */
export function gamutMapChroma(c: Oklch): Oklch {
  if (isInGamut(c)) return c;
  let lo = 0;
  let hi = c.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut({ ...c, c: mid })) lo = mid;
    else hi = mid;
  }
  return { ...c, c: lo };
}

function toHex2(x: number): string {
  return Math.round(clamp01(x) * 255)
    .toString(16)
    .padStart(2, '0');
}

/** Serialize. Alpha is included only when < 1. */
export function formatColor(c: Oklch, fmt: ColorFormat): string {
  const a = c.alpha;
  if (fmt === 'hex') {
    const { r, g, b } = oklchToSrgb(c);
    const base = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
    return a < 1 ? `${base}${toHex2(a)}` : base;
  }
  if (fmt === 'rgb') {
    const { r, g, b } = oklchToSrgb(c);
    const [R, G, B] = [r, g, b].map((v) => Math.round(clamp01(v) * 255));
    return a < 1 ? `rgba(${R}, ${G}, ${B}, ${a.toFixed(2)})` : `rgb(${R}, ${G}, ${B})`;
  }
  const body = `${+c.l.toFixed(4)} ${+c.c.toFixed(4)} ${+c.h.toFixed(2)}`;
  return a < 1 ? `oklch(${body} / ${+a.toFixed(2)})` : `oklch(${body})`;
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;
const OKLCH_RE = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i;

function pctOrUnit(s: string): number {
  return s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s);
}

/** Parse #rgb / #rrggbb / #rrggbbaa, rgb()/rgba(), oklch(l c h[/ a]). null on failure. */
export function parseColor(input: string): Oklch | null {
  const s = input.trim();

  const hex = HEX_RE.exec(s);
  if (hex) {
    let h = hex[1]!;
    if (h.length === 3) {
      h = h
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return srgbToOklch({ r, g, b, alpha });
  }

  const rgb = RGB_RE.exec(s);
  if (rgb) {
    const r = parseFloat(rgb[1]!) / 255;
    const g = parseFloat(rgb[2]!) / 255;
    const b = parseFloat(rgb[3]!) / 255;
    const alpha = rgb[4] ? pctOrUnit(rgb[4]) : 1;
    return srgbToOklch({ r, g, b, alpha });
  }

  const ok = OKLCH_RE.exec(s);
  if (ok) {
    const l = pctOrUnit(ok[1]!);
    const c = parseFloat(ok[2]!);
    const h = parseFloat(ok[3]!);
    const alpha = ok[4] ? pctOrUnit(ok[4]) : 1;
    return { l, c, h, alpha };
  }

  return null;
}

/** Euclidean distance in OKLab (perceptual ΔE). */
export function deltaEOk(a: Oklch, b: Oklch): number {
  const x = oklchToLab(a);
  const y = oklchToLab(b);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

/** Nearest token by deltaEOk; null when the list is empty. */
export function nearestToken(c: Oklch, tokens: ReadonlyArray<ColorToken>): ColorToken | null {
  let best: ColorToken | null = null;
  let bestD = Infinity;
  for (const t of tokens) {
    const d = deltaEOk(c, t.oklch);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}
