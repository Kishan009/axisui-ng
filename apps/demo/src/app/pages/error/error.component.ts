import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxResultComponent, type ResultStatus } from '@axisui-ng/feedback';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

@Component({
  selector: 'demo-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxResultComponent, AxButtonComponent, AxStackDirective, AxClusterDirective],
  template: `
    <div axStack gap="4" class="mx-auto max-w-lg py-10">
      <ax-result [status]="status()" [title]="heading()" [description]="detail()">
        <div axCluster gap="2" class="justify-center">
          <ax-button variant="primary" size="sm" (clickEvent)="go('/')">Go home</ax-button>
          <ax-button variant="outline" size="sm" (clickEvent)="go('/ui-kit')">UI Kit</ax-button>
          @if (code() === '404') {
            <ax-button variant="ghost" size="sm" (clickEvent)="go('/error/500')">See 500 sample</ax-button>
          } @else {
            <ax-button variant="ghost" size="sm" (clickEvent)="go('/error/404')">See 404 sample</ax-button>
          }
        </div>
      </ax-result>
    </div>
  `,
})
export class ErrorPageComponent {
  /** Bound from route `data.code` via withComponentInputBinding. */
  readonly code = input<'404' | '500'>('404');

  private readonly router = inject(Router);

  readonly status = computed<ResultStatus>(() => (this.code() === '500' ? 'error' : 'warning'));
  readonly heading = computed(() =>
    this.code() === '500' ? 'Something went wrong' : 'Page not found',
  );
  readonly detail = computed(() =>
    this.code() === '500'
      ? 'Mock server error for the Apollo-style template pack.'
      : 'No matching route. Try a sidebar link or open the command palette (Ctrl/⌘+K).',
  );

  go(path: string): void {
    void this.router.navigateByUrl(path);
  }
}
