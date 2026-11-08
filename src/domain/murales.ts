/**
 * Modelo de dominio y lógica pura. Sin dependencias de Astro, del CMS ni del navegador.
 */
import type { ArtistaFichero, Foto, MuralFichero } from './schema.ts';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Artista {
  slug: string;
  nombre: string;
  bio?: string;
  foto?: string;
  instagram?: string;
}

export interface Mural {
  slug: string;
  titulo: string;
  year: number;
  artistas: string[];
  direccion: string;
  coordenadas: Coordenadas;
  descripcion?: string;
  fotos: Foto[];
}

export interface Filtro {
  year?: number;
  artista?: string;
}

export function parseCoordenadas(texto: string): Coordenadas {
  const [lat, lng] = texto.split(',').map((parte) => Number(parte.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error(`Coordenadas inválidas: "${texto}"`);
  }
  return { lat, lng };
}

export function googleMapsUrl({ lat, lng }: Coordenadas): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function instagramUrl(usuario: string): string {
  return `https://www.instagram.com/${usuario}/`;
}

export function aMural(slug: string, fichero: MuralFichero): Mural {
  return {
    slug,
    titulo: fichero.titulo,
    year: fichero.year,
    artistas: fichero.artistas,
    direccion: fichero.ubicacion.direccion,
    coordenadas: parseCoordenadas(fichero.ubicacion.coordenadas),
    descripcion: fichero.descripcion,
    fotos: fichero.fotos,
  };
}

export function aArtista(slug: string, fichero: ArtistaFichero): Artista {
  return { slug, ...fichero };
}

/**
 * Comprueba la integridad entre colecciones y devuelve la lista de errores (vacía si todo es correcto).
 * `estaEnMapa` decide si unas coordenadas caen dentro de la zona representada en el mapa.
 */
export function validarIntegridad(
  murales: Mural[],
  artistas: Artista[],
  estaEnMapa: (coordenadas: Coordenadas) => boolean,
): string[] {
  const slugsArtistas = new Set(artistas.map((a) => a.slug));
  const errores: string[] = [];
  for (const mural of murales) {
    for (const artista of mural.artistas) {
      if (!slugsArtistas.has(artista)) {
        errores.push(`Mural "${mural.slug}": el artista "${artista}" no existe`);
      }
    }
    if (!estaEnMapa(mural.coordenadas)) {
      errores.push(`Mural "${mural.slug}": las coordenadas quedan fuera del mapa`);
    }
  }
  return errores;
}

/** Más recientes primero; a igualdad de año, por título. */
export function ordenarMurales(murales: Mural[]): Mural[] {
  return [...murales].sort((a, b) => b.year - a.year || a.titulo.localeCompare(b.titulo, 'es'));
}

export function ordenarArtistas(artistas: Artista[]): Artista[] {
  return [...artistas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function filtrarMurales<T extends Pick<Mural, 'year' | 'artistas'>>(murales: T[], filtro: Filtro): T[] {
  return murales.filter(
    (m) =>
      (filtro.year === undefined || m.year === filtro.year) &&
      (filtro.artista === undefined || m.artistas.includes(filtro.artista)),
  );
}

export function muralesDeArtista(murales: Mural[], slugArtista: string): Mural[] {
  return ordenarMurales(filtrarMurales(murales, { artista: slugArtista }));
}

export function yearsDisponibles(murales: Mural[]): number[] {
  return [...new Set(murales.map((m) => m.year))].sort((a, b) => b - a);
}
