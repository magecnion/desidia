import { cp, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { AstroIntegration } from 'astro';

/** Must match `media_folder` in `public/admin/config.yml`: the CMS links uploads under this path. */
export const MEDIA_PUBLIC_PATH = 'content/media/';

const AUXILIARY_FILES = ['README.md', '.gitkeep'];

/** Publishes the media uploaded through the CMS, which lives outside `public/`, into the build output. */
export function contentMedia(contentDirectory: string): AstroIntegration {
  const mediaDirectory = join(contentDirectory, 'media');
  return {
    name: 'content-media',
    hooks: {
      // Fail before Astro touches the previous output.
      'astro:config:setup': async () => {
        await findMedia(mediaDirectory);
      },
      'astro:build:done': async ({ dir }) => {
        if (!(await findMedia(mediaDirectory))) return;
        await cp(mediaDirectory, new URL(MEDIA_PUBLIC_PATH, dir), {
          recursive: true,
          filter: source => !AUXILIARY_FILES.includes(basename(source)),
        });
      },
    },
  };
}

async function findMedia(directory: string): Promise<boolean> {
  const media = await stat(directory).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (media && !media.isDirectory()) throw new Error('Content media must be a directory');
  return media !== null;
}
