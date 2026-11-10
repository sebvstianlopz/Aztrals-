import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const text = z.object({ es: z.string(), en: z.string() });

export const FRAMES = ['negro', 'hueso', 'plata', 'carey', 'arena', 'oliva'] as const;
export const TINTS = ['humo', 'sol', 'ambar', 'oceano', 'verde', 'rosa'] as const;
export const SHAPES = ['escudo', 'envolvente', 'rectangular', 'ovalada'] as const;

// One folder per model: src/content/products/<slug>/data.yaml, plus its photos named
// <colorway id>-1.jpg, <colorway id>-2.jpg… in the same folder (see README).
const products = defineCollection({
  loader: glob({
    pattern: '*/data.yaml',
    base: './src/content/products',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    name: z.string(),
    /** Price in USD as shown on the site. Shopify stays the source of truth at checkout. */
    price: z.number().positive(),
    /** Product handle on Shopify: the end of https://<store>/products/<handle>. */
    shopifyHandle: z.string(),
    releasedAt: z.coerce.date(),
    /** Shows in "Lanzamientos". */
    isNew: z.boolean().default(false),
    /** The one model the dark release chapter is about. */
    spotlight: z.boolean().default(false),
    shape: z.enum(SHAPES),
    sport: z.boolean().default(false),
    tagline: text,
    description: text,
    lens: z.object({
      polarized: z.boolean().default(false),
      mirror: z.boolean().default(false),
      uv400: z.boolean().default(true),
      material: text,
    }),
    frame: z.object({
      material: text,
      weightGrams: z.number().positive().optional(),
    }),
    colorways: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes'),
          name: text,
          frame: z.enum(FRAMES),
          tint: z.enum(TINTS),
          /** Shopify variant ID (digits). Needed for the bag to hand off to Shopify checkout. */
          shopifyVariantId: z.string().regex(/^\d+$/, 'Variant IDs are digits only').optional(),
        }),
      )
      .min(1),
    available: z.boolean().default(true),
    order: z.number().default(100),
  }),
});

export const collections = { products };
