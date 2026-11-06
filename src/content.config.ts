import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { frames, lenses, shapes } from './lib/palette';

const text = z.object({ es: z.string(), en: z.string() });
const frameId = z.enum(Object.keys(frames) as [keyof typeof frames, ...(keyof typeof frames)[]]);
const lensId = z.enum(Object.keys(lenses) as [keyof typeof lenses, ...(keyof typeof lenses)[]]);

// One folder per pair: src/content/products/<slug>/data.yaml. The folder name is the URL.
const products = defineCollection({
  loader: glob({
    pattern: '*/data.yaml',
    base: './src/content/products',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z
    .object({
      name: z.string(),
      /** Part of this season's collection (shown first, in the home page story). */
      season: z.boolean().default(false),
      shape: z.enum(shapes),
      price: z.number().positive(),
      /** The place on the island the pair is named after, in one line. */
      place: text,
      description: text,
      variants: z
        .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), frame: frameId, lens: lensId }))
        .min(1),
      polarized: z.boolean().default(true),
      lensMaterial: z.enum(['policarbonato', 'nylon', 'cristal']).default('policarbonato'),
      /** Lens width – bridge – temple length, in millimetres. */
      size: z.tuple([z.number(), z.number(), z.number()]),
      fit: z.enum(['estrecho', 'medio', 'ancho']).default('medio'),
      /** Small label on the card: nuevo, temporada or mas-vendido. */
      badge: z.enum(['nuevo', 'temporada', 'mas-vendido']).optional(),
      /** The pair spotlighted on the home page (the first one marked wins). */
      featured: z.boolean().default(false),
      order: z.number().default(100),
      available: z.boolean().default(true),
    })
    .refine((p) => new Set(p.variants.map((v) => v.id)).size === p.variants.length, {
      message: 'Each variant needs its own id',
    }),
});

export const collections = { products };
