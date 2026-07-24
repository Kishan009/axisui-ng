#!/usr/bin/env node
// Zero-dependency bundle size gate over the APF dist output.
//
//   node bench.mjs check    measure dist/libs/* fesm2022 bundles, compare to budgets.json, exit 1 on regression
//   node bench.mjs update   re-seed budgets.json from the current measurements (+ headroom)
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DIST = join(ROOT, 'dist', 'libs');
const BUDGETS = join(HERE, 'budgets.json');

const out = (s) => process.stdout.write(s + '\n');
const err = (s) => process.stderr.write(s + '\n');

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function isOverBudget(actual, budget, tolerancePct) {
  if (!budget) return false;
  return actual > budget * (1 + tolerancePct / 100);
}

function findFesm(pkgDir) {
  const fesm = join(pkgDir, 'fesm2022');
  if (!existsSync(fesm)) return null;
  const mjs = readdirSync(fesm).filter((f) => f.endsWith('.mjs'));
  if (!mjs.length) return null;
  // Pick the largest .mjs (the primary entry); ignore secondary-entry chunks.
  return mjs
    .map((f) => ({ f, size: statSync(join(fesm, f)).size }))
    .sort((a, b) => b.size - a.size)[0];
}

function measureAll() {
  if (!existsSync(DIST)) {
    err(`No dist output at ${DIST}. Run: nx run-many -t build`);
    process.exit(2);
  }
  const results = [];
  for (const pkg of readdirSync(DIST).sort()) {
    const pkgDir = join(DIST, pkg);
    if (!statSync(pkgDir).isDirectory()) continue;
    const primary = findFesm(pkgDir);
    if (!primary) continue;
    const buf = readFileSync(join(pkgDir, 'fesm2022', primary.f));
    results.push({
      pkg,
      raw: buf.length,
      gzip: gzipSync(buf).length,
      brotli: brotliCompressSync(buf).length,
    });
  }
  return results;
}

function loadBudgets() {
  if (!existsSync(BUDGETS)) return { tolerancePct: 5, packages: {} };
  return JSON.parse(readFileSync(BUDGETS, 'utf8'));
}

function check() {
  const { tolerancePct = 5, packages = {} } = loadBudgets();
  const results = measureAll();
  const pad = (s, n) => String(s).padEnd(n);
  out(`\n${pad('package', 22)}${pad('raw', 12)}${pad('gzip', 12)}${pad('brotli', 12)}${pad('budget(gz)', 12)}status`);
  let failed = false;
  for (const r of results) {
    const b = packages[r.pkg] || {};
    const over = isOverBudget(r.gzip, b.maxGzip, tolerancePct) || isOverBudget(r.brotli, b.maxBrotli, tolerancePct);
    if (over) failed = true;
    out(
      `${pad(r.pkg, 22)}${pad(formatBytes(r.raw), 12)}${pad(formatBytes(r.gzip), 12)}` +
        `${pad(formatBytes(r.brotli), 12)}${pad(b.maxGzip ? formatBytes(b.maxGzip) : '-', 12)}` +
        `${over ? 'OVER x' : 'ok'}`,
    );
  }
  out('');
  if (failed) {
    err('Bundle budget exceeded. Investigate, or run `nx run bundle-bench:update` if intended.');
    process.exit(1);
  }
  out('All bundles within budget.');
}

function update() {
  const results = measureAll();
  const packages = {};
  // headroom: round up to the next 0.5 KB after a 10% margin.
  const headroom = (n) => Math.ceil((n * 1.1) / 512) * 512;
  for (const r of results) {
    packages[r.pkg] = { maxGzip: headroom(r.gzip), maxBrotli: headroom(r.brotli) };
  }
  writeFileSync(BUDGETS, JSON.stringify({ tolerancePct: 5, packages }, null, 2) + '\n');
  out(`Wrote budgets for ${results.length} packages to ${BUDGETS}`);
}

// Only run the CLI when executed directly (not when imported by the test runner).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  if (mode === 'check') check();
  else if (mode === 'update') update();
  else {
    err('Usage: node bench.mjs <check|update>');
    process.exit(2);
  }
}
