import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth/session";
import {
  transformPostCategories,
  estimateReadingTime,
} from "@/lib/blog-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/blog/[id] — fetch a single blog post (increment viewCount)
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if user is admin for draft access
    const session = await getSession();
    const isAdmin = session?.userType === "admin";

    const post = await db.blogPost.findUnique({
      where: { id },
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

    // Non-admin users can only see published posts
    if (!isAdmin && !post.isPublished) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment viewCount in the background (non-blocking, only for non-admin)
    if (!isAdmin) {
      db.blogPost
        .update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        })
        .catch((err) => console.error("[BLOG_VIEW_COUNT_INCREMENT]", err));
    }

    // Return the post with transformed categories
    return NextResponse.json(transformPostCategories(post));
  } catch (error) {
    console.error("[BLOG_POST_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT /api/blog/[id] — update a blog post (admin only)
// Supports all existing fields plus: isShowOnHome, shareCount, likeCount,
// uniqueViewCount, avgReadTime, bounceRate, categoryIds
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request, "blog", "update");
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // If isPublished changes to true and publishedAt is null, set publishedAt to now
    const isPublishing = body.isPublished === true && !existing.isPublished;
    const needsPublishedAt = isPublishing && !existing.publishedAt;

    // Recalculate reading time if content changed
    let readingTime = existing.readingTime;
    if (body.contentFa !== undefined) {
      readingTime = estimateReadingTime(body.contentFa);
    }

    // Handle categoryIds update: delete old junction records, create new ones
    const { categoryIds, ...updateFields } = body;

    // Helper: convert empty strings to null for nullable fields
    const nullIfEmpty = (val: unknown) => (val === "" ? null : val);

    const updated = await db.blogPost.update({
      where: { id },
      data: {
        ...(updateFields.titleFa !== undefined && { titleFa: updateFields.titleFa }),
        ...(updateFields.titleEn !== undefined && { titleEn: updateFields.titleEn }),
        ...(updateFields.slugFa !== undefined && { slugFa: updateFields.slugFa }),
        ...(updateFields.slugEn !== undefined && { slugEn: updateFields.slugEn }),
        ...(updateFields.contentFa !== undefined && { contentFa: updateFields.contentFa }),
        ...(updateFields.contentEn !== undefined && { contentEn: updateFields.contentEn }),
        ...(updateFields.excerptFa !== undefined && { excerptFa: nullIfEmpty(updateFields.excerptFa) }),
        ...(updateFields.excerptEn !== undefined && { excerptEn: nullIfEmpty(updateFields.excerptEn) }),
        ...(updateFields.coverUrl !== undefined && { coverUrl: nullIfEmpty(updateFields.coverUrl) }),
        ...(updateFields.coverAltFa !== undefined && { coverAltFa: nullIfEmpty(updateFields.coverAltFa) }),
        ...(updateFields.coverAltEn !== undefined && { coverAltEn: nullIfEmpty(updateFields.coverAltEn) }),
        ...(updateFields.tags !== undefined && { tags: nullIfEmpty(updateFields.tags) }),
        ...(updateFields.metaTitleFa !== undefined && { metaTitleFa: nullIfEmpty(updateFields.metaTitleFa) }),
        ...(updateFields.metaTitleEn !== undefined && { metaTitleEn: nullIfEmpty(updateFields.metaTitleEn) }),
        ...(updateFields.metaDescriptionFa !== undefined && { metaDescriptionFa: nullIfEmpty(updateFields.metaDescriptionFa) }),
        ...(updateFields.metaDescriptionEn !== undefined && { metaDescriptionEn: nullIfEmpty(updateFields.metaDescriptionEn) }),
        ...(updateFields.keywords !== undefined && { keywords: nullIfEmpty(updateFields.keywords) }),
        ...(updateFields.authorId !== undefined && { authorId: nullIfEmpty(updateFields.authorId) }),
        ...(updateFields.sourceType !== undefined && {
          sourceType: updateFields.sourceType === "ai_assisted" ? "ai_assisted" : "manual",
        }),
        ...(updateFields.isPublished !== undefined && {
          isPublished: updateFields.sourceType === "ai_assisted"
            ? false
            : updateFields.isPublished,
        }),
        ...(updateFields.isFeatured !== undefined && { isFeatured: updateFields.isFeatured }),
        ...(updateFields.isShowOnHome !== undefined && { isShowOnHome: updateFields.isShowOnHome }),
        ...(updateFields.isPinned !== undefined && { isPinned: updateFields.isPinned }),
        ...(updateFields.shareCount !== undefined && { shareCount: updateFields.shareCount }),
        ...(updateFields.likeCount !== undefined && { likeCount: updateFields.likeCount }),
        ...(updateFields.uniqueViewCount !== undefined && { uniqueViewCount: updateFields.uniqueViewCount }),
        ...(updateFields.avgReadTime !== undefined && { avgReadTime: updateFields.avgReadTime }),
        ...(updateFields.bounceRate !== undefined && { bounceRate: updateFields.bounceRate }),
        ...(updateFields.order !== undefined && { order: updateFields.order }),
        readingTime,
        ...(needsPublishedAt && { publishedAt: new Date() }),
      } as Prisma.BlogPostUncheckedUpdateInput,
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

    // Update category associations if categoryIds is provided
    if (categoryIds !== undefined) {
      // Delete existing junction records
      await db.blogPostToCategory.deleteMany({
        where: { postId: id },
      });

      // Create new junction records
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await db.blogPostToCategory.createMany({
          data: categoryIds.map((catId: string) => ({
            postId: id,
            categoryId: catId,
          })),
        });
      }

      // Re-fetch to get updated categories
      const refetched = await db.blogPost.findUnique({
        where: { id },
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

      return NextResponse.json(
        refetched ? transformPostCategories(refetched) : transformPostCategories(updated)
      );
    }

    return NextResponse.json(transformPostCategories(updated));
  } catch (error) {
    console.error("[BLOG_POST_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[id] — delete a blog post (admin only)
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(_request, "blog", "delete");
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    await db.blogPost.delete({ where: { id } });

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("[BLOG_POST_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
