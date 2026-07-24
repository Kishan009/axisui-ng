/**
 * Tree — a data-driven tree/treeview. Flattens the expanded nodes into a list
 * (optionally virtualized via `@axisui-ng/cdk`), supports none/single/multiple
 * selection (multiple cascades with indeterminate parents), lazy children, and
 * a custom node template. WAI-ARIA `tree` with roving-tabindex keyboard nav.
 *
 * @example
 * <ax-tree [nodes]="nodes" selection="multiple" [(checkedIds)]="checked" [(expandedIds)]="open" ariaLabel="Files" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type TemplateRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { AxVirtualForDirective, AxVirtualViewportDirective } from '@axisui-ng/cdk';

import { AxTreeNodeComponent } from './ax-tree-node.component';
import {
  checkState,
  flatten,
  setChecked,
  type CheckState,
  type FlatNode,
  type TreeId,
  type TreeNode,
} from './tree-core';
import { TREE_CONTEXT, type TreeContext, type TreeNodeTemplateContext, type TreeSelection } from './tree.types';

@Component({
  selector: 'ax-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxTreeNodeComponent, AxVirtualViewportDirective, AxVirtualForDirective],
  providers: [{ provide: TREE_CONTEXT, useExisting: forwardRef(() => AxTreeComponent) }],
  host: { class: 'block' },
  template: `
    @if (virtual()) {
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- tree keydown is delegated from the focused treeitem (roving tabindex); the tree container is not a tab stop -->
      <div
        axVirtualViewport
        role="tree"
        class="block h-full overflow-auto"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-multiselectable]="selection() === 'multiple' ? 'true' : null"
        (keydown)="onKeydown($event)"
      >
        <ax-tree-node *axVirtualFor="let f of flat(); itemSize: itemSize()" [flat]="f" />
      </div>
    } @else {
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- tree keydown is delegated from the focused treeitem (roving tabindex); the tree container is not a tab stop -->
      <div
        role="tree"
        class="block"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-multiselectable]="selection() === 'multiple' ? 'true' : null"
        (keydown)="onKeydown($event)"
      >
        @for (f of flat(); track f.node.id) {
          <ax-tree-node [flat]="f" />
        }
      </div>
    }
  `,
})
export class AxTreeComponent implements TreeContext {
  /** The tree data. */
  readonly nodes = input.required<TreeNode[]>();
  /** Selection behaviour. @default 'none' */
  readonly selection = input<TreeSelection>('none');
  /** Lazy children loader — called when expanding a node with `hasChildren` and no loaded children. */
  readonly loadChildren = input<((node: TreeNode) => Promise<TreeNode[]>) | null>(null);
  /** Optional node-content template. */
  readonly nodeTemplate = input<TemplateRef<TreeNodeTemplateContext> | null>(null);
  /** Render through the virtual scroller (needs a bounded height on the host). @default false */
  readonly virtual = input<boolean>(false);
  /** Row height (px) used in virtual mode. @default 32 */
  readonly itemSize = input<number>(32);
  /** Accessible label for the tree. */
  readonly ariaLabel = input<string>('');

  /** Expanded node ids (two-way). */
  readonly expandedIds = model<TreeId[]>([]);
  /** Single-selected node id (two-way). */
  readonly selectedId = model<TreeId | null>(null);
  /** Checked node ids for multiple selection (two-way). */
  readonly checkedIds = model<TreeId[]>([]);

  private readonly loaded = signal<Map<TreeId, TreeNode[]>>(new Map());
  private readonly loadingIds = signal<Set<TreeId>>(new Set());
  readonly focusedId = signal<TreeId | null>(null);

  private readonly expandedSet = computed(() => new Set(this.expandedIds()));
  private readonly checkedSet = computed(() => new Set(this.checkedIds()));

  /** The visible, depth-tagged rows. */
  readonly flat = computed<FlatNode[]>(() => flatten(this.nodes(), this.expandedSet(), this.loaded()));

  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Seed roving focus on the first row.
    effect(() => {
      const first = this.flat()[0];
      if (this.focusedId() == null && first) this.focusedId.set(first.node.id);
    });
  }

  // --- TreeContext -------------------------------------------------------

  isLoading(id: TreeId): boolean {
    return this.loadingIds().has(id);
  }
  stateOf(node: TreeNode): CheckState {
    return checkState(node, this.checkedSet(), this.loaded());
  }
  isSelected(id: TreeId): boolean {
    return this.selectedId() === id;
  }
  focus(id: TreeId): void {
    this.focusedId.set(id);
  }

  select(flat: FlatNode): void {
    this.selectedId.set(flat.node.id);
  }

  toggleCheck(flat: FlatNode): void {
    const on = this.stateOf(flat.node) !== 'checked';
    const next = setChecked(flat.node, on, this.checkedSet(), this.loaded());
    this.checkedIds.set([...next]);
  }

  toggleExpand(flat: FlatNode): void {
    const node = flat.node;
    const id = node.id;
    if (this.expandedSet().has(id)) {
      this.expandedIds.set(this.expandedIds().filter((x) => x !== id));
      return;
    }
    const fn = this.loadChildren();
    const needsLoad = !!node.hasChildren && !(node.children?.length) && !this.loaded().has(id) && !!fn;
    if (needsLoad && fn) {
      this.loadingIds.set(new Set(this.loadingIds()).add(id));
      void Promise.resolve(fn(node))
        .then((kids) => {
          this.loaded.set(new Map(this.loaded()).set(id, kids));
          this.expandedIds.set([...this.expandedIds(), id]);
        })
        .finally(() => {
          const next = new Set(this.loadingIds());
          next.delete(id);
          this.loadingIds.set(next);
        });
    } else {
      this.expandedIds.set([...this.expandedIds(), id]);
    }
  }

  // --- keyboard (roving) -------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.flat();
    if (list.length === 0) return;
    let idx = list.findIndex((f) => f.node.id === this.focusedId());
    if (idx < 0) idx = 0;
    const cur = list[idx];
    if (!cur) return;

    switch (event.key) {
      case 'ArrowDown':
        this.focusAt(this.nextEnabled(idx, 1));
        break;
      case 'ArrowUp':
        this.focusAt(this.nextEnabled(idx, -1));
        break;
      case 'Home':
        this.focusAt(this.nextEnabled(-1, 1));
        break;
      case 'End':
        this.focusAt(this.nextEnabled(list.length, -1));
        break;
      case 'ArrowRight':
        if (cur.expandable && !cur.expanded) this.toggleExpand(cur);
        else if (cur.expanded) this.focusAt(this.nextEnabled(idx, 1));
        break;
      case 'ArrowLeft':
        if (cur.expandable && cur.expanded) this.toggleExpand(cur);
        else this.focusAt(this.parentIndex(idx));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!cur.node.disabled) {
          if (this.selection() === 'single') this.select(cur);
          else if (this.selection() === 'multiple') this.toggleCheck(cur);
        }
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Next non-disabled row index from `from` in `dir` (no wrap). */
  private nextEnabled(from: number, dir: 1 | -1): number {
    const list = this.flat();
    for (let i = from + dir; i >= 0 && i < list.length; i += dir) {
      const row = list[i];
      if (row && !row.node.disabled) return i;
    }
    return from < 0 || from > list.length - 1 ? -1 : from;
  }

  /** Index of the nearest ancestor row (smaller depth) above `idx`. */
  private parentIndex(idx: number): number {
    const list = this.flat();
    const depth = list[idx]?.depth ?? 0;
    for (let i = idx - 1; i >= 0; i--) {
      const row = list[i];
      if (row && row.depth < depth) return i;
    }
    return -1;
  }

  private focusAt(index: number): void {
    const row = this.flat()[index];
    if (!row) return;
    const id = row.node.id;
    this.focusedId.set(id);
    const el = this.host.nativeElement.querySelector(`[data-tree-id="${id}"]`);
    (el as HTMLElement | null)?.focus();
  }
}
