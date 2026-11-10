import { pathToFileURL } from 'node:url';

export function workerName(branch, { previewOnly = false } = {}) {
  if (typeof branch !== 'string' || !branch.trim()) throw new Error('A branch name is required');
  if (branch === 'main') {
    if (previewOnly) throw new Error('Refusing to delete production');
    return 'desidia';
  }
  const safe = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'branch';
  const name = safe.slice(0, 63).replace(/-+$/, '');
  if (name === 'desidia') throw new Error('Worker name desidia is reserved for production');
  return name;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(workerName(process.argv[2], { previewOnly: process.argv.includes('--preview-only') }));
}
