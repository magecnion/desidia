import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'desidia-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of ['scripts/build.mjs', 'src/index.html', 'admin']) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await cp(new URL(`../${path}`, import.meta.url), join(root, path), { recursive: true });
  }
  return root;
}

function build(root) {
  execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root,
    env: { ...process.env, GITHUB_SHA: 'a'.repeat(40) },
  });
}

test('build escapes artist names, preserves literal template text, and copies admin assets', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'content/artists'), { recursive: true });
  await writeFile(join(root, 'content/artists/artist.json'), JSON.stringify({
    name: '<script>alert("x")</script> & \' {{COMMIT_SHA}} $&',
  }));
  build(root);
  const html = await readFile(join(root, 'dist/index.html'), 'utf8');
  assert.ok(html.includes('<li>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39; {{COMMIT_SHA}} $&amp;</li>'));
  assert.ok(html.includes(`<code>${'a'.repeat(40)}</code>`));
  for (const file of ['index.html', 'config.yml']) {
    assert.equal(await readFile(join(root, 'dist/admin', file), 'utf8'),
      await readFile(join(root, 'admin', file), 'utf8'));
  }
});

test('build supports both a missing artists directory and an empty collection', async t => {
  const root = await fixture(t);
  build(root);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
  await mkdir(join(root, 'content/artists'), { recursive: true });
  build(root);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
});
