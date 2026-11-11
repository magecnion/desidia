import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test, { type TestContext } from 'node:test';
import { resolveCommitSha } from '../build/commit-sha.ts';
import { resolveContentDirectory } from '../build/content-directory.ts';

const root = join(import.meta.dirname, '..');
const sha = 'a'.repeat(40);

async function temporaryDirectory(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'desidia-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

/** Runs the real Astro build into a temporary output directory. */
function build(outDir: string, contentDirectory?: string) {
  const env: NodeJS.ProcessEnv = { ...process.env, GITHUB_SHA: sha };
  delete env.CONTENT_DIR;
  if (contentDirectory !== undefined) env.CONTENT_DIR = contentDirectory;
  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], {
    cwd: root,
    env,
    stdio: 'pipe',
  });
}

test('commit SHA comes from GITHUB_SHA and must be a full SHA', () => {
  assert.equal(resolveCommitSha(sha), sha);
  assert.match(resolveCommitSha(''), /^[a-f0-9]{40}$/);
  assert.throws(() => resolveCommitSha('abc123'), /full Git commit SHA/);
});

test('content directory defaults to ./sample-content and resolves CONTENT_DIR from the root', async t => {
  const external = await temporaryDirectory(t);
  assert.equal(resolveContentDirectory(undefined, root), join(root, 'sample-content'));
  assert.equal(resolveContentDirectory(external, root), external);
  assert.equal(resolveContentDirectory(relative(root, external), root), external);
});

test('content directory rejects empty, missing and non-directory paths', async t => {
  const directory = await temporaryDirectory(t);
  await writeFile(join(directory, 'file'), 'not a directory');
  for (const configured of ['', ' ']) {
    assert.throws(() => resolveContentDirectory(configured, root), /must not be empty/);
  }
  for (const configured of [join(directory, 'missing'), join(directory, 'file')]) {
    assert.throws(() => resolveContentDirectory(configured, root), /must point to a directory/);
  }
});

test('build renders the commit, publishes the CMS and copies uploaded media', async t => {
  const outDir = await temporaryDirectory(t);
  const content = await temporaryDirectory(t);
  await mkdir(join(content, 'media/nested'), { recursive: true });
  const image = Buffer.from([0, 255, 137, 80, 78, 71]);
  await writeFile(join(content, 'media/nested/image #1.png'), image);
  await writeFile(join(content, 'media/README.md'), 'auxiliary');
  await writeFile(join(content, 'media/nested/.gitkeep'), 'auxiliary');

  build(outDir, content);

  assert.ok((await readFile(join(outDir, 'index.html'), 'utf8')).includes(`<code>${sha}</code>`));
  for (const file of ['index.html', 'config.yml']) {
    assert.equal(await readFile(join(outDir, 'admin', file), 'utf8'),
      await readFile(join(root, 'public/admin', file), 'utf8'));
  }
  const config = await readFile(join(outDir, 'admin/config.yml'), 'utf8');
  const mediaFolder = config.match(/^media_folder: (\S+)$/m)![1];
  const media = join(outDir, mediaFolder);
  assert.deepEqual(await readFile(join(media, 'nested/image #1.png')), image);
  for (const file of ['README.md', 'nested/.gitkeep']) {
    await assert.rejects(stat(join(media, file)), { code: 'ENOENT' });
  }
});

test('build rejects artists that break the domain schema and keeps the previous output', async t => {
  const outDir = await temporaryDirectory(t);
  const content = await temporaryDirectory(t);
  await mkdir(join(content, 'artists'));
  const artist = join(content, 'artists/artist.json');
  await writeFile(artist, '{"name":"valid"}');
  build(outDir, content);
  const previous = await readFile(join(outDir, 'index.html'), 'utf8');

  for (const value of ['{broken', '{}', '{"name":" "}', '{"name":123}', '{"name":"valid","bio":"unknown"}']) {
    await writeFile(artist, value);
    assert.throws(() => build(outDir, content), /artist/);
    assert.equal(await readFile(join(outDir, 'index.html'), 'utf8'), previous);
  }
});

test('build fails before writing output when the media path is not a directory', async t => {
  const outDir = join(await temporaryDirectory(t), 'dist');
  const content = await temporaryDirectory(t);
  await writeFile(join(content, 'media'), 'not a directory');
  assert.throws(() => build(outDir, content), /Content media must be a directory/);
  await assert.rejects(stat(outDir), { code: 'ENOENT' });
});

test('build lists artists sorted by name and escapes their names', async t => {
  const outDir = await temporaryDirectory(t);
  const content = await temporaryDirectory(t);
  await mkdir(join(content, 'artists'));
  await writeFile(join(content, 'artists/b.json'), '{"name":"Marco <Ruiz> & \'co\'"}');
  await writeFile(join(content, 'artists/a.json'), '{"name":"Ana Pérez"}');
  for (const file of ['README.md', '.gitkeep']) await writeFile(join(content, 'artists', file), 'not JSON');

  build(outDir, content);

  const html = await readFile(join(outDir, 'index.html'), 'utf8');
  assert.match(html, /<li>Ana Pérez<\/li><li>Marco &lt;Ruiz&gt; &amp; &#39;co&#39;<\/li>/);
});

test('build shows an empty state without artists and drops deleted artists', async t => {
  const outDir = await temporaryDirectory(t);
  const content = await temporaryDirectory(t);
  build(outDir, content);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /No artists yet\./);

  await mkdir(join(content, 'artists'));
  await writeFile(join(content, 'artists/artist.json'), '{"name":"test"}');
  build(outDir, content);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /<li>test<\/li>/);

  await rm(join(content, 'artists/artist.json'));
  build(outDir, content);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /No artists yet\./);
});

test('build uses the sample content when CONTENT_DIR is not set', async t => {
  const outDir = await temporaryDirectory(t);
  build(outDir);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /<li>Ana Pérez<\/li>/);
});
