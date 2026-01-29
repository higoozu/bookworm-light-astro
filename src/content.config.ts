import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// About collection schema
const aboutCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/about" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      meta_title: z.string().optional(),
      description: z.string().optional(),
      image: image().optional(),
      draft: z.boolean().optional(),
      hero: z.object({
        title: z.string(),
        slogan: z.string(),
        image: image(),
      }),
      introduction: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        avatar: image().optional(),
        stats: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            icon: z.string(),
          }),
        ),
      }),
      sections: z.object({
        upcoming: z.object({
          title: z.string(),
          items: z.array(
            z.object({
              title: z.string(),
              label: z.string().optional(),
              image: image(),
            }),
          ),
        }),
        favorites: z.object({
          title: z.string(),
          items: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              image: image(),
            }),
          ),
        }),
        journey: z.object({
          title: z.string(),
          milestones: z.array(
            z.object({
              year: z.string(),
              title: z.string(),
              description: z.string(),
            }),
          ),
        }),
      }),
      cta: z
        .object({
          label: z.string(),
          link: z.string(),
        })
        .optional(),
    }),
});

// Authors collection schema
const authorsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/authors" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    image: image().optional(),
    description: z.string().optional(),
    social: z
      .object({
        facebook: z.string().url().optional(),
        x: z.string().url().optional(),
        instagram: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        website: z.string().url().optional(),
        youtube: z.string().url().optional(),
      })
      .optional(),
  }),
});

// Posts collection schema
const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts" }),
  schema: ({ image }) => z.object({ // 注意这里引入了 image 辅助函数
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    date: z.date().optional(),
    image: image().optional(), // 将 z.string() 修改为 image()
    categories: z.array(z.string()).default(["others"]),
    authors: z.array(z.string()).default(["Admin"]),
    tags: z.array(z.string()).default(["others"]),
    draft: z.boolean().optional(),
    selection: z.boolean().optional(),
  }),
});

// Pages collection schema
const pagesCollection = defineCollection({
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    layout: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// Export collections
export const collections = {
  posts: postsCollection,
  about: aboutCollection,
  authors: authorsCollection,
  pages: pagesCollection,
};
