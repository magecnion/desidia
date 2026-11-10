/**
 * Reads `content/` through Astro collections.
 * The schemas come from the domain: Astro is only the loading mechanism.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ArtistFileSchema, MuralFileSchema, PageFileSchema } from './domain/schema.ts';

const murals = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/murals' }),
  schema: MuralFileSchema,
});

const artists = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/artists' }),
  schema: ArtistFileSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/pages' }),
  schema: PageFileSchema,
});

export const collections = { murals, artists, pages };
