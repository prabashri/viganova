import { defineCollection, reference, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

const baseSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    author: reference('team'),
    publishedDate: z.string(),
    lastModified: z.string().optional(),
    slug: z.string().optional(),
    canonicalUrl: z.string().optional(), // removes the .url() check
    heroImage: z
      .object({
        src: image().describe('Image must be in the same folder as this MDX file. Optimized with astro:assets.'),
        alt: z.string().describe('Alt text for accessibility.'),
        title: z.string().optional(),
        caption: z.string().optional(),
      })
      .optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    category: z.string().optional(),
    type: z.string().optional(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          speakable: z.boolean().optional(),
        })
      )
      .optional(),
  });

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/blog' }),
    schema: baseSchema,
  }),

  post: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/post' }),
    schema: baseSchema,
  }),

  team: defineCollection({
    // type: 'content',
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/team' }),
    schema: () =>
      z.object({
        name: z.string(),
		slug: z.string().optional(),
        prefix: z.string().optional(), // Dr., Mr., etc.
        role: z.string(),
        highestDegree: z.string().optional(),
        shortBio: z.string().optional(),
        experience: z.number().int().nonnegative().optional(),
        expertise: z.array(z.string()).optional(),
        awards: z.array(z.string()).optional(),
        affiliation: z.string().optional(),
        addressing: z.string().optional(), // he/him, she/her, they/them
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        joined: z.string().optional(), // YYYY-MM-DD
        useGravatar: z.boolean().default(true), // fallback gravatar support
        photo: z.string().optional(), // custom image URL
        social: z
          .object({
            twitter: z.string().url().optional(),
            github: z.string().url().optional(),
            linkedin: z.string().url().optional(),
            instagram: z.string().url().optional(),
            youtube: z.string().url().optional(),
            mastodon: z.string().url().optional(),
            threads: z.string().url().optional(),
          })
          .optional(),
        featured: z.boolean().optional(),
      }),
  }),
};
