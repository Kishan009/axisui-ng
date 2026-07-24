/**
 * @axisui-ng/primitives — Public API barrel.
 * Layout primitives (Box, Stack, Cluster, Grid, AspectRatio) plus the
 * typographic primitives (Text, Heading) for @axisui-ng/angular.
 *
 * Consumers:
 *   import { AxBoxDirective, AxStackDirective, AxClusterDirective, AxGridDirective } from '@axisui-ng/primitives';
 *   import { AxTextDirective, AxHeadingDirective } from '@axisui-ng/primitives';
 *   import { cn } from '@axisui-ng/primitives';
 */

export * from './lib/box';
export * from './lib/stack';
export * from './lib/cluster';
export * from './lib/grid';
export * from './lib/aspect-ratio';
export * from './lib/text';
export * from './lib/heading';
export { cn } from './lib/_utils/cn';
