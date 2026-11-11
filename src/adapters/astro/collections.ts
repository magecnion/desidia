import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { resolveContentDirectory } from '../../../build/content-directory.ts';
import { ArtistDataSchema } from '../../domain/artist.ts';

const contentDirectory = resolveContentDirectory();

/** Astro only loads the files: the schemas come from the domain. */
export const collections = {
  artists: defineCollection({
    loader: glob({
      pattern: '*.json',
      base: pathToFileURL(join(contentDirectory, 'artists')),
      // The file name is the artist id, as the CMS creates it.
      generateId: ({ entry }) => entry.replace(/\.json$/, ''),
    }),
    schema: ArtistDataSchema,
  }),
};
