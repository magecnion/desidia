import { getCollection } from 'astro:content';
import type { Artist } from './domain';

export async function listArtists(): Promise<Artist[]> {
  const entries = await getCollection('artists');
  return entries
    .map(({ id, data }) => ({ ...data, id }))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
