/**
 * Smoke tests for the Primitives lib.
 * Confirms the build pipeline (jest, ng-packagr) works end-to-end
 * before the real component specs land.
 */

import { AxBoxDirective } from './box/box.directive';
import { AxClusterDirective } from './cluster/cluster.directive';
import { AxGridDirective } from './grid/grid.directive';
import { AxStackDirective } from './stack/stack.directive';

describe('@axisui-ng/primitives', () => {
  it('exports four standalone directives', () => {
    expect(AxBoxDirective).toBeDefined();
    expect(AxStackDirective).toBeDefined();
    expect(AxClusterDirective).toBeDefined();
    expect(AxGridDirective).toBeDefined();
  });

  it('all directives are standalone', () => {
    // standalone: true is set on the decorator metadata
    expect((AxBoxDirective as unknown as { ɵdir: { standalone: boolean } }).ɵdir.standalone).toBe(true);
    expect((AxStackDirective as unknown as { ɵdir: { standalone: boolean } }).ɵdir.standalone).toBe(true);
    expect((AxClusterDirective as unknown as { ɵdir: { standalone: boolean } }).ɵdir.standalone).toBe(true);
    expect((AxGridDirective as unknown as { ɵdir: { standalone: boolean } }).ɵdir.standalone).toBe(true);
  });
});
