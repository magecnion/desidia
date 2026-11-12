import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function resolveContentDirectory() {
  const configured = process.env.CONTENT_DIR;
  if (configured !== undefined && !configured.trim()) throw new Error('CONTENT_DIR must not be empty');
  const directory = configured === undefined
    ? fileURLToPath(new URL('../content/', import.meta.url))
    : resolve(configured);
  const info = await stat(directory).catch(error => {
    if (configured === undefined && error.code === 'ENOENT') return null;
    throw error;
  });
  if (info && !info.isDirectory()) throw new Error('CONTENT_DIR must point to a directory');
  return directory;
}
