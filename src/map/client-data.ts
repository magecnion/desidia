/**
 * Minimal data sent to the browser to draw the map (coordinates already converted to pixels).
 */
import type { Artist, Mural } from '../domain/murals.ts';
import { googleMapsUrl } from '../domain/murals.ts';
import { markdownToHtml } from '../lib/markdown.ts';
import type { Illustration, Pixel, Projection } from './projection.ts';

export interface MapPoint {
  slug: string;
  title: string;
  year: number;
  artists: string[];
  artistNames: string[];
  address: string;
  descriptionHtml: string;
  googleMapsUrl: string;
  cover: string;
  pixel: Pixel;
}

export interface MapData {
  image: string;
  width: number;
  height: number;
  points: MapPoint[];
}

export function mapData(
  murals: Mural[],
  artists: Artist[],
  illustration: Illustration,
  projection: Projection,
): MapData {
  const name = (slug: string) => artists.find((a) => a.slug === slug)?.name ?? slug;
  return {
    image: illustration.image,
    width: illustration.width,
    height: illustration.height,
    points: murals.map((m) => ({
      slug: m.slug,
      title: m.title,
      year: m.year,
      artists: m.artists,
      artistNames: m.artists.map(name),
      address: m.address,
      descriptionHtml: markdownToHtml(m.description),
      googleMapsUrl: googleMapsUrl(m.coordinates),
      cover: m.photos[0].image,
      pixel: projection.toPixel(m.coordinates),
    })),
  };
}
