import { z } from 'zod';
import { COORDENADAS_REGEX } from '../domain/schema.ts';
import datos from './ilustracion.json';
import { crearProyeccion, type Ilustracion } from './proyeccion.ts';

const IlustracionSchema = z.object({
  imagen: z.string().min(1),
  ancho: z.number().positive(),
  alto: z.number().positive(),
  puntosControl: z
    .array(
      z.object({
        nombre: z.string().min(1),
        pixel: z.tuple([z.number(), z.number()]),
        coordenadas: z.string().regex(COORDENADAS_REGEX),
      }),
    )
    .min(3),
});

export const ILUSTRACION: Ilustracion = IlustracionSchema.parse(datos);
export const PROYECCION = crearProyeccion(ILUSTRACION);
