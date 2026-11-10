import { workerName } from './worker-name.mjs';
import { pathToFileURL } from 'node:url';

export async function cleanup({ branch, token, account }, request = fetch) {
  const name = workerName(branch, { previewOnly: true });
  if (!token || !account) throw new Error('Cloudflare credentials are required');

  const response = await request(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/workers/scripts/${name}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  const result = body ? JSON.parse(body) : {};
  // Branches that never had a preview (and repeated cleanup runs) need no action.
  const absent = response.status === 404 && result.errors?.some(error => error.code === 10007);
  if (!absent && (!response.ok || result.success === false)) {
    throw new Error(`Failed to delete ${name}: ${JSON.stringify(result.errors)}`);
  }
  return absent ? `${name} already absent` : `Deleted ${name}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(await cleanup({
    branch: process.env.BRANCH,
    token: process.env.CLOUDFLARE_API_TOKEN,
    account: process.env.CLOUDFLARE_ACCOUNT_ID,
  }));
}
