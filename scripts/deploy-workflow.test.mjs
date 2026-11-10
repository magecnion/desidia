import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const deploy = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const signal = await readFile(new URL('../.github/workflows/content-published.yml', import.meta.url), 'utf8');
const condition = deploy.match(/^    if: >-\n((?:      .+\n)+)/m)?.[1];
assert.ok(condition, 'Expected a deployment job condition');
// This condition uses only syntax shared by GitHub expressions and JavaScript.
const shouldDeploy = new Function('github', `return (${condition});`);

function notification(overrides = {}) {
  return {
    ref_type: 'branch',
    ref: 'refs/heads/main',
    ref_name: 'main',
    repository: 'owner/repository',
    event_name: 'workflow_run',
    event: {
      workflow_run: {
        conclusion: 'success',
        event: 'push',
        head_branch: 'content',
        head_repository: { full_name: 'owner/repository' },
        ...overrides,
      },
    },
  };
}

test('successful content signals deploy production using code from main', () => {
  assert.equal(shouldDeploy(notification()), true);
  assert.match(deploy, /workflow_run:\n    workflows: \[Content published\]\n    types: \[completed\]\n    branches: \[content\]/);
  assert.match(deploy, /ref: refs\/heads\/\$\{\{ github.ref_name \}\}/);
  assert.match(deploy, /ref: refs\/heads\/content\n          path: \.deployment-content/);
});

test('failed, cancelled, skipped, and unfinished content signals cannot deploy', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', null]) {
    assert.equal(shouldDeploy(notification({ conclusion })), false);
  }
});

test('signals from other branches, repositories, or event types cannot deploy', () => {
  for (const overrides of [
    { head_branch: 'feature/example' },
    { head_repository: { full_name: 'someone/fork' } },
    { event: 'pull_request' },
    { event: 'workflow_dispatch' },
  ]) {
    assert.equal(shouldDeploy(notification(overrides)), false);
  }
  assert.equal(shouldDeploy({ ...notification(), ref: 'refs/heads/feature/example' }), false);
});

test('manual previews and production pushes remain supported but tags cannot deploy', () => {
  for (const branch of ['main', 'feat/add-sveltia-cms']) {
    const github = {
      ...notification(), event_name: 'workflow_dispatch', event: {},
      ref: `refs/heads/${branch}`, ref_name: branch,
    };
    assert.equal(shouldDeploy(github), true);
    assert.equal(shouldDeploy({ ...github, ref_type: 'tag' }), false);
  }
  assert.equal(shouldDeploy({ ...notification(), event_name: 'push', event: {} }), true);
  assert.match(deploy, /  push:\n    branches: \[main\]\n  workflow_dispatch:/);
});

test('content notification needs no token permissions, checkout, artifacts, or secrets', () => {
  assert.match(signal, /^name: Content published$/m);
  assert.match(signal, /  push:\n    branches: \[content\]/);
  assert.match(signal, /^permissions: \{\}$/m);
  assert.doesNotMatch(signal, /uses:|secrets\.|github\.token|artifacts|workflow_dispatch/);
  assert.doesNotMatch(deploy, /download-artifact|workflow_run\.head_sha/);
});

test('automatic and manual production deployments retain the same concurrency and read-only token', () => {
  assert.match(deploy, /^permissions:\n  contents: read$/m);
  assert.match(deploy, /group: worker-\$\{\{ github.repository \}\}-\$\{\{ github.ref_name \}\}/);
  assert.match(deploy, /cancel-in-progress: false/);
});
