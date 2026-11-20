// gta6-trophy-guide-01 — r2c entrypoint, written by hand for this build.
//
// What it does, in order:
//   1. Reads app/data/trophies.json and refuses to continue unless it holds
//      exactly 55 trophies, each with a non-empty name, description, grade
//      and guide. A dataset that lost a trophy (or gained a blank guide)
//      must fail loudly here, never reach the judge.
//   2. Checks screenshots/: between 1 and 4 files, each at most 256 KiB.
//   3. Copies app/ and screenshots/ beside this file into the output
//      directory (MAKEFUN_OUTPUT_DIR, or /output inside the grader).
//   4. Writes output/dossier.json through the vendored make.fun library.
//      vendor/makefun-frontend.ts is the kit's own file, untouched — the
//      scorer requires dossier.json to be byte-for-byte what its copy
//      writes, so nothing in this file re-implements that part.
//
// Run it outside the grader with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// (Node 22+ runs this TypeScript file directly; standard library only.)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const EXPECTED_TROPHIES = 55;
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144; // 256 KiB, the scorer's cap

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function abort(message: string): never {
  console.error(`[r2c build] FAILED: ${message}`);
  process.exit(1);
}

// --- Step 1: the trophy dataset must be complete and non-empty. ---------
const dataPath = join(here, 'app', 'data', 'trophies.json');
if (!existsSync(dataPath)) abort(`missing dataset: ${dataPath}`);
let dataset: unknown;
try {
  dataset = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (err) {
  abort(`trophies.json is not valid JSON: ${(err as Error).message}`);
}
const trophies = (dataset as { trophies?: unknown[] }).trophies;
if (!Array.isArray(trophies)) abort('trophies.json has no "trophies" array');
if (trophies.length !== EXPECTED_TROPHIES) {
  abort(`expected ${EXPECTED_TROPHIES} trophies, found ${trophies.length}`);
}
const seenIds = new Set<number>();
for (const [index, entry] of trophies.entries()) {
  const t = entry as Record<string, unknown>;
  for (const field of ['name', 'desc', 'grade', 'guide']) {
    if (typeof t[field] !== 'string' || (t[field] as string).trim() === '') {
      abort(`trophy #${index + 1} is missing a usable "${field}"`);
    }
  }
  if (typeof t.id !== 'number' || seenIds.has(t.id)) {
    abort(`trophy #${index + 1} has a missing or duplicate id`);
  }
  seenIds.add(t.id);
}
if (!trophies.some((t) => (t as Record<string, unknown>).name === 'Strangers & Freaks')) {
  abort('dataset is missing "Strangers & Freaks"');
}
console.log(`[r2c build] dataset OK: ${trophies.length} trophies, all with guides`);

// --- Step 2: screenshots must fit the scorer's caps. --------------------
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) abort('missing screenshots/ directory');
const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotFiles.length < 1 || shotFiles.length > MAX_SCREENSHOTS) {
  abort(`expected 1-${MAX_SCREENSHOTS} screenshots, found ${shotFiles.length}`);
}
for (const name of shotFiles) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > MAX_SCREENSHOT_BYTES) {
    abort(`screenshot ${name} is ${size} bytes, over the ${MAX_SCREENSHOT_BYTES} cap`);
  }
}
console.log(`[r2c build] screenshots OK: ${shotFiles.length} file(s), all under 256 KiB`);

// --- Step 3: stage the app and its screenshots into the output dir. -----
mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// --- Step 4: write the dossier the judge reads. -------------------------
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log(`[r2c build] done: dossier written to ${join(outDir, 'dossier.json')}`);
