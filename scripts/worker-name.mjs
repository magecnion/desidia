import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function workerName(branch, { previewOnly = false } = {}) {
  if (typeof branch !== 'string' || !branch.trim()) throw new Error('A branch name is required');
  if (branch === 'main') {
    if (previewOnly) throw new Error('Refusing to delete production');
    return 'desidia';
  }
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 12);
  const safe = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'branch';
  // 63 characters: prefix (8), branch (42), separator (1), hash (12).
  return `desidia-${safe.slice(0, 42).replace(/-+$/, '')}-${hash}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(workerName(process.argv[2], { previewOnly: process.argv.includes('--preview-only') }));
}
