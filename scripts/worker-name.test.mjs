import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workerName } from './worker-name.mjs';

test('production is explicit and cannot be a cleanup target', () => {
  assert.equal(workerName('main'), 'desidia');
  assert.throws(() => workerName('main', { previewOnly: true }), /production/);
  for (const branch of ['', undefined, ' ']) assert.throws(() => workerName(branch));
});

test('preview names are stable, bounded, and safe', () => {
  for (const branch of ['feature/my-work', 'A'.repeat(300), '你好', '---', 'Main', 'main/child']) {
    const name = workerName(branch, { previewOnly: true });
    assert.match(name, /^desidia-[a-z0-9-]+-[a-f0-9]{12}$/);
    assert.ok(name.length <= 63);
    assert.equal(name, workerName(branch));
    assert.notEqual(name, 'desidia');
  }
});

test('hash distinguishes normalization and truncation collisions', () => {
  const branches = ['feature/a', 'feature-a', 'FEATURE-A', `${'a'.repeat(100)}x`, `${'a'.repeat(100)}y`];
  assert.equal(new Set(branches.map(branch => workerName(branch))).size, branches.length);
});
