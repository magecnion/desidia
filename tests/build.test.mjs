import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { appendFile, cp, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { parse } from 'parse5';

function elements(html, tag) {
  const matches = [];
  function visit(node) {
    if (node.tagName === tag) matches.push(node);
    node.childNodes?.forEach(visit);
  }
  visit(parse(html));
  return matches;
}

function text(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
}

async function temporaryDirectory(t) {
  const root = await mkdtemp(join(tmpdir(), 'desidia-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function fixture(t) {
  const root = await temporaryDirectory(t);
  for (const path of ['scripts/media-integration.mjs', 'scripts/content-path.mjs', 'scripts/commit.mjs', 'src', 'public/admin', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml']) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await cp(new URL(`../${path}`, import.meta.url), join(root, path), { recursive: true });
  }
  await symlink(new URL('../node_modules', import.meta.url), join(root, 'node_modules'), 'dir');
  // Fixtures borrow installed tools; pnpm must not relink that shared directory.
  await appendFile(join(root, 'pnpm-workspace.yaml'), '\nverifyDepsBeforeRun: false\n');
  return root;
}

function build(root, contentDirectory, direct = false) {
  const env = { ...process.env, GITHUB_SHA: 'a'.repeat(40) };
  delete env.CONTENT_DIR;
  if (contentDirectory !== undefined) env.CONTENT_DIR = contentDirectory;
  try {
    execFileSync('pnpm', direct ? ['exec', 'astro', 'build'] : ['build'], {
      cwd: root,
      env,
      stdio: 'pipe',
    });
  } catch (error) {
    throw new Error(`${error.message}\n${error.stdout}\n${error.stderr}`);
  }
}

test('Astro dev synchronizes external uploads live and after restart', { timeout: 60000 }, async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  const media = join(external, 'media');
  await mkdir(media);
  await writeFile(join(media, 'old.txt'), 'startup');
  async function start(args) {
    const child = spawn('pnpm', args, {
      cwd: root,
      env: { ...process.env, CONTENT_DIR: external, GITHUB_SHA: 'a'.repeat(40) },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const stop = async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, 'exit');
      process.kill(-child.pid, 'SIGTERM');
      await exited;
    };
    t.after(stop);
    for (let attempt = 0; attempt < 200; attempt++) {
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) return { url, stop };
      if (child.exitCode !== null) throw new Error(output);
      await setTimeout(50);
    }
    throw new Error(`Dev startup timed out: ${output}`);
  }
  async function served(url, path, expected) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const response = await fetch(`${url}${path}`);
      if (expected === null ? response.status === 404 : response.ok && await response.text() === expected) return;
      await setTimeout(50);
    }
    assert.fail(`Did not serve ${path} as ${JSON.stringify(expected)}`);
  }
  const first = await start(['exec', 'astro', 'dev', '--port', '0']);
  await served(first.url, '/content/media/old.txt', 'startup');
  assert.equal((await fetch(`${first.url}/admin/`)).status, 200);
  await writeFile(join(media, 'old.txt'), 'replacement');
  await served(first.url, '/content/media/old.txt', 'replacement');
  await mkdir(join(media, 'nested'));
  await writeFile(join(media, 'nested/new.txt'), 'added');
  await writeFile(join(media, 'README.md'), 'excluded');
  await writeFile(join(media, 'nested/.gitkeep'), 'excluded');
  await served(first.url, '/content/media/nested/new.txt', 'added');
  await served(first.url, '/content/media/README.md', null);
  await served(first.url, '/content/media/nested/.gitkeep', null);
  await rm(join(media, 'old.txt'));
  await served(first.url, '/content/media/old.txt', null);
  await rm(media, { recursive: true });
  await served(first.url, '/content/media/nested/new.txt', null);
  await mkdir(media);
  await writeFile(join(media, 'recreated.txt'), 'recreated');
  await served(first.url, '/content/media/recreated.txt', 'recreated');
  await first.stop();
  await rm(media, { recursive: true });
  const second = await start(['dev', '--port', '0']);
  await served(second.url, '/content/media/recreated.txt', null);
  await mkdir(media);
  await writeFile(join(media, 'restart.txt'), 'restart');
  await served(second.url, '/content/media/restart.txt', 'restart');
  await second.stop();
});

