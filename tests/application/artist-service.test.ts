import assert from 'node:assert/strict';
import test from 'node:test';
import { createInMemoryArtistRepository } from '../../src/adapters/in-memory/artist-repository.ts';
import { createArtistService } from '../../src/application/artist-service.ts';

test('listArtists returns every artist sorted by name', async () => {
  const service = createArtistService(createInMemoryArtistRepository([
    { id: 'b', name: 'Marco Ruiz' },
    { id: 'a', name: 'Ana Pérez' },
  ]));
  assert.deepEqual(await service.listArtists(), [
    { id: 'a', name: 'Ana Pérez' },
    { id: 'b', name: 'Marco Ruiz' },
  ]);
});

test('listArtists returns an empty list when there are no artists', async () => {
  assert.deepEqual(await createArtistService(createInMemoryArtistRepository([])).listArtists(), []);
});
