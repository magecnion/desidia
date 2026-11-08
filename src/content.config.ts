/**
 * Lectura de `content/` mediante las colecciones de Astro.
 * Los esquemas vienen del dominio: Astro es solo el mecanismo de carga.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ArtistaFicheroSchema, MuralFicheroSchema, PaginaFicheroSchema } from './domain/schema.ts';

const murales = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/murales' }),
  schema: MuralFicheroSchema,
});

const artistas = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/artistas' }),
  schema: ArtistaFicheroSchema,
});

const paginas = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/paginas' }),
  schema: PaginaFicheroSchema,
});

export const collections = { murales, artistas, paginas };
