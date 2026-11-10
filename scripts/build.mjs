import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Expected a full Git commit SHA');
const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const configuredContent = process.env.CONTENT_DIR;
if (configuredContent !== undefined && !configuredContent.trim()) throw new Error('CONTENT_DIR must not be empty');
const contentDirectory = configuredContent === undefined
  ? fileURLToPath(new URL('../content/', import.meta.url))
  : resolve(configuredContent);
if (configuredContent !== undefined && !(await stat(contentDirectory)).isDirectory()) {
  throw new Error('CONTENT_DIR must point to a directory');
}
const artistsDirectory = join(contentDirectory, 'artists');
const files = await readdir(artistsDirectory).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const names = await Promise.all(files.filter(file => file.endsWith('.json')).sort().map(async file => {
  const artist = JSON.parse(await readFile(join(artistsDirectory, file), 'utf8'));
  if (typeof artist?.name !== 'string' || !artist.name.trim()) {
    throw new Error(`Artist ${file} must have a non-empty name`);
  }
  return artist.name;
}));
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const artistsHtml = names.length
  ? `<ul>\n${names.map(name => `      <li>${escapeHtml(name)}</li>`).join('\n')}\n    </ul>`
  : '<p>No artists yet.</p>';
const mediaDirectory = join(contentDirectory, 'media');
const media = await stat(mediaDirectory).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (media && !media.isDirectory()) throw new Error('Content media must be a directory');
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(new URL('index.html', dist), html.replace(/\{\{(COMMIT_SHA|ARTISTS)\}\}/g,
  (_, key) => key === 'COMMIT_SHA' ? sha : artistsHtml));
await cp(new URL('../admin/', import.meta.url), new URL('admin/', dist), { recursive: true });
if (media) {
  await cp(mediaDirectory, new URL('content/media/', dist), {
    recursive: true,
    filter: source => !['README.md', '.gitkeep'].includes(basename(source)),
  });
}
console.log(`Built commit ${sha}`);
