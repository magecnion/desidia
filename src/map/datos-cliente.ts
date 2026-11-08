/**
 * Datos mínimos que se envían al navegador para pintar el mapa (las coordenadas ya convertidas a píxel).
 */
import type { Artista, Mural } from '../domain/murales.ts';
import { googleMapsUrl } from '../domain/murales.ts';
import type { Ilustracion, Pixel, Proyeccion } from './proyeccion.ts';

export interface PuntoMapa {
  slug: string;
  titulo: string;
  year: number;
  artistas: string[];
  nombresArtistas: string[];
  direccion: string;
  googleMapsUrl: string;
  portada: string;
  pixel: Pixel;
}

export interface DatosMapa {
  imagen: string;
  ancho: number;
  alto: number;
  puntos: PuntoMapa[];
}

export function datosMapa(
  murales: Mural[],
  artistas: Artista[],
  ilustracion: Ilustracion,
  proyeccion: Proyeccion,
): DatosMapa {
  const nombre = (slug: string) => artistas.find((a) => a.slug === slug)?.nombre ?? slug;
  return {
    imagen: ilustracion.imagen,
    ancho: ilustracion.ancho,
    alto: ilustracion.alto,
    puntos: murales.map((m) => ({
      slug: m.slug,
      titulo: m.titulo,
      year: m.year,
      artistas: m.artistas,
      nombresArtistas: m.artistas.map(nombre),
      direccion: m.direccion,
      googleMapsUrl: googleMapsUrl(m.coordenadas),
      portada: m.fotos[0].imagen,
      pixel: proyeccion.aPixel(m.coordenadas),
    })),
  };
}
