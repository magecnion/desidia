import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filtrarMurales,
  googleMapsUrl,
  muralesDeArtista,
  parseCoordenadas,
  validarIntegridad,
  yearsDisponibles,
  type Mural,
} from '../src/domain/murales.ts';
import { MuralFicheroSchema } from '../src/domain/schema.ts';

const enCanarias = ({ lat }: { lat: number }) => lat > 27 && lat < 30;

function mural(slug: string, year: number, artistas: string[], lat = 28.975, lng = -13.56): Mural {
  return { slug, titulo: slug, year, artistas, direccion: '', coordenadas: { lat, lng }, fotos: [] };
}

test('parseCoordenadas acepta el formato copiado de Google Maps', () => {
  assert.deepEqual(parseCoordenadas('28.97512, -13.56034'), { lat: 28.97512, lng: -13.56034 });
  assert.deepEqual(parseCoordenadas(' 28.9,-13.5 '), { lat: 28.9, lng: -13.5 });
  assert.throws(() => parseCoordenadas('95, 10'));
});

test('el esquema rechaza coordenadas mal formadas', () => {
  const base = {
    titulo: 'x',
    year: 2024,
    artistas: ['a'],
    fotos: [{ imagen: '/x.jpg' }],
  };
  const conCoordenadas = (coordenadas: string) => ({ ...base, ubicacion: { direccion: 'd', coordenadas } });
  assert.ok(MuralFicheroSchema.safeParse(conCoordenadas('28.97512, -13.56034')).success);
  assert.ok(!MuralFicheroSchema.safeParse(conCoordenadas('28°58\'30"N 13°33\'37"W')).success);
  assert.ok(!MuralFicheroSchema.safeParse(conCoordenadas('28.97512')).success);
});

test('googleMapsUrl genera el enlace de búsqueda', () => {
  assert.equal(
    googleMapsUrl({ lat: 28.97512, lng: -13.56034 }),
    'https://www.google.com/maps/search/?api=1&query=28.97512,-13.56034',
  );
});

test('filtrarMurales combina año y artista', () => {
  const murales = [mural('a', 2023, ['x']), mural('b', 2024, ['x', 'y']), mural('c', 2024, ['y'])];
  assert.deepEqual(filtrarMurales(murales, {}).map((m) => m.slug), ['a', 'b', 'c']);
  assert.deepEqual(filtrarMurales(murales, { year: 2024 }).map((m) => m.slug), ['b', 'c']);
  assert.deepEqual(filtrarMurales(murales, { year: 2024, artista: 'x' }).map((m) => m.slug), ['b']);
});

test('muralesDeArtista devuelve sus murales, más recientes primero', () => {
  const murales = [mural('a', 2023, ['x']), mural('b', 2024, ['x', 'y']), mural('c', 2025, ['y'])];
  assert.deepEqual(muralesDeArtista(murales, 'x').map((m) => m.slug), ['b', 'a']);
});

test('yearsDisponibles devuelve años únicos en orden descendente', () => {
  assert.deepEqual(yearsDisponibles([mural('a', 2023, []), mural('b', 2025, []), mural('c', 2023, [])]), [2025, 2023]);
});

test('validarIntegridad detecta artistas inexistentes y puntos fuera del mapa', () => {
  const artistas = [{ slug: 'x', nombre: 'X' }];
  assert.deepEqual(validarIntegridad([mural('a', 2024, ['x'])], artistas, enCanarias), []);
  const errores = validarIntegridad([mural('b', 2024, ['z'], 40.4, -3.7)], artistas, enCanarias);
  assert.equal(errores.length, 2);
});
