// Composition root: the only place that decides which adapter backs each port.
// Pages use these services and never import adapters directly.
import { createAstroArtistRepository } from './adapters/astro/artist-repository.ts';
import { createArtistService } from './application/artist-service.ts';

export const artistService = createArtistService(createAstroArtistRepository());
