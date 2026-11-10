import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

async function temporaryDirectory(t) {
  const root = await mkdtemp(join(tmpdir(), 'desidia-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function fixture(t) {
  const root = await temporaryDirectory(t);
  for (const path of ['scripts/build.mjs', 'src/index.html', 'admin']) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await cp(new URL(`../${path}`, import.meta.url), join(root, path), { recursive: true });
  }
  return root;
}

function build(root, contentDirectory) {
  const env = { ...process.env, GITHUB_SHA: 'a'.repeat(40) };
  delete env.CONTENT_DIR;
  if (contentDirectory !== undefined) env.CONTENT_DIR = contentDirectory;
  execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root,
    env,
    stdio: 'pipe',
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

test('build uses external content through absolute and relative paths without falling back to local artists', async t => {
  const root = await fixture(t);
  const external = join(await temporaryDirectory(t), 'content #1');
  await mkdir(join(external, 'artists'), { recursive: true });
  await mkdir(join(root, 'content/artists'), { recursive: true });
  await writeFile(join(root, 'content/artists/local.json'), '{"name":"local only"}');
  const artist = '{"name":"test <external>"}';
  await writeFile(join(external, 'artists/artist #1.json'), artist);

  for (const directory of [external, relative(root, external)]) {
    build(root, directory);
    const html = await readFile(join(root, 'dist/index.html'), 'utf8');
    assert.ok(html.includes('<li>test &lt;external&gt;</li>'));
    assert.ok(!html.includes('local only'));
  }
  assert.equal(await readFile(join(external, 'artists/artist #1.json'), 'utf8'), artist);
  build(root);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('local only'));
});

test('build copies external binary and nested media to the public path configured by the CMS', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await mkdir(join(external, 'media/nested'), { recursive: true });
  await mkdir(join(root, 'content/media'), { recursive: true });
  await writeFile(join(root, 'content/media/local.png'), 'local only');
  const image = Buffer.from([0, 255, 137, 80, 78, 71]);
  await writeFile(join(external, 'media/nested/image #1.png'), image);
  await writeFile(join(external, 'media/README.md'), 'auxiliary');
  await writeFile(join(external, 'media/nested/.gitkeep'), 'auxiliary');

  build(root, external);
  const config = await readFile(join(root, 'dist/admin/config.yml'), 'utf8');
  const mediaFolder = config.match(/^media_folder: (\S+)$/m)[1];
  const publicFolder = config.match(/^public_folder: (\S+)$/m)?.[1] ?? `/${mediaFolder}`;
  assert.equal(publicFolder, '/content/media');
  const publicDirectory = join(root, 'dist', publicFolder.slice(1));
  assert.deepEqual(await readFile(join(publicDirectory, 'nested/image #1.png')), image);
  for (const file of ['local.png', 'README.md', 'nested/.gitkeep']) {
    await assert.rejects(stat(join(publicDirectory, file)), { code: 'ENOENT' });
  }
  assert.deepEqual(await readFile(join(external, 'media/nested/image #1.png')), image);
});

test('build removes deleted artists and media from the next build', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await mkdir(join(external, 'artists'));
  await mkdir(join(external, 'media'));
  await writeFile(join(external, 'artists/artist.json'), '{"name":"test"}');
  await writeFile(join(external, 'media/image.png'), 'image');
  build(root, external);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('<li>test</li>'));
  assert.equal(await readFile(join(root, 'dist/content/media/image.png'), 'utf8'), 'image');

  await rm(join(external, 'artists/artist.json'));
  await rm(join(external, 'media'), { recursive: true });
  build(root, external);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
  await assert.rejects(stat(join(root, 'dist/content/media')), { code: 'ENOENT' });
});

test('build supports external empty collections and ignores auxiliary artist files', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  build(root, external);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
  await mkdir(join(external, 'artists'));
  build(root, external);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
  for (const file of ['README.md', '.gitkeep']) {
    await writeFile(join(external, 'artists', file), 'not JSON');
  }
  build(root, external);
  assert.ok((await readFile(join(root, 'dist/index.html'), 'utf8')).includes('No artists yet.'));
});

test('build rejects invalid content paths instead of generating an empty site', async t => {
  const root = await fixture(t);
  await writeFile(join(root, 'not-a-directory'), 'file');
  for (const directory of ['', ' ', join(root, 'missing'), join(root, 'not-a-directory')]) {
    assert.throws(() => build(root, directory), /CONTENT_DIR|ENOENT/);
    await assert.rejects(stat(join(root, 'dist')), { code: 'ENOENT' });
  }
});

test('build rejects malformed artist JSON and invalid names before replacing the previous output', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await mkdir(join(external, 'artists'));
  const artist = join(external, 'artists/artist.json');
  await writeFile(artist, '{"name":"valid"}');
  build(root, external);
  const previous = await readFile(join(root, 'dist/index.html'), 'utf8');

  for (const value of ['{broken', '{}', '{"name":" "}', '{"name":123}', 'null']) {
    await writeFile(artist, value);
    assert.throws(() => build(root, external), /SyntaxError|must have a non-empty name/);
    assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), previous);
  }
});

test('build rejects a media path that is not a directory', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await writeFile(join(external, 'media'), 'not a directory');
  assert.throws(() => build(root, external), /Content media must be a directory/);
  await assert.rejects(stat(join(root, 'dist')), { code: 'ENOENT' });
});
