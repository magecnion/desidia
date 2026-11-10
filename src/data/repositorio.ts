/**
 * Puerto de acceso a datos. Las páginas solo leen a través de aquí.
 * Hoy lee `content/` con las colecciones de Astro; cambiar el origen (otra API, una base de datos…)
 * solo requiere reimplementar este fichero manteniendo las mismas funciones.
 */
import { getCollection, getEntry, render } from 'astro:content';
import ajustesJson from '../../content/ajustes.json';
import { AjustesFicheroSchema, type AjustesFichero } from '../domain/schema.ts';
import {
  aArtista,
  aMural,
  muralesDeArtista,
  ordenarArtistas,
  ordenarMurales,
  validarIntegridad,
  type Artista,
  type Mural,
} from '../domain/murales.ts';
import { PROYECCION } from '../map/index.ts';

let cache: Promise<{ murales: Mural[]; artistas: Artista[] }> | undefined;

function cargar() {
  cache ??= (async () => {
    const [entradasMurales, entradasArtistas] = await Promise.all([
      getCollection('murales'),
      getCollection('artistas'),
    ]);
    const murales = ordenarMurales(entradasMurales.map((e) => aMural(e.id, e.data)));
    const artistas = ordenarArtistas(entradasArtistas.map((e) => aArtista(e.id, e.data)));
    const errores = validarIntegridad(murales, artistas, PROYECCION.dentro);
    if (errores.length > 0) {
      throw new Error(`Errores en el contenido:\n- ${errores.join('\n- ')}`);
    }
    return { murales, artistas };
  })();
  return cache;
}

export async function getMurales(): Promise<Mural[]> {
  return (await cargar()).murales;
}

export async function getArtistas(): Promise<Artista[]> {
  return (await cargar()).artistas;
}

export async function getMuralesDeArtista(slug: string): Promise<Mural[]> {
  return muralesDeArtista(await getMurales(), slug);
}

export async function getPagina(slug: 'contacto' | 'open-call') {
  const entrada = await getEntry('paginas', slug);
  if (!entrada) throw new Error(`Falta la página content/paginas/${slug}.md`);
  const { Content } = await render(entrada);
  return { titulo: entrada.data.titulo, Content };
}

export function getAjustes(): AjustesFichero {
  return AjustesFicheroSchema.parse(ajustesJson);
}
