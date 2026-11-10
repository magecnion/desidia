import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterMurals,
  googleMapsUrl,
  muralsByArtist,
  parseCoordinates,
  validateIntegrity,
  availableYears,
  type Mural,
} from '../src/domain/murals.ts';
import { ArtistFileSchema, MuralFileSchema, SettingsFileSchema } from '../src/domain/schema.ts';

const inCanaryIslands = ({ lat }: { lat: number }) => lat > 27 && lat < 30;

function mural(slug: string, year: number, artists: string[], lat = 28.975, lng = -13.56): Mural {
  return { slug, title: slug, year, artists, address: '', coordinates: { lat, lng }, photos: [] };
}

test('parseCoordinates accepts the format copied from Google Maps', () => {
  assert.deepEqual(parseCoordinates('28.97512, -13.56034'), { lat: 28.97512, lng: -13.56034 });
  assert.deepEqual(parseCoordinates(' 28.9,-13.5 '), { lat: 28.9, lng: -13.5 });
  assert.throws(() => parseCoordinates('95, 10'));
});

test('the schema rejects malformed coordinates', () => {
  const base = {
    title: 'x',
    year: 2024,
    artists: ['a'],
    photos: [{ image: '/x.jpg' }],
  };
  const withCoordinates = (coordinates: string) => ({ ...base, location: { address: 'd', coordinates } });
  assert.ok(MuralFileSchema.safeParse(withCoordinates('28.97512, -13.56034')).success);
  assert.ok(!MuralFileSchema.safeParse(withCoordinates('28°58\'30"N 13°33\'37"W')).success);
  assert.ok(!MuralFileSchema.safeParse(withCoordinates('28.97512')).success);
});

test('googleMapsUrl builds the search link', () => {
  assert.equal(
    googleMapsUrl({ lat: 28.97512, lng: -13.56034 }),
    'https://www.google.com/maps/search/?api=1&query=28.97512,-13.56034',
  );
});

test('filterMurals combines year and artist', () => {
  const murals = [mural('a', 2023, ['x']), mural('b', 2024, ['x', 'y']), mural('c', 2024, ['y'])];
  assert.deepEqual(filterMurals(murals, {}).map((m) => m.slug), ['a', 'b', 'c']);
  assert.deepEqual(filterMurals(murals, { year: 2024 }).map((m) => m.slug), ['b', 'c']);
  assert.deepEqual(filterMurals(murals, { year: 2024, artist: 'x' }).map((m) => m.slug), ['b']);
});

test('muralsByArtist returns their murals, most recent first', () => {
  const murals = [mural('a', 2023, ['x']), mural('b', 2024, ['x', 'y']), mural('c', 2025, ['y'])];
  assert.deepEqual(muralsByArtist(murals, 'x').map((m) => m.slug), ['b', 'a']);
});

test('availableYears returns unique years in descending order', () => {
  assert.deepEqual(availableYears([mural('a', 2023, []), mural('b', 2025, []), mural('c', 2023, [])]), [2025, 2023]);
});

test('validateIntegrity detects missing artists and points outside the map', () => {
  const artists = [{ slug: 'x', name: 'X' }];
  assert.deepEqual(validateIntegrity([mural('a', 2024, ['x'])], artists, inCanaryIslands), []);
  const errors = validateIntegrity([mural('b', 2024, ['z'], 40.4, -3.7)], artists, inCanaryIslands);
  assert.equal(errors.length, 2);
});

test('empty or null optional fields count as missing', () => {
  const artist = ArtistFileSchema.parse({ name: 'X', bio: '', photo: null, instagram: '' });
  assert.deepEqual(artist, { name: 'X', bio: undefined, photo: undefined, instagram: undefined });
  assert.ok(!ArtistFileSchema.safeParse({ name: 'X', instagram: '@at-sign' }).success);
  assert.deepEqual(SettingsFileSchema.parse({ email: '', socials: null }), { email: undefined, socials: [] });
});
