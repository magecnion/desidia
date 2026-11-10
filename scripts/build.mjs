import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Expected a full Git commit SHA');
const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(new URL('index.html', dist), html.replaceAll('{{COMMIT_SHA}}', sha));
console.log(`Built commit ${sha}`);
