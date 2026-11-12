import { z } from 'zod';

export const artistSchema = z.object({
  name: z.string().refine(name => name.trim().length > 0, 'Artist must have a non-empty name'),
});

export type Artist = z.infer<typeof artistSchema> & { id: string };
