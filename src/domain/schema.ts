/**
 * Data model contract (see docs/modelo-de-datos.md).
 *
 * Describes the format of the files in `content/`. It does not depend on Astro or on any CMS:
 * any tool that writes files with this shape is compatible.
 */
import { z } from 'zod';

/** "lat, lng" in decimal degrees, as copied from Google Maps. E.g. "28.97512, -13.56034" */
export const COORDINATES_REGEX = /^\s*-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/;

/**
 * Optional field. An empty string or `null` count as "no value": some editors (e.g. a CMS)
 * write fields left blank that way.
 */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());
}

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid slug (lowercase letters, numbers and hyphens)');
const imagePath = z.string().min(1);

export const PhotoSchema = z.object({
  image: imagePath,
  caption: optional(z.string()),
  credit: optional(z.string()),
});

export const MuralFileSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  artists: z.array(slug).min(1, 'A mural needs at least one artist'),
  location: z.object({
    address: z.string().min(1),
    coordinates: z.string().regex(COORDINATES_REGEX, 'Expected format: "lat, lng" (e.g. 28.97512, -13.56034)'),
  }),
  description: optional(z.string()),
  photos: z.array(PhotoSchema).min(1, 'A mural needs at least one photo'),
});

export const ArtistFileSchema = z.object({
  name: z.string().min(1),
  bio: optional(z.string()),
  photo: optional(imagePath),
  instagram: optional(z.string().regex(/^[A-Za-z0-9._]+$/, 'Username only, without @ or URL')),
});

export const PageFileSchema = z.object({
  title: z.string().min(1),
});

export const SettingsFileSchema = z.object({
  email: optional(z.email()),
  socials: z.preprocess(
    (value) => value ?? [],
    z.array(z.object({ name: z.string().min(1), url: z.url() })),
  ),
});

export type Photo = z.infer<typeof PhotoSchema>;
export type MuralFile = z.infer<typeof MuralFileSchema>;
export type ArtistFile = z.infer<typeof ArtistFileSchema>;
export type SettingsFile = z.infer<typeof SettingsFileSchema>;
