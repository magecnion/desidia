/**
 * Data access port. Pages only read through here.
 * Today it reads `content/` with Astro collections; changing the source (another API, a database…)
 * only requires reimplementing this file while keeping the same functions.
 */
import { getCollection, getEntry, render } from 'astro:content';
import settingsJson from '../../content/settings.json';
import { SettingsFileSchema, type SettingsFile } from '../domain/schema.ts';
import {
  toArtist,
  toMural,
  muralsByArtist,
  sortArtists,
  sortMurals,
  validateIntegrity,
  type Artist,
  type Mural,
} from '../domain/murals.ts';
import { PROJECTION } from '../map/index.ts';

let cache: Promise<{ murals: Mural[]; artists: Artist[] }> | undefined;

function load() {
  cache ??= (async () => {
    const [muralEntries, artistEntries] = await Promise.all([getCollection('murals'), getCollection('artists')]);
    const murals = sortMurals(muralEntries.map((e) => toMural(e.id, e.data)));
    const artists = sortArtists(artistEntries.map((e) => toArtist(e.id, e.data)));
    const errors = validateIntegrity(murals, artists, PROJECTION.contains);
    if (errors.length > 0) {
      throw new Error(`Content errors:\n- ${errors.join('\n- ')}`);
    }
    return { murals, artists };
  })();
  return cache;
}

export async function getMurals(): Promise<Mural[]> {
  return (await load()).murals;
}

export async function getArtists(): Promise<Artist[]> {
  return (await load()).artists;
}

export async function getMuralsByArtist(slug: string): Promise<Mural[]> {
  return muralsByArtist(await getMurals(), slug);
}

export async function getPage(slug: 'contact' | 'open-call') {
  const entry = await getEntry('pages', slug);
  if (!entry) throw new Error(`Missing page content/pages/${slug}.md`);
  const { Content } = await render(entry);
  return { title: entry.data.title, Content };
}

export function getSettings(): SettingsFile {
  return SettingsFileSchema.parse(settingsJson);
}
