#!/usr/bin/env node
/**
 * extract-svg-paths.ts — placeholder for the icon codegen pipeline.
 *
 * Reads SVG files from libs/icons/src/svg/, runs them through SVGO
 * (TODO), and writes the optimized inner content into
 * libs/registry.ts. This script is a stub for v0.1: the registry
 * is hand-written to keep the first 30 icons reviewable as a
 * reference set. Replaced by the real codegen in v0.2 when the
 * library expands to 80+ icons.
 *
 * Usage (future):
 *   pnpm tsx scripts/extract-svg-paths.ts
 */

import { existsSync, readdirSync } from 'node:fs';

const SVG_DIR = new URL('../src/svg/', import.meta.url);

const svgDirPath = SVG_DIR.pathname.replace(/^\/(\w):/, '$1:');

if (!existsSync(svgDirPath)) {
  process.exit(0);
}

const files = readdirSync(svgDirPath).filter((f) => f.endsWith('.svg'));
if (files.length === 0) {
  process.exit(0);
}

process.stderr.write(
  '[extract-svg-paths] stub: svg/ directory is not empty. ' +
  'Implement real codegen in v0.2 when expanding to 80+ icons. ' +
  'Until then, edit libs/icons/src/lib/registry.ts by hand.\n'
);
process.exit(1);
