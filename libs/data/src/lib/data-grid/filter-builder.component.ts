import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  emptyGroup, newCondition, operatorsFor,
  type FilterGroup, type FilterOperator,
} from './filter-model';
import { addChild, removeNode, setCombinator, updateCondition, type NodePath } from './tree-edit';
import { asText, type GridColumnDef } from './grid-core';
import { type GridState } from './grid-state';

/**
 * Recursive renderer for one filter group (its child conditions and sub-groups).
 * A standalone component is in its own template scope, so it recurses without a self-import.
 * Each group edits itself as a local root (`[]`) and emits its whole new subtree via `changed`;
 * the parent splices it back in by index.
 */
@Component({
  selector: 'ax-data-grid-filter-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxDataGridFilterGroupComponent],
  host: { class: 'block rounded-[var(--radius-sm)] border border-border p-2' },
  template: `
    @let g = group();
    <div class="mb-2 flex items-center gap-2">
      <div class="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-border text-xs">
        <button type="button" data-combinator="and" class="px-2 py-0.5" [class.bg-muted]="g.combinator === 'and'" (click)="setComb('and')">AND</button>
        <button type="button" data-combinator="or" class="px-2 py-0.5" [class.bg-muted]="g.combinator === 'or'" (click)="setComb('or')">OR</button>
      </div>
      @if (!isRoot()) {
        <button type="button" data-remove-group class="ms-auto rounded-[var(--radius-sm)] px-1 text-xs hover:bg-muted" aria-label="Remove group" (click)="removeSelf()">✕ group</button>
      }
    </div>

    <div class="flex flex-col gap-2 ps-2">
      @for (child of g.children; track $index; let i = $index) {
        @if (child.kind === 'condition') {
          <div data-condition class="flex flex-wrap items-center gap-2">
            <select class="h-7 rounded-[var(--radius-sm)] border border-input bg-background px-1 text-xs"
              data-column aria-label="Column" [value]="asString(child.key)" (change)="onColumn(i, $event)">
              @for (col of columns(); track col.key) {
                <option [value]="asString(col.key)">{{ col.header }}</option>
              }
            </select>
            <select class="h-7 rounded-[var(--radius-sm)] border border-input bg-background px-1 text-xs"
              data-operator aria-label="Operator" [value]="child.operator" (change)="onOperator(i, $event)">
              @for (op of opsFor(child.key); track op) {
                <option [value]="op">{{ op }}</option>
              }
            </select>
            @if (needsValue(child.operator)) {
              <input class="h-7 w-28 rounded-[var(--radius-sm)] border border-input bg-background px-2 text-xs"
                data-value aria-label="Value" [type]="inputType(child.key)" [value]="asString(child.value)" (input)="onValue(i, $event)" />
            }
            @if (child.operator === 'between') {
              <input class="h-7 w-28 rounded-[var(--radius-sm)] border border-input bg-background px-2 text-xs"
                data-value2 aria-label="Value 2" [type]="inputType(child.key)" [value]="asString(child.value2)" (input)="onValue2(i, $event)" />
            }
            <button type="button" data-remove-condition class="rounded-[var(--radius-sm)] px-1 text-xs hover:bg-muted" aria-label="Remove condition" (click)="removeChild(i)">✕</button>
          </div>
        } @else {
          <ax-data-grid-filter-group
            [group]="child" [columns]="columns()" [path]="childPath(i)"
            (changed)="onChildChanged(i, $event)" (removeAt)="removeChild(i)"
          />
        }
      }
    </div>

    <div class="mt-2 flex gap-2 ps-2">
      <button type="button" data-add-condition class="rounded-[var(--radius-sm)] border border-border px-2 py-0.5 text-xs hover:bg-muted" (click)="addCondition()">+ condition</button>
      <button type="button" data-add-group class="rounded-[var(--radius-sm)] border border-border px-2 py-0.5 text-xs hover:bg-muted" (click)="addGroup()">+ group</button>
    </div>
  `,
})
export class AxDataGridFilterGroupComponent<T extends Record<string, unknown>> {
  readonly group = input.required<FilterGroup<T>>();
  readonly columns = input.required<GridColumnDef<T>[]>();
  readonly path = input<NodePath>([]);
  /** Emits this group's whole new subtree after an edit. */
  readonly changed = output<FilterGroup<T>>();
  /** Emits this group's path when it asks to be removed. */
  readonly removeAt = output<NodePath>();

