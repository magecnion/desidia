import { compareArtistsByName, type Artist } from '../domain/artist.ts';
import type { ArtistRepository } from './ports/artist-repository.ts';

export interface ArtistService {
  /** All artists, sorted by name. */
  listArtists(): Promise<Artist[]>;
}

export function createArtistService(artists: ArtistRepository): ArtistService {
  return {
    async listArtists() {
      return (await artists.findAll()).toSorted(compareArtistsByName);
    },
  };
}
