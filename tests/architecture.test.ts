import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import test from 'node:test';

const src = join(import.meta.dirname, '../src');

/** Every import specifier of every source file under `directory`. */
async function imports(directory: string) {
  const files = (await readdir(join(src, directory), { recursive: true }))
    .filter(file => /\.(ts|astro)$/.test(file));
  return Promise.all(files.map(async file => {
    const code = await readFile(join(src, directory, file), 'utf8');
    const specifiers = [...code.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm)]
      .map(match => match[1]);
    return { file: relative(src, join(src, directory, file)), specifiers };
  }));
}

function assertNoImports(found: Awaited<ReturnType<typeof imports>>, forbidden: RegExp) {
  for (const { file, specifiers } of found) {
    for (const specifier of specifiers) {
      assert.doesNotMatch(specifier, forbidden, `${file} must not import ${specifier}`);
    }
  }
}

test('the domain depends on nothing but zod', async () => {
  for (const { file, specifiers } of await imports('domain')) {
    for (const specifier of specifiers) {
      assert.ok(specifier === 'zod' || /^\.\/[^/]+$/.test(specifier), `${file} must not import ${specifier}`);
    }
  }
});

test('the application depends on the domain, not on adapters or Astro', async () => {
  assertNoImports(await imports('application'), /adapters|^astro/);
});

test('pages reach content through services, not through adapters or Astro collections', async () => {
  assertNoImports(await imports('pages'), /adapters|^astro:content$/);
});
