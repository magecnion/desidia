/**
 * Contrato del modelo de datos (ver docs/modelo-de-datos.md).
 *
 * Describe el formato de los ficheros de `content/`. No depende de Astro ni de ningún CMS:
 * cualquier herramienta que escriba ficheros con esta forma es compatible.
 */
import { z } from 'zod';

/** "lat, lng" en grados decimales, tal y como lo copia Google Maps. Ej: "28.97512, -13.56034" */
export const COORDENADAS_REGEX = /^\s*-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/;

/**
 * Campo opcional. Una cadena vacía o `null` cuentan como "sin valor": algunos editores (p. ej. un CMS)
 * escriben así los campos que se dejan en blanco.
 */
function opcional<T extends z.ZodType>(esquema: T) {
  return z.preprocess((valor) => (valor === '' || valor === null ? undefined : valor), esquema.optional());
}

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug inválido (minúsculas, números y guiones)');
const rutaImagen = z.string().min(1);

export const FotoSchema = z.object({
  imagen: rutaImagen,
  pie: opcional(z.string()),
  credito: opcional(z.string()),
});

export const MuralFicheroSchema = z.object({
  titulo: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  artistas: z.array(slug).min(1, 'Un mural necesita al menos un artista'),
  ubicacion: z.object({
    direccion: z.string().min(1),
    coordenadas: z.string().regex(COORDENADAS_REGEX, 'Formato esperado: "lat, lng" (ej. 28.97512, -13.56034)'),
  }),
  descripcion: opcional(z.string()),
  fotos: z.array(FotoSchema).min(1, 'Un mural necesita al menos una foto'),
});

export const ArtistaFicheroSchema = z.object({
  nombre: z.string().min(1),
  bio: opcional(z.string()),
  foto: opcional(rutaImagen),
  instagram: opcional(z.string().regex(/^[A-Za-z0-9._]+$/, 'Solo el nombre de usuario, sin @ ni URL')),
});

export const PaginaFicheroSchema = z.object({
  titulo: z.string().min(1),
});

export const AjustesFicheroSchema = z.object({
  email: opcional(z.email()),
  redes: z.preprocess(
    (valor) => valor ?? [],
    z.array(z.object({ nombre: z.string().min(1), url: z.url() })),
  ),
});

export type Foto = z.infer<typeof FotoSchema>;
export type MuralFichero = z.infer<typeof MuralFicheroSchema>;
export type ArtistaFichero = z.infer<typeof ArtistaFicheroSchema>;
export type AjustesFichero = z.infer<typeof AjustesFicheroSchema>;
