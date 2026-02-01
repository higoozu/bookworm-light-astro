import { getCollection } from "astro:content";
import matter from "gray-matter";
import path from "node:path";
import config from "@/config/config.json";
import { renderOgImage } from "@/lib/seo/og";

const rawPosts = import.meta.glob("/src/content/posts/**/*.{md,mdx}", {
  query: "?raw",
  import: "default",
});

const resolveLocalImagePath = (filePath: string, imageValue?: string) => {
  if (!imageValue) return undefined;
  if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
    return undefined;
  }
  if (imageValue.startsWith("/")) {
    return path.resolve(process.cwd(), "public", imageValue.replace(/^\//, ""));
  }
  const markdownPath = path.resolve(process.cwd(), filePath.slice(1));
  return path.resolve(path.dirname(markdownPath), imageValue);
};

const findRawEntry = async (slug: string) => {
  const entry = Object.entries(rawPosts).find(([filePath]) => {
    return (
      filePath.endsWith(`/${slug}.md`) || filePath.endsWith(`/${slug}.mdx`)
    );
  });
  if (!entry) return null;
  const [filePath, loader] = entry;
  const raw = (await loader()) as string;
  return { filePath, raw };
};

export async function getStaticPaths() {
  const posts = await getCollection("posts");
  return posts.map((post) => ({
    params: { slug: post.id },
  }));
}

export async function GET({ params }: { params: { slug: string } }) {
  const posts = await getCollection("posts");
  const post = posts.find((entry) => entry.id === params.slug);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const rawEntry = await findRawEntry(params.slug);
  const frontmatter = rawEntry?.raw ? matter(rawEntry.raw).data : {};
  const backgroundPath = resolveLocalImagePath(
    rawEntry?.filePath || "",
    frontmatter.og_image || frontmatter.image
  );

  const buffer = await renderOgImage({
    title: post.data.meta_title || post.data.title,
    subtitle:
      post.data.description ||
      post.data.summary ||
      config.metadata.meta_description,
    backgroundImagePath: backgroundPath,
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
