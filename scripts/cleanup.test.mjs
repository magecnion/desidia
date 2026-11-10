import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup } from './cleanup.mjs';
import { workerName } from './worker-name.mjs';

const options = { branch: 'feature/test', token: 'test-token', account: 'test-account' };

test('cleanup refuses production before making any request', async () => {
  await assert.rejects(cleanup({ ...options, branch: 'main' }, () => {
    assert.fail('Production must never reach the API');
  }), /production/);
});

test('cleanup targets only the matching preview and accepts an empty success', async () => {
  const result = await cleanup(options, async (url, init) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/test-account/workers/scripts/${workerName(options.branch)}`);
    assert.equal(init.method, 'DELETE');
    return new Response(null, { status: 204 });
  });
  assert.match(result, /^Deleted /);
});

test('cleanup tolerates missing previews but propagates API failures', async () => {
  const response = (status, code) => async () => Response.json({ success: false, errors: [{ code }] }, { status });
  assert.match(await cleanup(options, response(404, 10007)), /already absent/);
  for (const [status, code] of [[403, 10000], [404, 7003], [500, 10007]]) {
    await assert.rejects(cleanup(options, response(status, code)), /Failed to delete/);
  }
});
