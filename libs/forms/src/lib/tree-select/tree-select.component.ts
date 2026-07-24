/**
 * TreeSelect — a dropdown form control that picks node(s) from a `ax-tree`.
 * Mirrors the Combobox trigger + `cdkConnectedOverlay` pattern; the panel holds
 * a `ax-tree` (optionally searchable). Single → value is one id; multiple →
 * value is the checked id array (cascade-managed by the tree, shown as removable
 * chips in the trigger). Implements ControlValueAccessor.
 *
 * @example
 * <ax-tree-select [nodes]="nodes" [(value)]="folder" placeholder="Pick a folder" ariaLabel="Folder" />
 * <ax-tree-select [nodes]="nodes" selection="multiple" [(value)]="picks" ariaLabel="Categories" />
 */
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AxIconComponent } from '@axisui-ng/icons';
import { AxTreeComponent, filterTree, findNode, setChecked, type TreeId, type TreeNode } from '@axisui-ng/tree';

import { AxChipComponent } from '../chip/chip.component';

@Component({
  selector: 'ax-tree-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, AxIconComponent, AxChipComponent, AxTreeComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxTreeSelectComponent), multi: true },
  ],
  host: { class: 'block w-full' },
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin" class="block w-full">
      <div
        role="combobox"
        [attr.tabindex]="effectiveDisabled() ? -1 : 0"
        class="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-[var(--radius-field)] border border-input bg-background px-2 py-1 text-sm transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        aria-haspopup="tree"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? 'ax-tree-select-panel' : null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        @if (selection() === 'multiple') {
          @for (id of multiValue(); track id) {
            <ax-chip removable [removeAriaLabel]="'Remove ' + labelOf(id)" (remove)="removeChip(id)">{{ labelOf(id) }}</ax-chip>
          }
          @if (multiValue().length === 0) {
            <span class="text-muted-foreground">{{ placeholder() }}</span>
          }
        } @else {
          <span [class.text-muted-foreground]="singleValue() == null">{{ triggerText() }}</span>
        }
        <ax-icon name="chevron-down" [size]="16" class="ms-auto shrink-0" />
      </div>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      (overlayOutsideClick)="close()"
    >
      <div
        id="ax-tree-select-panel"
        data-ax-overlay
        data-state="open"
        class="z-50 mt-1 w-full rounded-[var(--radius-md)] border border-border bg-popover p-1 text-popover-foreground shadow-md"
      >
        @if (searchable()) {
          <input
            class="mb-1 h-8 w-full rounded-[var(--radius-sm)] border border-input bg-background px-2 text-sm"
            [value]="query()"
            placeholder="Search…"
            aria-label="Filter tree"
            (input)="query.set($any($event.target).value)"
          />
        }
        <div class="max-h-72 overflow-auto">
          <ax-tree
            [nodes]="visibleNodes()"
            [selection]="selection()"
            [loadChildren]="loadChildren()"
            [expandedIds]="treeExpanded()"
            (expandedIdsChange)="onExpandedChange($event)"
            [selectedId]="singleValue()"
            (selectedIdChange)="onSingleChange($event)"
            [checkedIds]="multiValue()"
            (checkedIdsChange)="onMultiChange($event)"
            [ariaLabel]="ariaLabel() || 'Tree'"
          />
        </div>
      </div>
    </ng-template>
  `,
})
export class AxTreeSelectComponent implements ControlValueAccessor {
  /** The tree data. */
  readonly nodes = input.required<TreeNode[]>();
  /** Selection mode. @default 'single' */
  readonly selection = input<'single' | 'multiple'>('single');
  /** Placeholder when empty. @default '' */
  readonly placeholder = input<string>('');
  /** Disabled (also driven by the parent form). @default false */
  readonly disabled = input<boolean>(false);
  /** Lazy children loader, forwarded to the tree. @default null */
  readonly loadChildren = input<((node: TreeNode) => Promise<TreeNode[]>) | null>(null);
  /** Show the in-panel search filter. @default true */
  readonly searchable = input<boolean>(true);
  /** Accessible label. @default '' */
  readonly ariaLabel = input<string>('');

  /** Selected id (single) or checked ids (multiple); two-way + CVA. */
  readonly value = model<TreeId | TreeId[] | null>(null);

  protected readonly open = signal(false);
  protected readonly query = signal('');
  /** Overlay pane width — matched to the trigger on open. */
  protected readonly panelWidth = signal<number | null>(null);
  private readonly internalExpanded = signal<TreeId[]>([]);
  private readonly disabledState = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayOrigin = viewChild.required(CdkOverlayOrigin);

  protected readonly singleValue = computed<TreeId | null>(() => {
    const v = this.value();
    return this.selection() === 'single' && (typeof v === 'string' || typeof v === 'number') ? v : null;
  });
  protected readonly multiValue = computed<TreeId[]>(() => {
    const v = this.value();
    return this.selection() === 'multiple' && Array.isArray(v) ? v : [];
  });

  private readonly filtering = computed(() => this.searchable() && this.query().trim().length > 0);
  private readonly filtered = computed(() => (this.filtering() ? filterTree(this.nodes(), this.query()) : null));
  protected readonly visibleNodes = computed(() => this.filtered()?.nodes ?? this.nodes());
  protected readonly treeExpanded = computed(() => this.filtered()?.expandedIds ?? this.internalExpanded());

  protected readonly triggerText = computed(() => {
    const id = this.singleValue();
    if (id == null) return this.placeholder();
    return findNode(this.nodes(), id)?.label ?? String(id);
  });

  protected labelOf(id: TreeId): string {
    return findNode(this.nodes(), id)?.label ?? String(id);
  }

  // --- open/close --------------------------------------------------------

  protected toggle(): void {
    if (this.effectiveDisabled()) return;
    if (this.open()) this.close();
    else this.openPanel();
  }

  protected openPanel(): void {
    if (this.effectiveDisabled()) return;
    const originEl = this.overlayOrigin().elementRef.nativeElement as HTMLElement;
    this.panelWidth.set(originEl.getBoundingClientRect().width);
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.query.set('');
    this.panelWidth.set(null);
    this.onTouched();
    (this.host.nativeElement.querySelector('[role="combobox"]') as HTMLElement | null)?.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if ((event.key === 'ArrowDown' || event.key === 'Enter') && !this.open()) {
      event.preventDefault();
      this.openPanel();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  // --- selection (close-on-select, both modes) ---------------------------

  protected onSingleChange(id: TreeId | null): void {
    this.value.set(id);
    this.onChange(id);
    this.close();
  }

  protected onMultiChange(ids: TreeId[]): void {
    this.value.set([...ids]);
    this.onChange([...ids]);
    this.close();
  }

  protected onExpandedChange(ids: TreeId[]): void {
    if (!this.filtering()) this.internalExpanded.set(ids);
  }

  protected removeChip(id: TreeId): void {
    if (this.effectiveDisabled()) return;
    const node = findNode(this.nodes(), id);
    const next = node
      ? setChecked(node, false, new Set(this.multiValue()))
      : new Set(this.multiValue().filter((x) => x !== id));
    const arr = [...next];
    this.value.set(arr);
    this.onChange(arr);
  }

  // --- ControlValueAccessor ----------------------------------------------

  private onChange: (value: TreeId | TreeId[] | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    if (this.selection() === 'multiple') {
      this.value.set(Array.isArray(value) ? (value as TreeId[]) : []);
    } else {
      this.value.set(typeof value === 'string' || typeof value === 'number' ? value : null);
    }
  }
  registerOnChange(fn: (value: TreeId | TreeId[] | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
