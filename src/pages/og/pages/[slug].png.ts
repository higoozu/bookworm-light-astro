import config from "@/config/config.json";
import { renderOgImage } from "@/lib/seo/og";
import { getCollection } from "astro:content";

const pageMeta = config.metadata?.page_meta || {};

const resolveSlug = (pathKey: string, meta: any) => {
  const ogImage = meta?.og_image as string | undefined;
  const match = ogImage?.match(/\/og\/pages\/(.+)\.png$/);
  if (match?.[1]) return match[1];
  if (pathKey === "/") return "home";
  return pathKey.replace(/\//g, "").replace(/\s+/g, "-").toLowerCase();
};

const findBySlug = (slug: string) => {
  const entries = Object.entries(pageMeta) as [string, any][];
  return entries.find(([pathKey, meta]) => resolveSlug(pathKey, meta) === slug);
};

export async function getStaticPaths() {
  const pages = await getCollection("pages");
  const pageMetaPaths = Object.entries(pageMeta).map(([pathKey, meta]) => ({
    params: { slug: resolveSlug(pathKey, meta) },
  }));
  const contentPaths = pages.map((page) => ({
    params: { slug: page.slug },
  }));
  const merged = [...pageMetaPaths, ...contentPaths];
  const seen = new Set<string>();
  return merged.filter(({ params }) => {
    if (seen.has(params.slug)) return false;
    seen.add(params.slug);
    return true;
  });
}

export async function GET({ params }: { params: { slug: string } }) {
  const entry = findBySlug(params.slug);
  const pages = await getCollection("pages");
  const contentEntry = pages.find((page) => page.slug === params.slug);

  if (!entry && !contentEntry) {
    return new Response("Not found", { status: 404 });
  }

  const meta = entry?.[1];
  const title =
    meta?.title ||
    contentEntry?.data?.meta_title ||
    contentEntry?.data?.title ||
    config.site.title;
  const subtitle =
    meta?.description ||
    contentEntry?.data?.description ||
    config.metadata.meta_description;

  const buffer = await renderOgImage({
    title,
    subtitle,
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
