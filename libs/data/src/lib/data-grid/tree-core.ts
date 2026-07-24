/** Pure helpers for flattening hierarchical (tree) row data. No DOM, no Angular. */

export interface TreeRow<T> {
  row: T;
  level: number;
  expandable: boolean;
}

/**
 * Pre-order flatten of a row hierarchy. `expandable` is true when a row has children AND is below the
 * depth cap; children are emitted only when `isExpanded(row)` (and within the cap).
 * `maxLevel` is 0-based: maxLevel = 3 means up to 4 visible levels (0..3).
 */
export function flattenTree<T>(
  roots: T[],
  getChildren: (row: T) => T[] | null | undefined,
  isExpanded: (row: T) => boolean,
  maxLevel = 3
): TreeRow<T>[] {
  const out: TreeRow<T>[] = [];
  const walk = (rows: T[], level: number): void => {
    for (const row of rows) {
      const children = getChildren(row);
      const expandable = (children?.length ?? 0) > 0 && level < maxLevel;
      out.push({ row, level, expandable });
      if (expandable && isExpanded(row) && children) walk(children, level + 1);
    }
  };
  walk(roots, 0);
  return out;
}
