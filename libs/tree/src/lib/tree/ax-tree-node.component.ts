/**
 * TreeNode row — renders one flattened node of a `ax-tree` (indent, expand
 * toggle, optional checkbox, label / projected template). Reads shared state
 * from `TREE_CONTEXT`; the parent `ax-tree` owns the data + keyboard.
 */
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import type { FlatNode } from './tree-core';
import { TREE_CONTEXT } from './tree.types';

@Component({
  selector: 'ax-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent, NgTemplateOutlet],
  host: {
    '[attr.role]': "'treeitem'",
    '[attr.data-tree-id]': 'flat().node.id',
    '[attr.aria-level]': 'flat().depth + 1',
    '[attr.aria-setsize]': 'flat().setsize',
    '[attr.aria-posinset]': 'flat().posinset',
    '[attr.aria-expanded]': 'flat().expandable ? flat().expanded : null',
    '[attr.aria-selected]': "ctx.selection() === 'single' ? selected() : null",
    '[attr.aria-checked]': "ctx.selection() === 'multiple' ? ariaChecked() : null",
    '[attr.aria-disabled]': "flat().node.disabled ? 'true' : null",
    '[attr.tabindex]': 'focused() ? 0 : -1',
    '[class]': 'rowClasses()',
    '(click)': 'onRowClick()',
  },
  template: `
    @for (_ of indent(); track $index) {
      <span class="inline-block w-4 shrink-0" aria-hidden="true"></span>
    }

    @if (flat().expandable) {
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-out-quart hover:text-foreground before:absolute before:content-[''] before:-inset-3"
        (click)="onToggle($event)"
      >
        @if (loading()) {
          <ax-icon name="loader" class="animate-spin" [size]="14" />
        } @else {
          <ax-icon [name]="flat().expanded ? 'chevron-down' : 'chevron-right'" [size]="14" />
        }
      </button>
    } @else {
      <span class="inline-block w-5 shrink-0" aria-hidden="true"></span>
    }

    @if (ctx.selection() === 'multiple') {
      <span
        aria-hidden="true"
        class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input text-primary-foreground data-[s=checked]:border-primary data-[s=checked]:bg-primary data-[s=indeterminate]:border-primary data-[s=indeterminate]:bg-primary"
        [attr.data-s]="state()"
        (click)="onCheck($event)"
      >
        @if (state() === 'checked') {
          <ax-icon name="check" [size]="12" />
        } @else if (state() === 'indeterminate') {
          <ax-icon name="minus" [size]="12" />
        }
      </span>
    }

    @if (flat().node.icon) {
      <ax-icon [name]="flat().node.icon!" [size]="16" class="shrink-0 text-muted-foreground" />
    }

    @if (ctx.nodeTemplate()) {
      <ng-container
        [ngTemplateOutlet]="ctx.nodeTemplate()!"
        [ngTemplateOutletContext]="{ $implicit: flat().node, flat: flat() }"
      />
    } @else {
      <span class="truncate">{{ flat().node.label }}</span>
    }
  `,
})
export class AxTreeNodeComponent {
  readonly flat = input.required<FlatNode>();

  protected readonly ctx = inject(TREE_CONTEXT);

  protected readonly indent = computed(() => Array.from({ length: this.flat().depth }));
  protected readonly loading = computed(() => this.ctx.isLoading(this.flat().node.id));
  protected readonly selected = computed(() => this.ctx.isSelected(this.flat().node.id));
  protected readonly focused = computed(() => this.ctx.focusedId() === this.flat().node.id);
  protected readonly state = computed(() => this.ctx.stateOf(this.flat().node));
  protected readonly ariaChecked = computed(() => {
    const s = this.state();
    return s === 'checked' ? 'true' : s === 'indeterminate' ? 'mixed' : 'false';
  });

  protected readonly rowClasses = computed(() =>
    cn(
      'flex select-none items-center gap-1 rounded-sm px-1 py-1 text-sm transition-colors duration-[var(--duration-fast)] ease-out-quart',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      this.flat().node.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
      this.selected() && 'bg-accent text-accent-foreground'
    )
  );

  protected onRowClick(): void {
    if (this.flat().node.disabled) return;
    this.ctx.focus(this.flat().node.id);
    if (this.ctx.selection() === 'single') this.ctx.select(this.flat());
  }

  protected onToggle(event: Event): void {
    event.stopPropagation();
    if (!this.flat().node.disabled) this.ctx.toggleExpand(this.flat());
  }

  protected onCheck(event: Event): void {
    event.stopPropagation();
    if (!this.flat().node.disabled) this.ctx.toggleCheck(this.flat());
  }
}
