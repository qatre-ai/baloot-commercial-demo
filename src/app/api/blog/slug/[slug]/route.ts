import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { transformPostCategories } from "@/lib/blog-utils";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

// GET /api/blog/slug/[slug] — fetch a blog post by slug (either slugFa or slugEn)
// Increments viewCount, includes categories and author data
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    // Decode the slug in case it's URL-encoded (Persian characters)
    const decodedSlug = decodeURIComponent(slug);

    const post = await db.blogPost.findFirst({
      where: {
        OR: [{ slugFa: decodedSlug }, { slugEn: decodedSlug }],
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                nameFa: true,
                nameEn: true,
                slugFa: true,
                slugEn: true,
                color: true,
                icon: true,
                descriptionFa: true,
                descriptionEn: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bioFa: true,
            bioEn: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment viewCount in the background (non-blocking)
    db.blogPost
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error("[BLOG_SLUG_VIEW_COUNT_INCREMENT]", err));

    return NextResponse.json(transformPostCategories(post));
  } catch (error) {
    console.error("[BLOG_SLUG_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post by slug" },
      { status: 500 }
    );
  }
}
