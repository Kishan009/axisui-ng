import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { avatarVariants, type AvatarSize } from './avatar.variants';

/**
 * Avatar — image with initials/icon fallback chain (src → initials → user icon).
 *
 * @example <ax-avatar src="/u.png" alt="Jane" initials="JD" size="md" />
 */
@Component({
  selector: 'ax-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { '[attr.data-size]': 'size()' },
  template: `
    <span [class]="classes()">
      @if (src() && !failed()) {
        <img
          [src]="src()"
          [attr.alt]="alt()"
          class="h-full w-full object-cover"
          (error)="failed.set(true)"
        />
      } @else if (initials()) {
        <span aria-hidden="true">{{ initials() }}</span>
      } @else {
        <ax-icon name="user" [size]="iconSize()" />
      }
    </span>
  `,
})
export class AxAvatarComponent {
  /** Image URL. When set and loadable, shown in preference to initials/icon. @default null */
  src = input<string | null>(null);
  /** Alt text for the image. @default '' */
  alt = input<string>('');
  /** Fallback initials shown when no image. @default null */
  initials = input<string | null>(null);
  /** Size. @default 'md' */
  size = input<AvatarSize>('md');

  /** True once the image has errored, so we drop to the next fallback. */
  protected readonly failed = signal(false);

  protected readonly classes = computed(() => cn('ax-avatar', avatarVariants({ size: this.size() })));
  protected readonly iconSize = computed(() => ({ sm: 16, md: 20, lg: 24 })[this.size()]);
}
