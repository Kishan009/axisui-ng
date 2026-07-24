export type PageToken = number | 'ellipsis';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

/**
 * Build a pagination token list: page numbers plus 'ellipsis' gaps.
 * Always shows page 1 and `pageCount`, with `siblingCount` neighbours around `page`.
 */
export function pageList(page: number, pageCount: number, siblingCount = 1): PageToken[] {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2*siblings, 2 ellipses
  if (pageCount <= totalNumbers) {
    return range(1, pageCount);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pageCount);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;
  const edgeCount = 3 + 2 * siblingCount;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, edgeCount), 'ellipsis', pageCount];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis', ...range(pageCount - edgeCount + 1, pageCount)];
  }
  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', pageCount];
}
