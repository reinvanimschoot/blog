import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Optional series info: posts with the same `series` get a
    // "Part X of Y" label and previous/next links.
    series: z.string().optional(),
    part: z.number().optional(),
    // Drafts show up with `npm run dev` but are left out of the build.
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