  protected isRoot(): boolean { return this.path().length === 0; }
  protected childPath(i: number): NodePath { return [...this.path(), i]; }
  protected asString(v: unknown): string { return asText(v); }

  protected opsFor(key: keyof T): FilterOperator[] {
    return operatorsFor(this.columns().find((c) => c.key === key)?.filterType);
  }
  protected inputType(key: keyof T): string {
    const t = this.columns().find((c) => c.key === key)?.filterType;
    return t === 'number' ? 'number' : t === 'date' ? 'date' : 'text';
  }
  protected needsValue(op: FilterOperator): boolean {
    return op !== 'isEmpty' && op !== 'isNotEmpty';
  }

  private emit(next: FilterGroup<T>): void { this.changed.emit(next); }

  protected setComb(c: 'and' | 'or'): void { this.emit(setCombinator(this.group(), [], c)); }
  protected addCondition(): void {
    const firstKey = this.columns()[0]?.key as keyof T;
    this.emit(addChild(this.group(), [], newCondition<T>(firstKey)));
  }
  protected addGroup(): void { this.emit(addChild(this.group(), [], emptyGroup<T>('and'))); }
  protected removeChild(i: number): void { this.emit(removeNode(this.group(), [i])); }
  protected removeSelf(): void { this.removeAt.emit(this.path()); }

  protected onColumn(i: number, e: Event): void {
    const key = (e.target as HTMLSelectElement).value as unknown as keyof T;
    const op = this.opsFor(key)[0] ?? 'contains';
    this.emit(updateCondition(this.group(), [i], { key, operator: op, value: '', value2: undefined }));
  }
  protected onOperator(i: number, e: Event): void {
    this.emit(updateCondition(this.group(), [i], { operator: (e.target as HTMLSelectElement).value as FilterOperator }));
  }
  protected onValue(i: number, e: Event): void {
    this.emit(updateCondition(this.group(), [i], { value: (e.target as HTMLInputElement).value }));
  }
  protected onValue2(i: number, e: Event): void {
    this.emit(updateCondition(this.group(), [i], { value2: (e.target as HTMLInputElement).value }));
  }

  /** A nested group reported its new subtree; splice it back in at index `i`. */
  protected onChildChanged(i: number, childGroup: FilterGroup<T>): void {
    const children = this.group().children.slice();
    children[i] = childGroup;
    this.emit({ ...this.group(), children });
  }
}

/** Outer builder: owns the root group and writes edits to GridState. */
@Component({
  selector: 'ax-data-grid-filter-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxDataGridFilterGroupComponent],
  host: { class: 'block rounded-[var(--radius-field)] border border-border bg-popover p-3 text-sm' },
  template: `
    <div class="mb-2 flex items-center">
      <span class="font-medium">Filters</span>
      <button type="button" data-clear-all class="ms-auto rounded-[var(--radius-sm)] px-2 py-0.5 text-xs hover:bg-muted" (click)="clearAll()">Clear all</button>
    </div>
    <ax-data-grid-filter-group [group]="root()" [columns]="columns()" [path]="[]" (changed)="onRootChanged($event)" />
  `,
})
export class AxDataGridFilterBuilderComponent<T extends Record<string, unknown>> {
  readonly state = input.required<GridState<T>>();
  readonly columns = input.required<GridColumnDef<T>[]>();

  protected readonly root = computed<FilterGroup<T>>(() => this.state().filterModel() ?? emptyGroup<T>('and'));

  protected onRootChanged(next: FilterGroup<T>): void {
    this.state().setFilterModel(next.children.length === 0 ? null : next);
  }
  protected clearAll(): void { this.state().clearFilterModel(); }
}
