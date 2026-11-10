import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Expected a full Git commit SHA');
const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const artistsDirectory = new URL('../content/artists/', import.meta.url);
const files = await readdir(artistsDirectory).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const names = await Promise.all(files.filter(file => file.endsWith('.json')).sort().map(async file => {
  const artist = JSON.parse(await readFile(new URL(file, artistsDirectory), 'utf8'));
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
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(new URL('index.html', dist), html.replace(/\{\{(COMMIT_SHA|ARTISTS)\}\}/g,
  (_, key) => key === 'COMMIT_SHA' ? sha : artistsHtml));
await cp(new URL('../admin/', import.meta.url), new URL('admin/', dist), { recursive: true });
console.log(`Built commit ${sha}`);
