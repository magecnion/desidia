import assert from 'node:assert/strict';
import test from 'node:test';
import { ArtistDataSchema, compareArtistsByName, type Artist } from '../../src/domain/artist.ts';

test('artist data requires a non-empty name, trims it and rejects unknown fields', () => {
  assert.deepEqual(ArtistDataSchema.parse({ name: '  Ana Pérez ' }), { name: 'Ana Pérez' });
  for (const data of [null, {}, { name: ' ' }, { name: 123 }, { name: 'Ana', bio: 'unknown field' }]) {
    assert.equal(ArtistDataSchema.safeParse(data).success, false);
  }
});

test('artists sort by name following Spanish collation', () => {
  const artists: Artist[] = [
    { id: '3', name: 'Ñandú' },
    { id: '1', name: 'Óscar' },
    { id: '2', name: 'nadia' },
  ];
  assert.deepEqual(artists.sort(compareArtistsByName).map(artist => artist.name), ['nadia', 'Ñandú', 'Óscar']);
});
