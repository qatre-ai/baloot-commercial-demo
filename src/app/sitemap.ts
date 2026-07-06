import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mehravayebalout.ir";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/#courses`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#workshops`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/#about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/#branches`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/#contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Dynamic blog post pages
  try {
    const posts = await db.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      select: { slugFa: true, slugEn: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slugEn}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    // Blog category pages
    const categories = await db.blogCategory.findMany({
      where: { isPublished: true },
      select: { slugEn: true, updatedAt: true },
    });

    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/blog/category/${cat.slugEn}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages, ...categoryPages];
  } catch {
    // If database is unavailable, return static pages only
    return staticPages;
  }
}
