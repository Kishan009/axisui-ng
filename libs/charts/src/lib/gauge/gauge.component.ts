import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { arcPath, valueToAngle } from './gauge-core';

const STROKE = ['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4', 'stroke-chart-5'];
const SIZE = 120;
const R = 48;
const CX = 60;
const CY = 60;

/**
 * Gauge — a radial arc meter over gauge-core. Geometry is fully driven by the
 * required startAngle/endAngle (deg, clockwise from 3 o'clock). Track + value arc,
 * center value label. role="meter".
 */
@Component({
  selector: 'ax-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative inline-block',
    role: 'meter',
    '[attr.aria-label]': "ariaLabel() || label() || 'Gauge'",
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuetext]': 'valueText()',
  },
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + SIZE + ' ' + SIZE"
      [attr.width]="SIZE"
      [attr.height]="SIZE"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path [attr.d]="trackPath()" class="stroke-border" fill="none" stroke-width="12" stroke-linecap="round" />
      <path [attr.d]="valuePath()" [attr.class]="valueClass()" fill="none" stroke-width="12" stroke-linecap="round" />
      <text
        [attr.x]="SIZE / 2"
        [attr.y]="SIZE / 2"
        text-anchor="middle"
        dominant-baseline="middle"
        class="fill-foreground"
        font-size="22"
        font-weight="600"
      >
        {{ value() }}
      </text>
      @if (label()) {
        <text
          [attr.x]="SIZE / 2"
          [attr.y]="SIZE / 2 + 22"
          text-anchor="middle"
          class="fill-muted-foreground"
          font-size="11"
        >
          {{ label() }}
        </text>
      }
    </svg>
  `,
})
export class AxGaugeComponent {
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly startAngle = input.required<number>();
  readonly endAngle = input.required<number>();
  readonly colorIndex = input(1);
  readonly label = input('');
  readonly ariaLabel = input('');

  protected readonly SIZE = SIZE;

  protected readonly trackPath = computed(() => arcPath(CX, CY, R, this.startAngle(), this.endAngle()));
  protected readonly valuePath = computed(() =>
    arcPath(
      CX,
      CY,
      R,
      this.startAngle(),
      valueToAngle(this.value(), this.min(), this.max(), this.startAngle(), this.endAngle()),
    ),
  );

  private readonly idx = computed(() => Math.min(5, Math.max(1, this.colorIndex())) - 1);
  protected readonly valueClass = computed(() => STROKE[this.idx()]!);

  /**
   * Give the value human context ("72 of 100") instead of a bare number, which
   * `aria-valuenow` already provides. The label is carried by aria-label, so it
   * isn't repeated here.
   */
  protected readonly valueText = computed(() => `${this.value()} of ${this.max()}`);
}
