import { defineCollection, reference, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

const baseSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    authors: z.array(reference('team')), // Array of author references
    publishedDate: z.string(),
    lastModified: z.string().optional(),
    slug: z.string().optional(),
    canonicalUrl: z.string().optional(), // removes the .url() check

    heroImage: z.string().optional(), // Relative path to the hero image, used in header and social preview
    heroImageAlt: z.string().optional(), // 'Alt text for the hero image, used for accessibility and SEO.')
    heroImageTitle: z.string().optional(), // .describe('Optional title for the hero image, used in UI.')
    heroImageCaption: z.string().optional(), // .describe('Optional caption for the hero image, used in UI.'),
    // Use astro: assets for image optimization
    
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(), // maximum 3 categories
    keywords: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    
    // type: z.string().optional(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          speakable: z.boolean().optional(),
        })
      )
      .optional(),
    index: z.boolean().default(true), // Default to true, can be set to false to exclude from search indexing
  });

const blog = defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/blog' }),
    schema: baseSchema
  });

const post = defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/post' }),
    schema: baseSchema,
  });

const team = defineCollection({
    // type: 'content',
    loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/team' }),
    schema: () =>
      z.object({
        name: z.string(),
		    slug: z.string(),
        prefix: z.string().optional(), // Dr., Mr., etc.
        role: z.string(),
        highestDegree: z.string().optional(),
        shortBio: z.string(),
        experience: z.number().int().nonnegative().optional(),
        expertise: z.array(z.string()),
        awards: z.array(z.string()).optional(),
        affiliation: z.string().optional(),
        addressing: z.string().optional(), // he/him, she/her, they/them
        email: z.string().email(),
        website: z.string().url().optional(),
        color: z.string().optional(), // e.g., 'hsl(220, 80%, 70%)' or '#5588cc'
        joined: z.string().optional(), // YYYY-MM-DD
        left: z.string().optional(), // e.g., '2024-12-31'

        useGravatar: z.boolean().default(false), // fallback gravatar support
        gravatarEmail: z.string().email().optional(), // if useGravatar is true, this is used to fetch the gravatar image
        useImage: z.boolean().default(false), // use custom image instead of gravatar
        image: z.string().optional(), // custom image URL        photo: z.string().optional(), // custom image URL
        useInitial: z.boolean().optional(), // fallback initials
        initialText: z.string().max(2).optional(), // e.g., 'JS' for John Smith
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
  });

export const collections = { blog, post, team };
