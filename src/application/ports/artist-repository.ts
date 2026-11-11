import type { Artist } from '../../domain/artist.ts';

/** Port: how the application reads artists, whatever stores them. */
export interface ArtistRepository {
  findAll(): Promise<Artist[]>;
}
