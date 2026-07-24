/**
 * @axisui-ng/angular — the full AxisUI component library.
 *
 * This meta-package re-exports every MIT category so a consumer can install one
 * package and import anything:
 *
 *   import { AxButtonComponent, AxInputComponent } from '@axisui-ng/angular';
 *
 * For surgical installs, depend on the individual category packages instead
 * (e.g. `@axisui-ng/buttons`, `@axisui-ng/forms`) — they are the same code.
 *
 * The commercial `@axisui-ng/pro` tier is intentionally NOT re-exported here.
 */

// `cn` (clsx + tailwind-merge) is re-exported by every category lib. Re-export
// it explicitly once so it wins over the ambiguous `export *` copies (TS2308).
export { cn } from '@axisui-ng/primitives';

// `findNode` collides between @axisui-ng/data (grid) and @axisui-ng/tree. They are
// different functions; the barrel resolves it to tree's. For data's, import from
// the `@axisui-ng/data` package directly.
export { findNode } from '@axisui-ng/tree';

export * from '@axisui-ng/primitives';
export * from '@axisui-ng/icons';
export * from '@axisui-ng/themes';
export * from '@axisui-ng/buttons';
export * from '@axisui-ng/forms';
export * from '@axisui-ng/data';
export * from '@axisui-ng/feedback';
export * from '@axisui-ng/overlays';
export * from '@axisui-ng/navigation';
export * from '@axisui-ng/misc';
export * from '@axisui-ng/flow';
export * from '@axisui-ng/cdk';
export * from '@axisui-ng/tree';
export * from '@axisui-ng/layout';
export * from '@axisui-ng/charts';
export * from '@axisui-ng/blocks';
