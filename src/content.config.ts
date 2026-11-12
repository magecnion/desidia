import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveContentDirectory } from '../scripts/content-path.mjs';
import { artistSchema } from './artist/domain';

const artists = defineCollection({
  // glob also removes cached entries when this directory no longer exists.
  loader: glob({
    pattern: '*.json',
    base: pathToFileURL(join(await resolveContentDirectory(), 'artists')),
    generateId: ({ entry }) => entry,
  }),
  schema: artistSchema,
});

export const collections = { artists };
