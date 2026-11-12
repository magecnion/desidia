import { execFileSync } from 'node:child_process';

export function commitSha() {
  const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (sha.length !== 40 || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Expected a full Git commit SHA');
  return sha;
}
