import { z } from 'zod';
import { COORDINATES_REGEX } from '../domain/schema.ts';
import data from './illustration.json';
import { createProjection, type Illustration } from './projection.ts';

const IllustrationSchema = z.object({
  image: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  controlPoints: z
    .array(
      z.object({
        name: z.string().min(1),
        pixel: z.tuple([z.number(), z.number()]),
        coordinates: z.string().regex(COORDINATES_REGEX),
      }),
    )
    .min(3),
});

export const ILLUSTRATION: Illustration = IllustrationSchema.parse(data);
export const PROJECTION = createProjection(ILLUSTRATION);
