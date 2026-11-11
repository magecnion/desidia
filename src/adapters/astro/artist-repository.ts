import { getCollection } from 'astro:content';
import type { ArtistRepository } from '../../application/ports/artist-repository.ts';

/** Adapter: reads artists from the Astro content collection. */
export function createAstroArtistRepository(): ArtistRepository {
  return {
    async findAll() {
      return (await getCollection('artists')).map(({ id, data }) => ({ id, ...data }));
    },
  };
}
