import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = resolve('.');
await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist/cjs'), { recursive: true });
await Promise.all([['esm', 'dist/index.js'], ['cjs', 'dist/cjs/index.js']].map(([format, outfile]) => build({
  absWorkingDir: root, entryPoints: ['src/index.js'], outfile, bundle: true, minify: true, sourcemap: true,
  format, platform: 'neutral', target: 'es2020', external: ['react'], banner: { js: '"use client";' },
})));
await writeFile(resolve(root, 'dist/cjs/package.json'), '{"type":"commonjs"}\n');
await copyFile(resolve(root, 'src/index.d.ts'), resolve(root, 'dist/index.d.ts'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.browser, pkg.module);
assert.equal(pkg.exports['.'].require, pkg.main);
assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
const esm = await import(pathToFileURL(resolve(root, pkg.module)));
const require = createRequire(resolve(root, 'package.json'));
const cjs = require(resolve(root, pkg.main));
for (const name of Object.keys(esm)) assert.ok(name in cjs, `Missing CommonJS export: ${name}`);
assert.ok(esm.default);
await build({ absWorkingDir: root, entryPoints: [pkg.browser], bundle: true, write: false, platform: 'browser', format: 'esm', external: ['react'], logLevel: 'silent' });
const bytes = await readFile(resolve(root, pkg.module));
const size = gzipSync(bytes).length;
assert.ok(size < 10240, 'Bundle exceeds 10 KiB gzip.');
console.log(`${pkg.name}: ${bytes.length} bytes minified; ${size} bytes gzip. React external; 0 other runtime dependencies.`);
console.log('ESM, CommonJS, browser entry and declarations verified.');