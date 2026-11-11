import { defineConfig } from 'astro/config';
import { resolveCommitSha } from './build/commit-sha.ts';
import { resolveContentDirectory } from './build/content-directory.ts';
import { contentMedia } from './build/content-media.ts';

const contentDirectory = resolveContentDirectory();

export default defineConfig({
  integrations: [contentMedia(contentDirectory)],
  vite: {
    define: { __COMMIT_SHA__: JSON.stringify(resolveCommitSha()) },
  },
});
