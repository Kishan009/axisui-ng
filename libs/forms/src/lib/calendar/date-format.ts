const TOKEN_RE = /(yyyy|MM|dd)/g;

/** Format a date with the tokens yyyy / MM / dd. Literals pass through. '' when null. */
export function formatDate(d: Date | null, pattern: string): string {
  if (!d) return '';
  return pattern.replace(TOKEN_RE, (tok) => {
    if (tok === 'yyyy') return String(d.getFullYear()).padStart(4, '0');
    if (tok === 'MM') return String(d.getMonth() + 1).padStart(2, '0');
    return String(d.getDate()).padStart(2, '0');
  });
}

/** Parse text against a yyyy/MM/dd pattern. Returns null when malformed or not a real date. */
export function parseDate(text: string, pattern: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const order: ('yyyy' | 'MM' | 'dd')[] = [];
  let regexStr = '^';
  let i = 0;
  while (i < pattern.length) {
    if (pattern.startsWith('yyyy', i)) {
      order.push('yyyy');
      regexStr += '(\\d{4})';
      i += 4;
    } else if (pattern.startsWith('MM', i)) {
      order.push('MM');
      regexStr += '(\\d{1,2})';
      i += 2;
    } else if (pattern.startsWith('dd', i)) {
      order.push('dd');
      regexStr += '(\\d{1,2})';
      i += 2;
    } else {
      regexStr += pattern.charAt(i).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      i += 1;
    }
  }
  regexStr += '$';

  const match = new RegExp(regexStr).exec(trimmed);
  if (!match) return null;

  let year = NaN;
  let month = NaN;
  let day = NaN;
  for (let g = 0; g < order.length; g++) {
    const v = parseInt(match[g + 1] ?? '', 10);
    const tok = order[g];
    if (tok === 'yyyy') year = v;
    else if (tok === 'MM') month = v;
    else day = v;
  }
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}
