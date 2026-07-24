import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Library-specific frontmatter used on component reference pages.
        category: z.string().optional(),
        status: z.enum(['stable', 'beta', 'experimental']).optional(),
        // YAML may parse `0.2` as a number; coerce to a string.
        since: z.coerce.string().optional(),
      }),
    }),
  }),
};
