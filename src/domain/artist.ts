import { z } from 'zod';

/**
 * What an artist file contains, as written by the CMS (`content/artists/<id>.json`).
 * Strict: a field the domain doesn't know means the CMS config and the domain have drifted apart.
 */
export const ArtistDataSchema = z.strictObject({
  name: z.string().trim().min(1, 'Artist name must not be empty'),
});

export type ArtistData = z.infer<typeof ArtistDataSchema>;

/** An artist, identified by the name of its file. */
export interface Artist extends ArtistData {
  id: string;
}

export function compareArtistsByName(a: Artist, b: Artist): number {
  return a.name.localeCompare(b.name, 'es');
}
