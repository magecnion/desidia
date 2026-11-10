/**
 * Domain model and pure logic. No dependencies on Astro, the CMS or the browser.
 */
import type { ArtistFile, Photo, MuralFile } from './schema.ts';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Artist {
  slug: string;
  name: string;
  bio?: string;
  photo?: string;
  instagram?: string;
}

export interface Mural {
  slug: string;
  title: string;
  year: number;
  artists: string[];
  address: string;
  coordinates: Coordinates;
  description?: string;
  photos: Photo[];
}

export interface Filter {
  year?: number;
  artist?: string;
}

export function parseCoordinates(text: string): Coordinates {
  const [lat, lng] = text.split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error(`Invalid coordinates: "${text}"`);
  }
  return { lat, lng };
}

export function googleMapsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function instagramUrl(username: string): string {
  return `https://www.instagram.com/${username}/`;
}

export function toMural(slug: string, file: MuralFile): Mural {
  return {
    slug,
    title: file.title,
    year: file.year,
    artists: file.artists,
    address: file.location.address,
    coordinates: parseCoordinates(file.location.coordinates),
    description: file.description,
    photos: file.photos,
  };
}

export function toArtist(slug: string, file: ArtistFile): Artist {
  return { slug, ...file };
}

/**
 * Checks integrity across collections and returns the list of errors (empty if everything is valid).
 * `isOnMap` decides whether some coordinates fall inside the area shown on the map.
 */
export function validateIntegrity(
  murals: Mural[],
  artists: Artist[],
  isOnMap: (coordinates: Coordinates) => boolean,
): string[] {
  const artistSlugs = new Set(artists.map((a) => a.slug));
  const errors: string[] = [];
  for (const mural of murals) {
    for (const artist of mural.artists) {
      if (!artistSlugs.has(artist)) {
        errors.push(`Mural "${mural.slug}": artist "${artist}" does not exist`);
      }
    }
    if (!isOnMap(mural.coordinates)) {
      errors.push(`Mural "${mural.slug}": coordinates fall outside the map`);
    }
  }
  return errors;
}

/** Most recent first; for the same year, by title. */
export function sortMurals(murals: Mural[]): Mural[] {
  return [...murals].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, 'es'));
}

export function sortArtists(artists: Artist[]): Artist[] {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function filterMurals<T extends Pick<Mural, 'year' | 'artists'>>(murals: T[], filter: Filter): T[] {
  return murals.filter(
    (m) =>
      (filter.year === undefined || m.year === filter.year) &&
      (filter.artist === undefined || m.artists.includes(filter.artist)),
  );
}

export function muralsByArtist(murals: Mural[], artistSlug: string): Mural[] {
  return sortMurals(filterMurals(murals, { artist: artistSlug }));
}

export function availableYears(murals: Mural[]): number[] {
  return [...new Set(murals.map((m) => m.year))].sort((a, b) => b - a);
}
