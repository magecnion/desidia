import { execFileSync } from 'node:child_process';

/** The code commit being built: `GITHUB_SHA` in CI, the local `HEAD` otherwise. */
export function resolveCommitSha(configured = process.env.GITHUB_SHA): string {
  const sha = configured || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Expected a full Git commit SHA');
  return sha;
}
