import { statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Where the build reads content from. CI points `CONTENT_DIR` at a checkout of the `content` branch;
 * locally it defaults to `./sample-content`, so the site builds without the real content.
 */
export function resolveContentDirectory(configured = process.env.CONTENT_DIR, root = process.cwd()): string {
  if (configured === undefined) return resolve(root, 'sample-content');
  if (!configured.trim()) throw new Error('CONTENT_DIR must not be empty');
  const directory = resolve(root, configured);
  if (!statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error('CONTENT_DIR must point to a directory');
  }
  return directory;
}
