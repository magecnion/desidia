import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workerName } from '../scripts/worker-name.mjs';

test('production is explicit and cannot be a cleanup target', () => {
  assert.equal(workerName('main'), 'desidia');
  assert.throws(() => workerName('main', { previewOnly: true }), /production/);
  for (const branch of ['desidia', 'DESIDIA', 'desidia/']) {
    assert.throws(() => workerName(branch), /production/);
    assert.throws(() => workerName(branch, { previewOnly: true }), /production/);
  }
  for (const branch of ['', undefined, ' ']) assert.throws(() => workerName(branch));
});

test('preview names are stable, bounded, and safe', () => {
  for (const branch of ['feature/my-work', 'A'.repeat(300), '你好', '---', 'Main', 'main/child']) {
    const name = workerName(branch, { previewOnly: true });
    assert.match(name, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);
    assert.ok(name.length <= 63);
    assert.equal(name, workerName(branch));
    assert.notEqual(name, 'desidia');
  }
});

test('names contain only the normalized branch, with no prefix or hash', () => {
  assert.equal(workerName('feature/Login'), 'feature-login');
  assert.equal(workerName('feature-login'), 'feature-login');
  assert.equal(workerName('A'.repeat(100)), 'a'.repeat(63));
  assert.equal(workerName(`${'a'.repeat(62)}/suffix`), 'a'.repeat(62));
  assert.equal(workerName('你好'), 'branch');
});