test('build escapes artist names, preserves literal template text, and copies admin assets', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'content/artists'), { recursive: true });
  await writeFile(join(root, 'content/artists/artist.json'), JSON.stringify({
    name: '  <script>alert("x")</script> & \' {{COMMIT_SHA}} $&  ',
  }));
  build(root);
  const html = await readFile(join(root, 'dist/index.html'), 'utf8');
  assert.deepEqual(elements(html, 'li').map(text), ['  <script>alert("x")</script> & \' {{COMMIT_SHA}} $&  ']);
  assert.equal(elements(html, 'script').length, 0);
  assert.deepEqual(elements(html, 'code').map(text), ['a'.repeat(40)]);
  for (const file of ['index.html', 'config.yml']) {
    assert.equal(await readFile(join(root, 'dist/admin', file), 'utf8'),
      await readFile(join(root, 'public/admin', file), 'utf8'));
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
    assert.deepEqual(elements(html, 'li').map(text), ['test <external>']);
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

test('direct Astro builds prepare media and remove deleted artists and media', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await mkdir(join(external, 'artists'));
  await mkdir(join(external, 'media'));
  await writeFile(join(external, 'artists/artist.json'), '{"name":"test"}');
  await writeFile(join(external, 'media/image.png'), 'image');
  build(root, external, true);
  assert.deepEqual(elements(await readFile(join(root, 'dist/index.html'), 'utf8'), 'li').map(text), ['test']);
  assert.equal(await readFile(join(root, 'dist/content/media/image.png'), 'utf8'), 'image');

  await writeFile(join(external, 'media/image.png'), 'replacement');
  build(root, external, true);
  assert.equal(await readFile(join(root, 'dist/content/media/image.png'), 'utf8'), 'replacement');

  await rm(join(external, 'artists/artist.json'));
  await rm(join(external, 'media'), { recursive: true });
  build(root, external, true);
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
  }
});

test('build rejects malformed artist JSON and invalid names', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await mkdir(join(external, 'artists'));
  const artist = join(external, 'artists/artist.json');
  await writeFile(artist, '{"name":"valid"}');
  build(root, external);

  for (const value of ['{broken', '{}', '{"name":" "}', '{"name":123}', 'null']) {
    await writeFile(artist, value);
    assert.throws(() => build(root, external));
  }
});

test('build rejects a media path that is not a directory', async t => {
  const root = await fixture(t);
  const external = await temporaryDirectory(t);
  await writeFile(join(external, 'media'), 'not a directory');
  assert.throws(() => build(root, external), /Content media must be a directory/);
});

test('cached builds switch content roots, preserve filename ordering, and clear missing directories', async t => {
  const root = await fixture(t);
  const a = join(root, 'snapshot-a');
  const b = join(root, 'snapshot-b');
  for (const directory of [a, b]) await mkdir(join(directory, 'artists'), { recursive: true });
  await writeFile(join(a, 'artists/old.json'), '{"name":"old"}');
  build(root, a);
  const entries = [['a.json', 'lowercase'], ['A.json', 'uppercase'], ['a!.json', 'punctuation']];
  for (const [file, name] of entries) await writeFile(join(b, 'artists', file), JSON.stringify({ name }));
  await mkdir(join(b, 'artists/nested'));
  await writeFile(join(b, 'artists/nested/ignored.json'), '{broken');
  build(root, b);
  assert.deepEqual(elements(await readFile(join(root, 'dist/index.html'), 'utf8'), 'li').map(text),
    ['uppercase', 'punctuation', 'lowercase']);
  await assert.rejects(stat(join(root, 'dist/content/artists')), { code: 'ENOENT' });
  await rm(join(b, 'artists'), { recursive: true });
  for (const directory of [b, undefined]) {
    build(root, directory);
    const html = await readFile(join(root, 'dist/index.html'), 'utf8');
    assert.deepEqual(elements(html, 'li'), []);
    assert.match(html, /No artists yet\./);
  }
});
