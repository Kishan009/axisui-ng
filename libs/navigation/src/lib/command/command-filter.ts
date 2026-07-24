import type { CommandItem } from './command.types';

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (i < needle.length && ch === needle[i]) i++;
  }
  return i === needle.length;
}

/** Case-insensitive subsequence match against the item's label and keywords. */
export function matchesQuery(item: CommandItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystacks = [item.label, ...(item.keywords ?? [])].map((s) => s.toLowerCase());
  return haystacks.some((h) => isSubsequence(q, h));
}
