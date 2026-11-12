import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { commitSha } from '../scripts/commit.mjs';

test('commit SHA uses Git locally, honors the build environment, and rejects invalid values', t => {
  const original = process.env.GITHUB_SHA;
  t.after(() => {
    if (original === undefined) delete process.env.GITHUB_SHA;
    else process.env.GITHUB_SHA = original;
  });
  delete process.env.GITHUB_SHA;
  assert.equal(commitSha(), execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
  process.env.GITHUB_SHA = 'A'.repeat(40);
  assert.equal(commitSha(), 'A'.repeat(40));
  for (const invalid of ['abc123', 'g'.repeat(40), ' '.repeat(40), `${'a'.repeat(40)}\n`]) {
    process.env.GITHUB_SHA = invalid;
    assert.throws(commitSha, /full Git commit SHA/);
  }
});
