/** A single row in a grid menu (column header menu or row/cell context menu). */
export interface GridMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean; // destructive styling (e.g. a consumer "Delete row")
  separatorBefore?: boolean;
}

export interface MenuPoint {
  x: number;
  y: number;
}
export interface MenuSize {
  width: number;
  height: number;
}
export interface MenuViewport {
  width: number;
  height: number;
}

/** Current per-column state used to build (and disable) the header-menu items. */
export interface ColumnMenuFlags {
  sortDir: 'asc' | 'desc' | null;
  pinned: 'start' | 'end' | null;
  filterable: boolean;
  hidable: boolean;
}

/** Builds the ordered column-header menu items, disabling entries per current state. */
export function columnMenuItems(flags: ColumnMenuFlags): GridMenuItem[] {
  const items: GridMenuItem[] = [
    { id: 'sort-asc', label: 'Sort ascending', disabled: flags.sortDir === 'asc' },
    { id: 'sort-desc', label: 'Sort descending', disabled: flags.sortDir === 'desc' },
    { id: 'sort-clear', label: 'Clear sort', disabled: flags.sortDir === null },
    { id: 'pin-start', label: 'Pin left', separatorBefore: true, disabled: flags.pinned === 'start' },
    { id: 'pin-end', label: 'Pin right', disabled: flags.pinned === 'end' },
    { id: 'unpin', label: 'Unpin', disabled: flags.pinned === null },
    { id: 'hide', label: 'Hide column', separatorBefore: true, disabled: !flags.hidable },
    { id: 'reset-width', label: 'Reset width' },
  ];
  if (flags.filterable) items.push({ id: 'filter', label: 'Filter…' });
  return items;
}

/** Copy payload for a single cell (already stringified by the caller). */
export function cellText(value: string): string {
  return value;
}

/** Copy payload for a row: tab-separated already-stringified cell values. */
export function rowTsv(cells: string[]): string {
  return cells.join('\t');
}

/** Clamps a menu position so it stays within the viewport (flip near right/bottom edges, floor at 0). */
export function clampMenuPosition(anchor: MenuPoint, size: MenuSize, vp: MenuViewport): MenuPoint {
  const x = Math.max(0, Math.min(anchor.x, vp.width - size.width));
  const y = Math.max(0, Math.min(anchor.y, vp.height - size.height));
  return { x, y };
}
