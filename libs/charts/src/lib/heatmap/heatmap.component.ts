import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { binIndex, matrixExtent, normalize } from './heatmap-core';

const FILL = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5'];

interface Cell {
  key: string;
  x: number;
  y: number;
  size: number;
  fillClass: string;
  opacity: number | null;
  title: string;
}

/**
 * Heatmap — a grid of value-colored cells over heatmap-core. `scale='sequential'`
 * varies one token's fill-opacity; `scale='bins'` maps to chart-1..5. Per-cell
 * <title> tooltip; role="img".
 */
@Component({
  selector: 'ax-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + svgW() + ' ' + svgH()"
      [attr.width]="svgW()"
      [attr.height]="svgH()"
      role="img"
      [attr.aria-label]="summary()"
      xmlns="http://www.w3.org/2000/svg"
    >
      @for (c of colLabels(); track c.i) {
        <text [attr.x]="c.x" [attr.y]="12" text-anchor="middle" class="fill-muted-foreground" font-size="10">{{ c.label }}</text>
      }
      @for (r of rowLabels(); track r.i) {
        <text
          [attr.x]="gutterX() - 6"
          [attr.y]="r.y"
          text-anchor="end"
          dominant-baseline="middle"
          class="fill-muted-foreground"
          font-size="10"
        >
          {{ r.label }}
        </text>
      }
      @for (cell of cells(); track cell.key) {
        <rect
          [attr.x]="cell.x"
          [attr.y]="cell.y"
          [attr.width]="cell.size - 2"
          [attr.height]="cell.size - 2"
          rx="2"
          [attr.class]="cell.fillClass"
          [attr.fill-opacity]="cell.opacity"
        >
          <title>{{ cell.title }}</title>
        </rect>
      }
    </svg>

    <!-- Non-visual alternative: the matrix as a visually-hidden table so the cell
         values are reachable by screen readers, not only via hover <title>. -->
    @if (matrix().length > 0) {
      <table class="sr-only" data-heatmap-table>
        <caption>{{ summary() }}</caption>
        <thead>
          <tr>
            <td></td>
            @for (h of colHeaders(); track $index) {
              <th scope="col">{{ h }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of tableRows(); track $index) {
            <tr>
              <th scope="row">{{ row.label }}</th>
              @for (v of row.values; track $index) {
                <td>{{ v }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AxHeatmapComponent {
  readonly matrix = input<number[][]>([]);
  readonly rows = input<string[]>([]);
  readonly cols = input<string[]>([]);
  readonly scale = input<'sequential' | 'bins'>('sequential');
  readonly bins = input(5);
  readonly colorIndex = input(1);
  readonly cellSize = input(28);
  readonly ariaLabel = input('');

  protected readonly colCount = computed(() => Math.max(0, ...this.matrix().map((r) => r.length)));
  protected readonly rowCount = computed(() => this.matrix().length);
  protected readonly gutterX = computed(() => (this.rows().length ? 56 : 0));
  private readonly gutterY = computed(() => (this.cols().length ? 16 : 0));

  protected readonly svgW = computed(() => this.gutterX() + this.colCount() * this.cellSize());
  protected readonly svgH = computed(() => this.gutterY() + this.rowCount() * this.cellSize());

  protected readonly colLabels = computed(() =>
    this.cols().map((label, i) => ({ i, label, x: this.gutterX() + i * this.cellSize() + this.cellSize() / 2 })),
  );
  protected readonly rowLabels = computed(() =>
    this.rows().map((label, i) => ({ i, label, y: this.gutterY() + i * this.cellSize() + this.cellSize() / 2 })),
  );

  protected readonly cells = computed<Cell[]>(() => {
    const m = this.matrix();
    const { min, max } = matrixExtent(m);
    const size = this.cellSize();
    const seq = this.scale() === 'sequential';
    const baseFill = FILL[Math.min(5, Math.max(1, this.colorIndex())) - 1]!;
    const out: Cell[] = [];
    for (let r = 0; r < m.length; r++) {
      const row = m[r]!;
      for (let c = 0; c < row.length; c++) {
        const v = row[c]!;
        const n = normalize(v, min, max);
        const fillClass = seq ? baseFill : FILL[Math.min(5, binIndex(n, this.bins())) - 1]!;
        out.push({
          key: `${r}-${c}`,
          x: this.gutterX() + c * size,
          y: this.gutterY() + r * size,
          size,
          fillClass,
          // Floor the opacity at 0.3 (not 0.1) so low-value cells stay perceivable
          // and keep enough contrast against the surface (WCAG 1.4.11).
          opacity: seq ? Math.round((0.3 + 0.7 * n) * 100) / 100 : null,
          title: String(v),
        });
      }
    }
    return out;
  });

  /** Column header labels for the sr-only table (falls back to 1-based index). */
  protected readonly colHeaders = computed(() => {
    const cols = this.cols();
    return Array.from({ length: this.colCount() }, (_, c) => cols[c] ?? String(c + 1));
  });

  /** Rows for the sr-only table: a label + the raw cell values. */
  protected readonly tableRows = computed(() => {
    const rows = this.rows();
    return this.matrix().map((row, r) => ({ label: rows[r] ?? String(r + 1), values: row }));
  });

  protected readonly summary = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel();
    const m = this.matrix();
    if (!m.length) return 'Heatmap, no data';
    const { min, max } = matrixExtent(m);
    return `Heatmap, ${this.rowCount()} rows by ${this.colCount()} columns, values ${min} to ${max}`;
  });
}
