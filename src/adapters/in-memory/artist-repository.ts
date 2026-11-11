import type { ArtistRepository } from '../../application/ports/artist-repository.ts';
import type { Artist } from '../../domain/artist.ts';

/** Adapter for tests: serves a fixed list of artists. */
export function createInMemoryArtistRepository(artists: Artist[]): ArtistRepository {
  return {
    async findAll() {
      return structuredClone(artists);
    },
  };
}
