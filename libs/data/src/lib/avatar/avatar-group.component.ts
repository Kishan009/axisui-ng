import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  computed,
  contentChildren,
  effect,
  inject,
  input,
} from '@angular/core';

import { AxAvatarComponent } from './avatar.component';
import type { AvatarSize } from './avatar.variants';

const REMAINDER_SIZE: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/**
 * AvatarGroup — overlapping stack of avatars. Project <ax-avatar> children.
 * When `max` is set and there are more avatars than the limit, the extras are
 * hidden and a trailing "+N" remainder chip is shown. Set `size` to match the
 * size of the projected avatars so the remainder chip lines up.
 *
 * @example
 * <ax-avatar-group [max]="3" size="md">
 *   <ax-avatar initials="AB" />
 *   <ax-avatar initials="CD" />
 *   <ax-avatar initials="EF" />
 *   <ax-avatar initials="GH" />
 *   <ax-avatar initials="IJ" />
 * </ax-avatar-group>
 */
@Component({
  selector: 'ax-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center [&>*]:ring-2 [&>*]:ring-background [&>*:not(:first-child)]:-ms-2' },
  template: `
    <ng-content select="ax-avatar" />
    @if (remainder() > 0) {
      <span
        class="relative inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground select-none {{ remainderClass() }}"
        [attr.aria-label]="remainder() + ' more'"
      >+{{ remainder() }}</span>
    }
  `,
})
export class AxAvatarGroupComponent {
  /** Maximum avatars to show before collapsing the rest into a "+N" chip. 0 = no limit. @default 0 */
  readonly max = input<number>(0);

  /** Size of the remainder chip — match the projected avatars' size. @default 'md' */
  readonly size = input<AvatarSize>('md');

  private readonly avatars = contentChildren(AxAvatarComponent, { read: ElementRef });
  private readonly renderer = inject(Renderer2);

  /** How many avatars are hidden behind the limit. */
  protected readonly remainder = computed(() => {
    const m = this.max();
    return m > 0 ? Math.max(0, this.avatars().length - m) : 0;
  });

  protected readonly remainderClass = computed(() => REMAINDER_SIZE[this.size()]);

  constructor() {
    // Hide avatars past the limit (display:none keeps them out of layout) via
    // Renderer2 — no [style.*] binding, SSR-safe.
    effect(() => {
      const m = this.max();
      this.avatars().forEach((ref, i) => {
        const el = ref.nativeElement as HTMLElement;
        if (m > 0 && i >= m) this.renderer.setStyle(el, 'display', 'none');
        else this.renderer.removeStyle(el, 'display');
      });
    });
  }
}
