/**
 * Pure mask engine for `ax-input-mask`. Table-tested; no DOM.
 *
 * Tokens: `9` = digit, `A` = letter (a–z/A–Z), `*` = alphanumeric.
 * Any other character in the mask is a literal.
 */

const MATCHERS: Record<string, (c: string) => boolean> = {
  '9': (c) => c >= '0' && c <= '9',
  A: (c) => /[a-z]/i.test(c),
  '*': (c) => /[a-z0-9]/i.test(c),
};

/** Whether a mask character is a token (vs a literal). */
export function isMaskToken(maskChar: string): boolean {
  return maskChar in MATCHERS;
}

/**
 * Format `raw` against `mask`. Token positions consume the next matching raw
 * character (skipping ones that don't match); literal positions are emitted
 * (consuming a typed literal if it matches). Stops when the mask or the raw
 * input runs out, so partial input yields a partial mask.
 */
export function applyMask(raw: string, mask: string): string {
  if (!mask) return raw;
  let out = '';
  let ri = 0;
  for (let mi = 0; mi < mask.length && ri < raw.length; mi++) {
    const m = mask.charAt(mi);
    const matcher = MATCHERS[m];
    if (matcher) {
      while (ri < raw.length && !matcher(raw.charAt(ri))) ri++;
      if (ri >= raw.length) break;
      out += raw.charAt(ri);
      ri++;
    } else {
      out += m;
      if (raw.charAt(ri) === m) ri++;
    }
  }
  return out;
}
